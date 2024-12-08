const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");

// Server- und Datenbankkonfiguration
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const pool = new Pool({
  host: process.env.PGHOST || "my-postgres",
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "webpdatenbank",
  database: process.env.PGDATABASE || "chatapp",
  port: process.env.PGPORT || 5432,
});

// Nachrichten in der Datenbank speichern
async function saveMessageToDB(username, message, room) {
  const query = `
    INSERT INTO messages (username, message, room, timestamp)
    VALUES ($1, $2, $3, NOW())
    RETURNING *;
  `;
  const values = [username, message, room];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Fehler beim Speichern der Nachricht:", error);
    throw error;
  }
}

// Nachrichten aus der Datenbank abrufen
async function getMessagesFromDB(room) {
  const query = `
    SELECT username, message, timestamp 
    FROM messages 
    WHERE room = $1
    ORDER BY timestamp ASC;
  `;
  const values = [room];

  try {
    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error("Fehler beim Abrufen der Nachrichten:", error);
    throw error;
  }
}

// Middleware und statische Dateien
app.use(express.static("public"));

// Räume und Benutzer verwalten
const rooms = ["room1", "room2", "room3"];
const users = {};

// WebSocket-Verbindungen
io.on("connection", (socket) => {
  console.log("Ein Nutzer hat sich verbunden:", socket.id);

  // Benutzername setzen
  socket.on("setUsername", (username) => {
    users[socket.id] = { username, room: null };
    updateUsers();
  });

  // Raum wechseln
  socket.on("joinRoom", async (room) => {
    if (!rooms.includes(room)) {
      socket.emit("message", "Ungültiger Raum!");
      return;
    }

    const user = users[socket.id];
    if (user.room) {
      socket.leave(user.room);
    }

    user.room = room;
    socket.join(room);

    try {
      const chatHistory = await getMessagesFromDB(room);
      socket.emit("chatHistory", chatHistory);
    } catch (error) {
      console.error("Fehler beim Laden des Chatverlaufs:", error);
      socket.emit("message", "Fehler beim Laden des Chatverlaufs.");
    }

    io.to(room).emit("message",`${user.username} ist dem Raum ${room} beigetreten.`);
    updateUsers();
  });

  // Nachricht senden
  socket.on("chatMessage", async (message) => {
    const user = users[socket.id];
    if (!user || !user.room || !rooms.includes(user.room)) return;

    const room = user.room;
    const fullMessage = { user: user.username, text: message };

    try {
      await saveMessageToDB(user.username, message, room);
    } catch (error) {
      console.error("Fehler beim Speichern der Nachricht in der DB:", error);
    }

    io.to(room).emit("message", fullMessage);
  });

  // Verbindung trennen
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      if (user.room) {
        io.to(user.room).emit("message", `${user.username} hat den Raum verlassen.`);
      }
      delete users[socket.id];
      updateUsers();
    }
    console.log("Ein Nutzer hat die Verbindung getrennt:", socket.id);
  });

  // Benutzerliste aktualisieren
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

// Server starten
const PORT = 3000;
server.listen(PORT, () => console.log(`Server läuft auf http://localhost:${PORT}`));