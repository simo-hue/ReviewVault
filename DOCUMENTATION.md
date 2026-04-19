# DOCUMENTATION

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
- [x] **Stop Scraping Feature**: Added a "Stop" button in the UI with graceful backend termination logic.
- [x] **Full Text Reliability**: Implementato un sistema di estrazione multi-livello.
- [x] **Custom Depth Feature**: Aggiunta la possibilità di estrarre esattamente 5 recensioni o un numero personalizzato tramite un nuovo campo di input validato.

**Next Steps**: User can start the application using `npm start` and manage it via GitHub.

## [2026-04-19 19:56]: Custom Depth and Validation UI
*Details*: Added flexible options for the number of reviews to extract.
*Tech Notes*:
- **UI Enhancements**: Added `5 recensioni` and `Personalizzato...` to the dropdown.
- **Dynamic Fields**: The custom input field is hidden/shown based on dropdown selection using JS class toggling.
- **Client-side Validation**: Implemented checks in `app.js` to ensure the custom depth is a positive integer before emitting the socket event.

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
