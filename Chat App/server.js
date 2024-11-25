const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische Dateien bereitstellen
app.use(express.static("public"));

// Räume und Nutzer verwalten
const rooms = ["room1", "room2", "room3"];
const messages = { room1: [], room2: [], room3: [] };
const users = {}; // Speichert {socketId: {username, room}}

io.on("connection", (socket) => {
  console.log("Ein Nutzer hat sich verbunden:", socket.id);

  // Nutzername und Raum speichern
  socket.on("setUsername", (username) => {
    users[socket.id] = { username, room: null };
    updateUsers();
  });

  // Benutzer tritt einem Raum bei
  socket.on("joinRoom", (room) => {
    if (rooms.includes(room)) {
      const user = users[socket.id];
      if (user.room) {
        socket.leave(user.room);
      }

      user.room = room;
      socket.join(room);

      // Nur Nachrichten des neuen Raums senden
      socket.emit("chatHistory", messages[room]);

      io.to(room).emit("message", `${user.username} ist dem Raum ${room} beigetreten.`);
      updateUsers();
    } else {
      socket.emit("message", "Ungültiger Raum!");
    }
  });

  // Nachricht an einen Raum senden
  socket.on("chatMessage", (message) => {
    const user = users[socket.id];
    if (user.room && rooms.includes(user.room)) {
      const room = user.room;
      const fullMessage = { user: user.username, text: message };
      messages[room].push(fullMessage);

      io.to(room).emit("message", fullMessage);
    }
  });

  // Wenn ein Nutzer die Verbindung trennt
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      const room = user.room;
      if (room) {
        io.to(room).emit("message", `${user.username} hat den Raum verlassen.`);
      }
      delete users[socket.id];
      updateUsers();
    }
    console.log("Ein Nutzer hat die Verbindung getrennt:", socket.id);
  });

  // Aktualisiert die Liste der Benutzer
  function updateUsers() {
    const roomUsers = rooms.reduce((acc, room) => {
      acc[room] = Object.values(users)
        .filter((user) => user.room === room)
        .map((user) => user.username);
      return acc;
    }, {});

    io.emit("userList", roomUsers);
  }
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));
