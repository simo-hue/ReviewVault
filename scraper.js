const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
const fs = require('fs-extra');
const path = require('path');

chromium.use(stealth);

/**
 * Main scraper function
 * @param {string} url - Google Maps URL
 * @param {number|string} depth - Max reviews to scrape
 * @param {function} logCallback - Callback to send logs to the UI
 */
async function run(url, depth, logCallback) {
  const browser = await chromium.launch({
    headless: false, // Set to false for visibility, but stealth will help
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const maxReviews = depth === 'Tutte' ? Infinity : parseInt(depth);

  try {
    logCallback({ type: 'info', message: 'Navigating to URL...' });
    await page.goto(url, { waitUntil: 'networkidle' });

    // Handle Cookie Consent
    try {
      logCallback({ type: 'info', message: 'Checking for cookie consent...' });
      const acceptButton = page.locator('button:has-text("Accetta tutto"), button:has-text("Accept all")');
      if (await acceptButton.isVisible({ timeout: 5000 })) {
        await acceptButton.click();
        logCallback({ type: 'success', message: 'Cookie consent accepted.' });
      }
    } catch (e) {
      logCallback({ type: 'info', message: 'No cookie consent dialog found or already accepted.' });
    }

    // Wait for the page to load the business info
    await page.waitForTimeout(2000);

    // Extract Business Name for file naming
    let businessName = 'reviews';
    try {
      const nameElement = await page.locator('h1').first();
      businessName = await nameElement.innerText();
      businessName = businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    } catch (e) {
      logCallback({ type: 'warn', message: 'Could not determine business name, using default.' });
    }

    // Look for the "Reviews" tab if not already there
    // Often Google Maps URLs for businesses have a "Reviews" tab
    const reviewsTab = page.locator('button[role="tab"]:has-text("Recensioni"), button[role="tab"]:has-text("Reviews")');
    if (await reviewsTab.isVisible()) {
      await reviewsTab.click();
      logCallback({ type: 'info', message: 'Clicked on Reviews tab.' });
      await page.waitForTimeout(2000);
    }

    // The container for reviews
    // Usually it's a div with role="main" or specific class
    // In current maps, it's often a div with class containing 'm67Hec' or similar, 
    // but better to find it by its scrollable nature.
    logCallback({ type: 'info', message: 'Locating reviews container...' });
    
    // Attempt to find the scrollable container
    const scrollableSelector = 'div[role="main"], .m67Hec, .review-dialog-list';
    let scrollableElement = null;

    // Try to find the element that has the reviews
    const possibleContainers = await page.$$('div[role="main"] div[tabindex="-1"]');
    for(const container of possibleContainers) {
       const hasReviews = await container.$('.jftiEf'); // class for review block
       if(hasReviews) {
           scrollableElement = container;
           break;
       }
    }

    if (!scrollableElement) {
        // Fallback to more generic selector
        scrollableElement = await page.$('div[role="main"]');
    }

    let reviews = [];
    let lastReviewCount = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 50; // Safety break

    logCallback({ type: 'info', message: 'Starting scroll and extraction...' });

    while (reviews.length < maxReviews && scrollAttempts < maxScrollAttempts) {
      // Extract current visible reviews
      const reviewElements = await page.$$('.jftiEf'); // Current Google Maps review class
      
      for (const el of reviewElements) {
        if (reviews.length >= maxReviews) break;

        const id = await el.getAttribute('data-review-id');
        if (reviews.find(r => r.id === id)) continue;

        try {
          // Click "More" if present in the text
          const moreButton = await el.$('button:has-text("Altro"), button:has-text("More")');
          if (moreButton) await moreButton.click();

          const userName = await el.$eval('.d4r55', e => e.innerText).catch(() => 'Anonymous');
          const rating = await el.$eval('.kvMYyc', e => parseInt(e.getAttribute('aria-label'))).catch(() => 0);
          const relativeTime = await el.$eval('.rsqaod', e => e.innerText).catch(() => '');
          const text = await el.$eval('.wiI7cb', e => e.innerText).catch(() => '');
          
          // Owner response
          const ownerResponse = await el.$eval('.C7rEae', e => e.innerText).catch(() => null);

          const reviewData = {
            id,
            userName,
            rating,
            relativeTime,
            text,
            ownerResponse
          };

          reviews.push(reviewData);
          logCallback({ type: 'progress', message: `Extracted ${reviews.length} reviews...`, current: reviews.length, total: maxReviews });
          
          // Save incrementally
          await saveIncremental(businessName, reviews);
        } catch (err) {
          console.error('Error parsing individual review:', err);
        }
      }

      if (reviews.length >= maxReviews) break;

      // Scroll down
      await page.evaluate((el) => {
        if (el) {
          el.scrollTop = el.scrollHeight;
        } else {
          window.scrollBy(0, 1000);
        }
      }, scrollableElement);

      await page.waitForTimeout(2000);

      // Check if we reached the end
      if (reviews.length === lastReviewCount) {
        scrollAttempts++;
        if (scrollAttempts > 5) { // If no new reviews for 5 scrolls, assume end
            logCallback({ type: 'info', message: 'No more new reviews found, finishing...' });
            break;
        }
      } else {
        scrollAttempts = 0;
        lastReviewCount = reviews.length;
      }
    }

    const finalFileName = `reviews_${businessName}.json`;
    const finalPath = path.join(__dirname, 'data', finalFileName);
    await fs.ensureDir(path.join(__dirname, 'data'));
    await fs.writeJson(finalPath, reviews, { spaces: 2 });

    logCallback({ type: 'success', message: `Task complete! Total reviews: ${reviews.length}` });

    return {
      filePath: finalPath,
      fileName: finalFileName,
      count: reviews.length
    };

  } finally {
    await browser.close();
  }
}

async function saveIncremental(name, data) {
  const fileName = `reviews_${name}_backup.json`;
  const dir = path.join(__dirname, 'data');
  await fs.ensureDir(dir);
  await fs.writeJson(path.join(dir, fileName), data, { spaces: 2 });
}

module.exports = { run };
