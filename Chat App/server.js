const http = require('http');
const fs = require('fs');
const path = require('path');

// Speichert Nachrichten im Chat
let messages = [];

// Server erstellen
const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    if (req.url === '/') {
      // Lies die index.html-Datei
      const filePath = path.join(__dirname, 'index.html');
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
    } else if (req.url === '/messages') {
      // Nachrichten abrufen
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(messages));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  } else if (req.method === 'POST' && req.url === '/messages') {
    // Neue Nachricht speichern
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      const { message } = JSON.parse(body);
      messages.push(message);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Message received');
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

// Server starten
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
