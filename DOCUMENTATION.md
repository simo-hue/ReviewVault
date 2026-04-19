# DOCUMENTATION

## [2026-04-19 21:28]: Dual-Mode "ReviewVault" System (Extract & Read)
*Details*: Re-architected the main application into a dual-mode system. Users can now switch between "Estrai" (Real-time Scraping) and "Leggi" (Offline Vault Reader). The reader allows users to visualize previously exported JSON files using the same premium interface.
*Tech Notes*:
- **App Switching**: Implemented a high-level mode navigator using a segmented button layout with smooth section transitions.
- **Vault Reader**: 
    - Added a high-end drag-and-drop zone with "float" animations and file system integration.
    - Implemented a secure frontend-only JSON parser to load "Caveau" files.
    - Integrated multi-format support: can read both raw review arrays and structured objects containing business metadata.
- **Reusable Architecture**: Enhanced the `createReviewCard` and `copyReviewToClipboard` logic to be context-aware, supporting both real-time extraction feeds and offline reader views.
- **UX Improvements**: 
    - Added breadcrumbs/status headers for the reader view showing the loaded business name and total review count.
    - Prevented accidental navigation during active extraction with user confirmation prompts.
    - Responsive "Close" action to reset the reader and return to the drop zone.

## [2026-04-19 21:18]: Robust Text Sanitization & Professional UI Refresh
*Details*: Solved the issue where unprintable characters (appearing as squares) were visible in the preview. Significantly enhanced the visualizer UI to feel more premium and professional.
*Tech Notes*:
- **Character Sanitization**: Implemented a robust `sanitizeText` function in the frontend that uses regex to strip control characters (`\x00-\x1F`) and handle Google Maps metadata noise more effectively.
- **Improved UI Components**: 
    - Added user avatars generated from initials.
    - Redesigned review cards with better typography, spacing, and subtle hover effects.
    - Integrated star ratings into a dedicated "badge" style container.
- **New Feature - Copy to Clipboard**: Added a one-click copy button to every review card with visual feedback upon success.
- **Empty State Handling**: Added clear messaging and styling for reviews with no text content.

## [2026-04-19 21:06]: Robust Business Name Detection
*Details*: Implemented a multi-layered fallback system to identify the business name during scraping, resolving the "Could not determine business name" issue.
*Tech Notes*:
- **Multi-Strategy Detection**:
    1. **Extended Selectors**: Added support for modern Google Maps H1 classes (`DUwDvf`, `fontHeadlineLarge`) and Search Knowledge Panel identifiers.
    2. **Metadata Fallback**: Added extraction from `page.title()` for both Maps and Search layouts.
    3. **URL Heuristics**: Implemented URL decoding and parsing to extract names from Google Maps place paths.
    4. **Structured Data**: Integrated JSON-LD (Schema.org) parsing to retrieve the official business name from the page's search metadata.
- **Improved Sanitization**: Enhanced the filename sanitization process to ensure compatibility and added timestamped fallbacks as a final fail-safe.
- **Logging**: Integrated success messages that inform the user which strategy was successful in detecting the name.

## [2026-04-19 21:05]: Real-time Data Visualization (Caveau Preview)
*Details*: Implemented a dynamic "Visualizzatore del file JSON" that allows users to see reviews as they are being extracted. Users can now switch between technical logs and a premium preview of the extracted data without interrupting the process.
*Tech Notes*:
- **Real-time Streaming**: Modified `scraper.js` to pipe individual review objects through the Socket.io connection.
- **Dynamic UI**: Added a view switcher in the status header using a segmented control design.
- **Review Vault Viewer**: Created a dedicated viewer that renders reviews in "cards" with star ratings, automatic noise cleaning (removing "Local Guide", "Share" etc), and responsive layout.
- **Visual Enhancements**: Added hover micro-animations and entrance transitions for each new review card.
- **Persistence**: The viewer maintains the local state of reviews during the session, allowing seamless switching.

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
- [x] **Vault Reader**: Offline JSON reader implemented.
- [x] **Robust Scraper Update**: Added support for Google Search Knowledge Panels and role-based selectors.
- [x] **Reliability & Redirect Fix**: Added handling for shortened `maps.app.goo.gl` redirects and fixed empty field extraction.
- [x] **Infinite Restart Fix**: Configured nodemon to ignore the `data/` directory.
- [x] **Browser Closure Handling**: Implementata la gestione graziosa della chiusura manuale della finestra del browser.
