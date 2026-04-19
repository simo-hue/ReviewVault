const socket = io();

// UI Elements
const urlInput = document.getElementById('url');
const depthSelect = document.getElementById('depth');
const customDepthInput = document.getElementById('custom-depth-input');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const consoleLog = document.getElementById('console-log');
const reviewViewer = document.getElementById('review-viewer');
const viewLogsBtn = document.getElementById('view-logs-btn');
const viewPreviewBtn = document.getElementById('view-preview-btn');
const statusBadge = document.getElementById('status-badge');
const progressBar = document.getElementById('progress-bar');
const resultActions = document.getElementById('result-actions');
const finishCount = document.getElementById('finish-count');
const downloadBtn = document.getElementById('download-btn');
const btnLoader = startBtn.querySelector('.loader-inner');
const btnText = startBtn.querySelector('span');

// Mode Switches
const modeExtractBtn = document.getElementById('mode-extract-btn');
const modeReadBtn = document.getElementById('mode-read-btn');
const extractView = document.getElementById('extract-view');
const readView = document.getElementById('read-view');

// Reader Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const readViewerContainer = document.getElementById('read-viewer-container');
const readViewer = document.getElementById('read-viewer');
const readBusinessName = document.getElementById('read-business-name');
const readStatsBadge = document.getElementById('read-stats-badge');
const closeReadBtn = document.getElementById('close-read-btn');

// Modal Elements
const reviewModal = document.getElementById('review-modal');
const modalContent = document.getElementById('modal-content');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalOverlay = reviewModal.querySelector('.modal-overlay');

let isRunning = false;
let reviews = [];
let readReviews = [];

// Socket Events
socket.on('log', (data) => {
    addLog(data.message, data.type);
    
    if (data.type === 'progress') {
        const percent = Math.min((data.current / data.total) * 100, 100);
        updateProgress(percent || 5); // Minimum 5% to show activity
        
        if (data.review) {
            addReview(data.review);
        }
    }
});

socket.on('finished', (data) => {
    isRunning = false;
    toggleLoading(false);
    
    if (data.success) {
        statusBadge.textContent = data.stopped ? 'Interrotto' : 'Archiviato';
        statusBadge.className = data.stopped ? 'badge warn' : 'badge done';
        
        if (!data.stopped) updateProgress(100);
        
        resultActions.classList.remove('hidden');
        finishCount.textContent = data.count;
        downloadBtn.href = `/download/${data.fileName}`;
        
        const msg = data.stopped 
            ? `Estrazione interrotta. ${data.count} recensioni archiviate nel caveau.`
            : `Estrazione completata! ${data.count} recensioni archiviate nel caveau.`;
        addLog(msg, data.stopped ? 'warn' : 'success');
    } else {
        statusBadge.textContent = 'Errore';
        statusBadge.className = 'badge error';
        addLog(`Errore nel caveau: ${data.error}`, 'error');
    }
});

socket.on('disconnect', () => {
    if (isRunning) {
        addLog('Connessione al server persa. Tentativo di riconnessione...', 'warn');
    }
});

socket.on('connect', () => {
    if (isRunning) {
        addLog('Connessione ripristinata.', 'success');
    }
});

// Event Listeners
viewLogsBtn.addEventListener('click', () => {
    viewLogsBtn.classList.add('active');
    viewPreviewBtn.classList.remove('active');
    consoleLog.classList.remove('hidden');
    reviewViewer.classList.add('hidden');
});

viewPreviewBtn.addEventListener('click', () => {
    viewLogsBtn.classList.remove('active');
    viewPreviewBtn.classList.add('active');
    consoleLog.classList.add('hidden');
    reviewViewer.classList.remove('hidden');
});

depthSelect.addEventListener('change', () => {
    if (depthSelect.value === 'custom') {
        customDepthInput.classList.remove('hidden');
    } else {
        customDepthInput.classList.add('hidden');
    }
});

startBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    let depth = depthSelect.value;
    
    if (depth === 'custom') {
        const customValue = customDepthInput.value.trim();
        if (!customValue || isNaN(customValue) || parseInt(customValue) < 1) {
            addLog('Inserisci un numero valido di recensioni.', 'error');
            shakeElement(customDepthInput);
            return;
        }
        depth = parseInt(customValue);
    }
    
    if (!url) {
        addLog('Inserisci un URL valido di Google Maps.', 'error');
        shakeElement(urlInput);
        return;
    }

    if (isRunning) return;

    // Reset UI
    isRunning = true;
    reviews = [];
    resultActions.classList.add('hidden');
    consoleLog.innerHTML = '';
    reviewViewer.innerHTML = '<div class="empty-state"><p>In attesa di nuove recensioni...</p></div>';
    updateProgress(0);
    toggleLoading(true);
    
    statusBadge.textContent = 'In estrazione';
    statusBadge.className = 'badge running';
    
    addLog('Apertura caveau digitale e avvio estrazione...', 'system');
    
    // Emit start event
    socket.emit('start-scraping', { url, depth });
});

