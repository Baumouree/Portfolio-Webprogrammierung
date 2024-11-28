const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require('pg');

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

module.exports = pool;

//Sql Funktionen//

//Inserted die Daten von einer Nachricht in die Datenbank
async function insertData(username, message, room) {
  const query = `
    INSERT INTO Nachrichten (username, message, room)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  try {
    // Führe die Abfrage aus
    const res = await pool.query(query, [username, message, room]);
    console.log('Eingefügte Daten:', res.rows[0]);
  } catch (err) {
    console.error('Fehler beim Einfügen:', err);
  } finally {
    // Verbindung schließen (optional bei wiederholten Anfragen)
    // await pool.end();
  }
}
//holt die Nachrichten informationen aus der Datenbank
async function getData(){
  const query = `
  SELECT * FROM messages;
  `;
  try{
  const messageData = await pool.query(query)
  } catch (err){
    console.error('Fehler beim Abrufen der Daten:', err);
    throw err; // Fehler weitergeben, falls nötig
  }
  return messageData;
}
//speichert die Nachrichten in der Datenbank
async function saveMessageToDB(username, message, room) {
  try {
    const query = `
      INSERT INTO messages (username, message, room, timestamp)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;
    const values = [username, message, room];

    const result = await pool.query(query, values);
    return result.rows[0]; // Gibt die gespeicherte Nachricht zurück
  } catch (error) {
    console.error("Fehler beim Speichern der Nachricht:", error);
    throw error; // Fehler weitergeben, falls benötigt
  }
}
// Funktion zum Abrufen von Nachrichten eines Raums
async function getMessagesFromDB(room) {
  try {
    const query = `
      SELECT username, message, timestamp 
      FROM messages 
      WHERE room = $1
      ORDER BY timestamp ASC;
    `;
    const values = [room];

    const result = await pool.query(query, values);
    return result.rows; // Gibt die Nachrichten des Raums zurück
  } catch (error) {
    console.error("Fehler beim Abrufen der Nachrichten:", error);
    throw error; // Fehler weitergeben, falls benötigt
  }
}


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

  socket.on("joinRoom", async (room) => {
    if (rooms.includes(room)) {
      const user = users[socket.id];
      if (user.room) {
        socket.leave(user.room);
      }
  
      user.room = room;
      socket.join(room);
  
      // Nachrichten aus der Datenbank abrufen und senden
      try {
        const chatHistory = await getMessagesFromDB(room);
        socket.emit("chatHistory", chatHistory); // Nachrichten an den Benutzer senden
      } catch (error) {
        console.error("Fehler beim Laden des Chatverlaufs:", error);
        socket.emit("message", "Fehler beim Laden des Chatverlaufs.");
      }
  
      io.to(room).emit("message", `${user.username} ist dem Raum ${room} beigetreten.`);
      updateUsers();
    } else {
      socket.emit("message", "Ungültiger Raum!");
    }
  });
// Nachricht an einen Raum senden
socket.on("chatMessage", async (message) => {
  const user = users[socket.id];
  if (user.room && rooms.includes(user.room)) {
    const room = user.room;
    const fullMessage = { user: user.username, text: message };

    // Nachricht im Speicher (Array) hinzufügen
    messages[room].push(fullMessage);

    // Nachricht in der Datenbank speichern
    try {
      await saveMessageToDB(user.username, message, room);
    } catch (error) {
      console.error("Fehler beim Speichern der Nachricht in der DB:", error);
    }

    // Nachricht an den Raum senden
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
