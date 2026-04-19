# DOCUMENTATION

## [2026-04-19 21:00]: Completion & Export Visuals
*Details*: Finalized the visual documentation by adding screenshots of the task completion logs and the secure download button.
*Tech Notes*:
- **Assets**: Added `task_complete.png` and `download_button.png` to `docs/images/`.
- **Workflow Showcase**: The README now covers the entire user journey from URL input to data export.

## [2026-04-19 20:47]: Enhanced Documentation with Monitoring Details

*Details*: Added a dedicated section in README.md for real-time monitoring, featuring screenshots of the logging system and status bar.
*Tech Notes*:
- **Assets**: Added `logging_system.png` and `status_bar.png` to `docs/images/`.
- **UI/UX Showcase**: Highlighted the transparency of the extraction process using a grid-style layout in the documentation.

## [2026-04-19 20:44]: License Implementation

*Details*: Added the MIT License file and updated the README link.
*Tech Notes*:
- **Legal**: Created `LICENSE` file with 2026 copyright for "Simo".
- **Documentation**: Linked the license section in `README.md` to the local file.

## [2026-04-19 20:41]: Implementation of Live Screenshot

*Details*: Replaced the AI-generated mockup with an actual screenshot of the application in action.
*Tech Notes*:
- **Assets**: Created `docs/images/` directory to store project media.
- **Portability**: Updated `README.md` to use relative paths for images, ensuring they render correctly on platforms like GitHub.

## [2026-04-19 20:38]: Professional Project Documentation

*Details*: Created a comprehensive, professional English README.md with high-quality demo screenshots.
*Tech Notes*:
- **Aesthetics**: Integrated custom-generated professional mockups to showcase the "ReviewVault" brand.
- **Content**: Detailed features, technology stack, installation guide, and structure overview.
- **Demo**: Incorporated historical and requested demo links for immediate testing context.

## [2026-04-19 20:36]: Desktop Responsiveness & dynamic scaling

*Details*: Optimized the layout to adapt to desktop viewport height and width.
*Tech Notes*:
- **Flexbox Architecture**: Refactored the main container into a flexbox layout to allow components to scale based on available space.
- **Dynamic Console**: The console log now expands dynamically to fill vertical viewport space using `flex: 1`, ensuring optimal visibility on different screen sizes.
- **Viewport Constraints**: Added `max-height` and `vh` constraints to the main container to prevent clipping and unnecessary body scrolling.
- **Spacing Optimization**: Refined paddings and margins for better balance on wide and narrow desktop screens.


## [2026-04-19 20:34]: ReviewVault Premium Redesign & Branding
*Details*: Rebranded the application from "MapsScraper" to "ReviewVault" with a high-end, modern aesthetic.
*Tech Notes*:
- **Branding**: New name, logo (🛡️), and "Vault/Caveau" terminology integrated across the UI.
- **Visuals**: Implemented a "Cyber Navy & Electric Cyan" palette with mesh background gradients and advanced glassmorphism (blur: 20px).
- **UX**: Added entrance animations, micro-interactions for buttons, and a polished terminal-style console with glowing status indicators.
- **Refinement**: Improved input responsiveness and progress bar aesthetics with glowing effects.


## [2026-04-19 19:15]: Google Maps Review Scraper - Initial Implementation
*Details*: Created a local self-hosted web app to scrape Google Maps reviews.
*Tech Notes*:
- **Backend**: Node.js, Express, Socket.io.
- **Scraper**: Playwright with `playwright-extra` and `puppeteer-extra-plugin-stealth` for bot detection bypass.
- **Frontend**: Vanilla JS (ES6+), CSS3 (Glassmorphism), HTML5.
- **Dependencies**: `playwright`, `playwright-extra`, `puppeteer-extra-plugin-stealth`, `socket.io`, `fs-extra`, `express`.
- **Key Features**: Auto-cookie consent, lazy-loading scroll loop, incremental backups, real-time WebSocket logs, JSON download.

### Project Structure:
- `server.js`: Main Express/Socket.io entry point.
- `scraper.js`: Playwright logic for navigating and extracting reviews.
- `public/`: Frontend assets.
- `data/`: Directory where JSON results are saved.

### Current Status:
- [x] **Robust Scraper Update**: Added support for Google Search Knowledge Panels and role-based selectors.
- [x] **Reliability & Redirect Fix**: Added handling for shortened `maps.app.goo.gl` redirects and fixed empty field extraction.
- [x] **Infinite Restart Fix**: Configured nodemon to ignore the `data/` directory.
- [x] **Custom Depth Feature**: Aggiunta la possibilità di estrarre esattamente 5 recensioni o un numero personalizzato.
- [x] **Browser Closure Handling**: Implementata la gestione graziosa della chiusura manuale della finestra del browser, permettendo il salvataggio dei dati parziali anche in caso di interruzione imprevista.

**Next Steps**: User can start the application using `npm start` and manage it via GitHub.

## [2026-04-19 20:29]: Graceful Browser Closure Handling
*Details*: Prevented critical errors when the user manually closes the Chromium window.
*Tech Notes*:
- **Error Trapping**: Updated `scraper.js` to catch `Target page, context or browser has been closed` inside the main loop.
- **Partial Data Flush**: Upon detection of a closed browser, the scraper now triggers a final write of the collected `reviews` array to the data directory.
- **Server Communication**: `server.js` now differentiates between a "Critical Error" and an "Aborted/Closed" session, sending a clean `finished` event to the UI.

## [2026-04-19 19:38]: Reliability and Extraction Fix
*Details*: Fixed infinite restart loop and improved data extraction for redirected URLs.
*Tech Notes*:
- **Nodemon Config**: Added ignore pattern for `data/*` and `*.json` to prevent crashes during scraping.
- **Redirect Handling**: Integrated `waitForURL` to stabilize the page after shortened link redirection.
- **Improved EXTRACTION**: Added explicit waits for "More" button expansion and several fallback selectors for `relativeTime`.

## [2026-04-19 19:14]: Git Initialization and First Commit
*Details*: Initialized local git repository and pushed the first commit to the remote repository.
*Tech Notes*:
- Remote: https://github.com/simo-hue/ReviewVault.git
- Branch: main
- Initial commit includes core application files and .gitignore.
