const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische Dateien im Ordner "public" bereitstellen
app.use(express.static('public'));

// Event wenn sich ein Client verbindet
io.on('connection', (socket) => {
    console.log('Ein Benutzer hat sich verbunden.');

    // Empfang und Weiterleitung von Nachrichten an alle Clients
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // Benutzer hat die Verbindung getrennt
    socket.on('disconnect', () => {
        console.log('Benutzer hat die Verbindung getrennt.');
    });
});

// Server starten
server.listen(3000, () => {
    console.log('Server läuft auf http://localhost:3000');
});
