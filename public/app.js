const socket = io();

// UI Elements
const urlInput = document.getElementById('url');
const depthSelect = document.getElementById('depth');
const startBtn = document.getElementById('start-btn');
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
        updateProgress(percent);
    }
});

socket.on('finished', (data) => {
    isRunning = false;
    toggleLoading(false);
    
    if (data.success) {
        statusBadge.textContent = 'Completato';
        statusBadge.className = 'badge done';
        updateProgress(100);
        
        // Show result actions
        resultActions.classList.remove('hidden');
        finishCount.textContent = data.count;
        downloadBtn.href = `/download/${data.fileName}`;
        
        addLog(`Processo terminato con successo. ${data.count} recensioni salvate.`, 'success');
    } else {
        statusBadge.textContent = 'Errore';
        statusBadge.className = 'badge error';
        addLog(`Errore: ${data.error}`, 'error');
    }
});

// Event Listeners
startBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const depth = depthSelect.value;
    
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
    
    statusBadge.textContent = 'In esecuzione';
    statusBadge.className = 'badge running';
    
    addLog('Avvio della sessione di scraping...', 'system');
    
    // Emit start event
    socket.emit('start-scraping', { url, depth });
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
        btnText.textContent = 'Scraping in corso...';
        startBtn.disabled = true;
    } else {
        btnLoader.classList.add('hidden');
        btnText.textContent = 'Avvia Scraping';
        startBtn.disabled = false;
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
