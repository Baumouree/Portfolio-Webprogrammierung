# Verwende das offizielle Node.js Image als Basis
FROM node:18

# Arbeitsverzeichnis im Container erstellen und setzen
WORKDIR /app

# Kopiere die package.json und package-lock.json ins Arbeitsverzeichnis
COPY package*.json ./

# Installiere die Abhängigkeiten
RUN npm install

# Kopiere den Rest des Anwendungs-Codes
COPY . .

# Exponiere den Port, auf dem der Server läuft
EXPOSE 3000

# Starte die Anwendung
CMD ["npm", "start"]
