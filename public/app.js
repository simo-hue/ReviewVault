const socket = io();

// UI Elements
const urlInput = document.getElementById('url');
const depthSelect = document.getElementById('depth');
const customDepthInput = document.getElementById('custom-depth-input');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const consoleLog = document.getElementById('console-log');
const statusBadge = document.getElementById('status-badge');
const progressBar = document.getElementById('progress-bar');
const resultActions = document.getElementById('result-actions');
const finishCount = document.getElementById('finish-count');
const downloadBtn = document.getElementById('download-btn');
const btnLoader = startBtn.querySelector('.loader-inner');
const btnText = startBtn.querySelector('span');

let isRunning = false;

// Socket Events
socket.on('log', (data) => {
    addLog(data.message, data.type);
    
    if (data.type === 'progress') {
        const percent = Math.min((data.current / data.total) * 100, 100);
        updateProgress(percent || 5); // Minimum 5% to show activity
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
    resultActions.classList.add('hidden');
    consoleLog.innerHTML = '';
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

// Helper Functions
function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span style="opacity: 0.5;">[${time}]</span> ${message}`;
    
    consoleLog.appendChild(entry);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

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
