const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Chat-Räume
const rooms = ['General', 'Sports', 'Tech'];

// Eingeloggte User
const connectedUsers = new Map();

io.on('connection', (socket) => {
    let currentRoom = null;

    // Begrüßung und Namensabfrage
    socket.emit('askName');

    // Benutzername setzen
    socket.on('setName', (username) => {
        connectedUsers.set(socket.id, { id: socket.id, name: username });
        console.log(`${username} hat sich verbunden.`);
        io.emit('updateUserList', Array.from(connectedUsers.values())); // Nutzerliste aktualisieren
        socket.emit('updateRooms', rooms); // Räume an den neuen Nutzer senden
    });

    // Raum beitreten
    socket.on('joinRoom', (room) => {
        if (currentRoom) {
            socket.leave(currentRoom);
            socket.to(currentRoom).emit('message', `${connectedUsers.get(socket.id).name} hat den Raum verlassen.`);
        }

        currentRoom = room;
        socket.join(room);
        socket.emit('message', `Willkommen im Raum: ${room}`);
        socket.to(room).emit('message', `${connectedUsers.get(socket.id).name} hat den Raum betreten.`);
    });

    // Nachricht senden
    socket.on('chatMessage', (msg) => {
        if (currentRoom) {
            const username = connectedUsers.get(socket.id)?.name || 'Unbekannt';
            io.to(currentRoom).emit('message', `${username}: ${msg}`);
        } else {
            socket.emit('message', 'Du bist in keinem Raum. Bitte wähle zuerst einen Raum.');
        }
    });

    // Benutzer verlässt den Server
    socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id);
        if (currentRoom && user) {
            socket.to(currentRoom).emit('message', `${user.name} hat den Server verlassen.`);
        }
        connectedUsers.delete(socket.id);
        io.emit('updateUserList', Array.from(connectedUsers.values()));
    });
});

// Statische Dateien bereitstellen (falls Frontend vorhanden)
app.use(express.static('public'));

// Server starten
server.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
