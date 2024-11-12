const express = require('express');
const http = require('http');
const { Server } = require('socket.io'); // Socket.io importieren
const mongoose = require('mongoose'); // MongoDB für mögliche Persistenz

const app = express();
const server = http.createServer(app);
const io = new Server(server); // Socket.io mit dem HTTP-Server verbinden

// MongoDB-Verbindung (nur falls Persistenz benötigt wird)
mongoose.connect('mongodb://mongo:27017/chat', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB verbunden'))
  .catch((err) => console.error('MongoDB-Verbindungsfehler:', err));

// Statischer Pfad für den Client (Frontend)
app.use(express.static('public'));

// Socket.io-Verbindung und -Ereignisse
io.on('connection', (socket) => {
  console.log('Ein Benutzer hat sich verbunden');

  // Nachrichtenempfang vom Client
  socket.on('chat message', (msg) => {
    // Nachricht an alle verbundenen Clients senden
    io.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Ein Benutzer hat die Verbindung getrennt');
  });
});

// Standardroute
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // Sende die Client-HTML-Seite
});

// Server starten
server.listen(3000, () => {
  console.log('Server läuft auf Port 3000');
});