stopBtn.addEventListener('click', () => {
    if (!isRunning) return;
    
    addLog('Richiesta di chiusura caveau inviata...', 'warn');
    socket.emit('stop-scraping');
    stopBtn.disabled = true;
    stopBtn.innerHTML = '<span>Chiusura in corso...</span>';
});

// Mode Navigation Logic
modeExtractBtn.addEventListener('click', () => {
    modeExtractBtn.classList.add('active');
    modeReadBtn.classList.remove('active');
    extractView.classList.remove('hidden');
    readView.classList.add('hidden');
});

modeReadBtn.addEventListener('click', () => {
    if (isRunning) {
        if (!confirm('L\'estrazione è in corso. Vuoi passare alla modalità lettura? Il processo continuerà in background.')) {
            return;
        }
    }
    modeExtractBtn.classList.remove('active');
    modeReadBtn.classList.add('active');
    extractView.classList.add('hidden');
    readView.classList.remove('hidden');
});

// Reader Logic
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

closeReadBtn.addEventListener('click', () => {
    readViewerContainer.classList.add('hidden');
    dropZone.classList.remove('hidden');
    readReviews = [];
    readViewer.innerHTML = '';
});

function handleFile(file) {
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert('Per favore, seleziona un file JSON valido.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            processReadData(data, file.name);
        } catch (err) {
            console.error(err);
            alert('Errore durante la lettura del file. Assicurati che sia un JSON valido.');
        }
    };
    reader.readAsText(file);
}

function processReadData(data, fileName) {
    // Determine business name from file name if not in data
    let businessName = data.businessName || fileName.replace('.json', '').replace('reviews_', '');
    
    // Normalize data structure (handle both array and object formats)
    const reviewsToLoad = Array.isArray(data) ? data : (data.reviews || []);
    
    if (reviewsToLoad.length === 0) {
        alert('Il file non contiene recensioni valide.');
        return;
    }

    readReviews = reviewsToLoad;
    readBusinessName.textContent = businessName;
    readStatsBadge.textContent = `${readReviews.length} Recensioni`;
    
    renderReadReviews(readReviews);
    
    dropZone.classList.add('hidden');
    readViewerContainer.classList.remove('hidden');
}

// Modal Logic
function openReviewModal(review) {
    modalContent.innerHTML = '';
    const cardBody = createReviewCard(review, false, false);
    modalContent.appendChild(cardBody);
    reviewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
}

function closeReviewModal() {
    reviewModal.classList.add('hidden');
    document.body.style.overflow = '';
}

modalCloseBtn.addEventListener('click', closeReviewModal);
modalOverlay.addEventListener('click', closeReviewModal);

// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !reviewModal.classList.contains('hidden')) {
        closeReviewModal();
    }
});

function renderReadReviews(reviewsList) {
    readViewer.innerHTML = '';
    reviewsList.forEach(review => {
        const card = createReviewCard(review, true);
        readViewer.appendChild(card);
    });
}

