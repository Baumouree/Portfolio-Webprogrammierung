# Basis-Image verwenden
FROM node:18

# Arbeitsverzeichnis erstellen
WORKDIR /chat_app

# Nur package.json und package-lock.json kopieren (Caching von npm install)
COPY package*.json ./

# Installiere Abhängigkeiten inklusive pg
RUN npm install

# Kopiere den Rest des Codes ins Arbeitsverzeichnis
COPY . .

# Exponiere den Port, auf dem die App läuft
EXPOSE 3000

# Startbefehl für den Container
CMD ["npm", "run", "dev"]

