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
 * @param {object} stopSignal - Object with a 'stopped' boolean property
 */
async function run(url, depth, logCallback, stopSignal) {
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Handle Redirection (especially for maps.app.goo.gl)
    if (url.includes('maps.app.goo.gl')) {
        logCallback({ type: 'info', message: 'Handling redirect...' });
        await page.waitForURL(/google\.com\/maps/, { timeout: 30000 });
        await page.waitForLoadState('networkidle');
    }

    // Handle Cookie Consent
    try {
      logCallback({ type: 'info', message: 'Checking for cookie consent...' });
      const acceptButton = page.locator('button:has-text("Accetta tutto"), button:has-text("Accept all"), [aria-label*="Accetta"], [aria-label*="Accept"]');
      if (await acceptButton.count() > 0 && await acceptButton.first().isVisible({ timeout: 5000 })) {
        await acceptButton.first().click();
        logCallback({ type: 'success', message: 'Cookie consent accepted.' });
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      logCallback({ type: 'info', message: 'No cookie consent dialog found.' });
    }

    // Detect Layout: Maps vs Search
    const currentUrl = page.url();
    const isSearch = currentUrl.includes('google.com/search');
    logCallback({ type: 'info', message: `Layout detected: ${isSearch ? 'Google Search' : 'Google Maps'}` });

    if (isSearch) {
      logCallback({ type: 'info', message: 'Searching for reviews link in Knowledge Panel...' });
      const reviewsLink = page.locator('a[data-async-trigger^="review"], span:has-text("recensioni su Google"), span:has-text("Google reviews"), [aria-label*="recensioni su Google"], [aria-label*="Google reviews"]').first();
      
      if (await reviewsLink.isVisible({ timeout: 10000 })) {
        await reviewsLink.click();
        logCallback({ type: 'info', message: 'Reviews modal opened.' });
        await page.waitForTimeout(3000);
      } else {
        logCallback({ type: 'warn', message: 'Could not find "Reviews" link, trying fallback...' });
      }
    } else {
      // Google Maps Layout
      // Wait for the business name to be sure the panel is loaded
      await page.waitForSelector('h1', { timeout: 15000 }).catch(() => {});
      
      const reviewsTab = page.locator('button[role="tab"][aria-label*="Recensioni"], button[role="tab"][aria-label*="Reviews"]');
      if (await reviewsTab.count() > 0 && await reviewsTab.first().isVisible()) {
        await reviewsTab.first().click();
        logCallback({ type: 'info', message: 'Clicked on Reviews tab.' });
        await page.waitForTimeout(2000);
      }
    }

    // Extract Business Name
    let businessName = 'reviews';
    try {
      // More robust selectors for title
      const nameElement = await page.locator('h1.DUwDvf, h1, [data-attrid="title"]').first();
      businessName = await nameElement.innerText();
      businessName = businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      logCallback({ type: 'info', message: `Business Name: ${businessName}` });
    } catch (e) {
       logCallback({ type: 'warn', message: 'Could not determine business name.' });
    }

    // Locate Scrollable Container
    logCallback({ type: 'info', message: 'Identifying scrollable container...' });
    
    await page.waitForSelector('[data-review-id]', { timeout: 15000 }).catch(() => {});

    const scrollableSelectors = [
      'div[role="feed"]',
      'div[role="main"] div[tabindex="-1"]',
      '.review-dialog-list',
      '.m67Hec'
    ];

    let scrollableElement = null;
    for (const selector of scrollableSelectors) {
      const found = page.locator(selector).first();
      if (await found.isVisible()) {
        scrollableElement = found;
        logCallback({ type: 'info', message: `Found scrollable container: ${selector}` });
        break;
      }
    }

    let reviews = [];
    let lastReviewCount = 0;
    let staleCount = 0;
    const maxScrollAttempts = 100;

    logCallback({ type: 'info', message: 'Starting extraction phase...' });

    for (let i = 0; i < maxScrollAttempts; i++) {
      if (reviews.length >= maxReviews || stopSignal.stopped) break;

      // Extract current reviews
      const reviewElements = await page.locator('[data-review-id]').all();
      
      for (const el of reviewElements) {
        if (reviews.length >= maxReviews || stopSignal.stopped) break;

        const id = await el.getAttribute('data-review-id');
        if (reviews.find(r => r.id === id)) continue;

        try {
          // 1. Expand "More" or "Altro" to get full text
          const moreBtn = el.locator('button:has-text("Altro"), button:has-text("More"), [aria-label*="Altro"], [aria-label*="More"]').first();
          if (await moreBtn.isVisible()) {
              await moreBtn.click();
              await page.waitForTimeout(600); // Give it time to expand
          }

          // 2. Click "Show original" or "Mostra originale" to avoid auto-translation issues
          const originalBtn = el.locator('button:has-text("Mostra originale"), button:has-text("Show original"), [aria-label*="originale"], [aria-label*="original"]').first();
          if (await originalBtn.isVisible()) {
              await originalBtn.click();
              await page.waitForTimeout(600);
          }
          
          if (stopSignal.stopped) break;

          // 3. Extract User Name
          const userName = await el.locator('.d4r55, .XE7CHf, span[style*="font-weight: 500"], .TSUbDb').first().innerText().catch(() => 'Anonymous');
          
          // 4. Extract Rating
          const ratingElement = await el.locator('span[aria-label*="stell"], span[aria-label*="star"]').first();
          const ratingLabel = await ratingElement.getAttribute('aria-label').catch(() => '0');
          const rating = parseInt(ratingLabel) || 0;

          // 5. Extract Relative Time (Date)
          let relativeTime = await el.locator('.rsqaod, .PuaHbe, .dehXG, .xpcV0c').first().innerText().catch(() => '');
          if (!relativeTime) {
             relativeTime = await el.locator('span:has-text("fa"), span:has-text("ago")').first().innerText().catch(() => '');
          }

          // 6. Extract FULL Review Text (with fallbacks)
          // Look for common text containers
          const textLocators = [
            '.wiI7cb',       // Standard Maps
            '.K7oB9b',       // Search KP
            '.MyTu7c',       // Alternative
            '.review-text',  // Generic
            'span.review-full-text'
          ];
          
          let text = '';
          for (const selector of textLocators) {
              const content = await el.locator(selector).first().innerText().catch(() => '');
              if (content.trim()) {
                  text = content.trim();
                  break;
              }
          }

          // If still empty, try to find the largest text block in the element
          if (!text) {
              text = await el.evaluate(node => {
                  const items = node.querySelectorAll('span, div');
                  let longest = '';
                  for (const item of items) {
                      const t = item.innerText || '';
                      if (t.length > longest.length) longest = t;
                  }
                  return longest;
              }).catch(() => '');
          }
          
          // 7. Extract Owner Response
          const ownerResponse = await el.locator('.C7rEae, .m778B, .wiI7cb').nth(1).innerText().catch(() => null);

          if (!text && !userName) continue; 

          const data = { id, userName, rating, relativeTime, text, ownerResponse };
          reviews.push(data);
          
          logCallback({ 
            type: 'progress', 
            message: `Scraped ${reviews.length} reviews...`, 
            current: reviews.length, 
            total: maxReviews 
          });

          await saveIncremental(businessName, reviews);
        } catch (err) {
          // Skip individual errors
        }
      }

      if (reviews.length >= maxReviews || stopSignal.stopped) break;

      // Infinite Scroll Logic
      if (scrollableElement) {
        await scrollableElement.evaluate((el) => {
            el.scrollBy(0, 1000);
            return el.scrollTop;
        });
      } else {
        await page.mouse.wheel(0, 2000);
      }
      
      await page.waitForTimeout(2000);

      if (reviews.length === lastReviewCount) {
        staleCount++;
        if (staleCount > 10) {
            logCallback({ type: 'info', message: 'No new reviews detected. Ending.' });
            break;
        }
      } else {
        staleCount = 0;
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
