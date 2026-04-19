const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const scraper = require('./scraper');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket connection
const activeScrapers = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('start-scraping', async (data) => {
    const { url, depth } = data;
    
    if (!url) {
      socket.emit('log', { type: 'error', message: 'URL is required.' });
      return;
    }

    const stopSignal = { stopped: false };
    activeScrapers.set(socket.id, stopSignal);

    try {
      socket.emit('log', { type: 'info', message: `Starting scrape for: ${url}` });
      socket.emit('log', { type: 'info', message: `Depth set to: ${depth}` });
      
      // Call the scraper function
      const result = await scraper.run(url, depth, (logData) => {
        socket.emit('log', logData);
      }, stopSignal);

      if (stopSignal.stopped) {
          socket.emit('log', { type: 'warn', message: 'Scraping stopped by user.' });
      }

      socket.emit('finished', { 
        success: true, 
        filePath: result.filePath,
        fileName: result.fileName,
        count: result.count,
        stopped: stopSignal.stopped
      });
    } catch (error) {
      console.error('Scraping error:', error);
      socket.emit('log', { type: 'error', message: `Critical error: ${error.message}` });
      socket.emit('finished', { success: false, error: error.message });
    } finally {
      activeScrapers.delete(socket.id);
    }
  });

  socket.on('stop-scraping', () => {
    const signal = activeScrapers.get(socket.id);
    if (signal) {
      signal.stopped = true;
      console.log(`Stopping scraper for socket ${socket.id}`);
    }
  });

  socket.on('disconnect', () => {
    const signal = activeScrapers.get(socket.id);
    if (signal) signal.stopped = true;
    activeScrapers.delete(socket.id);
    console.log('Client disconnected:', socket.id);
  });
});

// Endpoint to download the generated JSON
app.get('/download/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, 'data', fileName);
  res.download(filePath);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
