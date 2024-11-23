# Basis-Image
FROM node:18

# Arbeitsverzeichnis erstellen
WORKDIR /app

# Kopiere package.json und package-lock.json
COPY package*.json ./

# Installiere Abhängigkeiten
RUN npm install

# Kopiere den Rest des Codes
COPY . .

# Port freigeben
EXPOSE 3000

# Startbefehl
CMD ["node", "server.js"]