// Helper Functions
function sanitizeText(text, userName = null) {
    if (!text) return '';
    
    let clean = text;

    // 1. Remove Private Use Area characters (Google icons like stars, menu, like, share icons)
    clean = clean.replace(/[\uE000-\uF8FF]/g, '');

    // 2. Remove literal brackets noise often found in raw exports
    clean = clean.replace(/\[\]/g, '');

    // 3. Remove "Like" and "Share" blocks (common in container innerText)
    // We look for these words at the end or separated by newlines
    clean = clean.replace(/\n+(Like|Share|Mi piace|Condividi)(\s*(Like|Share|Mi piace|Condividi))*\s*$/gi, '');
    
    // 4. Remove "Response from the owner" artifacts if leaked into main text
    clean = clean.replace(/\n*Response from the owner.*$/is, '');
    clean = clean.replace(/\n*Risposta (dal|del) proprietario.*$/is, '');

    // 5. Handle the metadata header (Name, Local Guide stats, Date)
    if (clean.includes('Local Guide')) {
        // Find the date pattern which usually precedes the actual text
        const datePattern = /(?:\d+\s+)?(?:month|year|week|day|hour|minute|mese|anno|settimana|giorno|ora|minuto)s?\s+(?:ago|fa)/i;
        const match = clean.match(datePattern);
        if (match) {
            const index = clean.indexOf(match[0]) + match[0].length;
            const possibleText = clean.substring(index).trim();
            if (possibleText.length > 10) { // heuristics to ensure we have content
                clean = possibleText;
            }
        }
    }

    // 6. Remove the username if it appears at the very beginning
    if (userName && clean.toLowerCase().startsWith(userName.toLowerCase())) {
        clean = clean.substring(userName.length).trim();
        // Remove leading dots, bullets or newlines after the name
        clean = clean.replace(/^[ \n\r·•]+/, ''); 
    }

    // 7. Remove "More" / "Altro" artifacts
    clean = clean.replace(/More\s*$/i, '');
    clean = clean.replace(/Altro\s*$/i, '');
    
    // 8. Global cleanup of control characters and weird symbols
    clean = clean.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFFFD]/g, '');
    
    // 9. Normalize whitespace: reduce excessive newlines to max 2
    clean = clean.replace(/\r/g, '');
    clean = clean.replace(/\n{3,}/g, '\n\n');
    
    return clean.trim();
}

function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="opacity: 0.5;">[${time}]</span> ${message}`;
    
    consoleLog.appendChild(entry);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

function addReview(review) {
    if (reviews.length === 0) {
        reviewViewer.innerHTML = '';
    }
    
    // Check if review already exists
    if (reviews.find(r => r.id === review.id)) return;
    
    reviews.push(review);
    const card = createReviewCard(review);
    reviewViewer.prepend(card);
}

function createReviewCard(review, isReadMode = false, allowExpand = true) {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.id = isReadMode ? `read-review-${review.id}` : `review-${review.id}`;
    
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const cleanText = sanitizeText(review.text, review.userName);
    const cleanResponse = sanitizeText(review.ownerResponse);

    card.innerHTML = `
        <div class="card-header">
            <div class="user-info">
                <div class="user-avatar">${(review.userName || 'U').charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <span class="user-name">${review.userName || 'Utente Google'}</span>
                    <span class="review-date">${review.relativeTime || ''}</span>
                </div>
            </div>
            <div class="card-top-right">
                <div class="rating-stars">${stars}</div>
                <button class="copy-review-btn" onclick="event.stopPropagation(); copyReviewToClipboard('${review.id}', ${isReadMode})" title="Copia testo">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
        </div>
        <div class="review-text">${cleanText || '<span class="no-text">Nessun commento testuale.</span>'}</div>
        ${cleanResponse ? `
            <div class="owner-response">
                <span class="response-label">Risposta del proprietario</span>
                <p>${cleanResponse}</p>
            </div>
        ` : ''}
    `;

    if (allowExpand) {
        card.addEventListener('click', () => openReviewModal(review));
    }
    
    return card;
}

// Global scope for onclick
window.copyReviewToClipboard = async (id, isReadMode = false) => {
    const reviewsList = isReadMode ? readReviews : reviews;
    const review = reviewsList.find(r => r.id === id);
    if (!review) return;
    
    const textToCopy = `Recensione di ${review.userName} (${review.rating} stelle):\n${sanitizeText(review.text, review.userName)}`;
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        const prefix = isReadMode ? 'read-review-' : 'review-';
        const btn = document.querySelector(`#${prefix}${id} .copy-review-btn`);
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = originalHtml;
            btn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
};

function updateProgress(percent) {
    progressBar.style.width = `${percent}%`;
}

function toggleLoading(loading) {
    if (loading) {
        btnLoader.classList.remove('hidden');
        btnText.textContent = 'Estrazione in corso...';
        startBtn.disabled = true;
        
        stopBtn.classList.remove('hidden');
        stopBtn.disabled = false;
        stopBtn.innerHTML = '<span>Ferma Processo</span>';
        startBtn.classList.add('hidden');
    } else {
        btnLoader.classList.add('hidden');
        btnText.textContent = 'Inizia Estrazione';
        startBtn.disabled = false;
        
        stopBtn.classList.add('hidden');
        startBtn.classList.remove('hidden');
    }
}

function shakeElement(el) {
    el.style.borderColor = 'var(--error)';
    el.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(-5px)' },
        { transform: 'translateX(5px)' },
        { transform: 'translateX(0)' }
    ], { duration: 300 });
}
