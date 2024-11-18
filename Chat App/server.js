const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Chat-Räume
const rooms = ['General', 'Sports', 'Tech'];

io.on('connection', (socket) => {
    let currentRoom = null;

    // Begrüßung und Namensabfrage
    socket.emit('askName');

    socket.on('setName', (name) => {
        socket.username = name;
        socket.emit('updateRooms', rooms);
    });

    // Raum beitreten
    socket.on('joinRoom', (room) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            socket.to(currentRoom).emit('message', `${socket.username} hat den Raum verlassen.`);
        }

        currentRoom = room;
        socket.join(room);
        socket.emit('message', `Willkommen im Raum: ${room}`);
        socket.to(room).emit('message', `${socket.username} hat den Raum betreten.`);
    });

    // Nachricht senden
    socket.on('chatMessage', (msg) => {
        if (currentRoom) {
            io.to(currentRoom).emit('message', `${socket.username}: ${msg}`);
        } else {
            socket.emit('message', 'Du bist in keinem Raum. Bitte wähle zuerst einen Raum.');
        }
    });

    // Benutzer verlässt den Server
    socket.on('disconnect', () => {
        if (currentRoom) {
            socket.to(currentRoom).emit('message', `${socket.username} hat den Server verlassen.`);
        }
    });
});

// Statische Dateien bereitstellen (falls Frontend vorhanden)
app.use(express.static('public'));

// Server starten
server.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
