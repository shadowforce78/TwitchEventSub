FROM node:20-alpine

# Dossier de travail
WORKDIR /app

# Copier manifestes et installer deps
COPY package*.json ./
RUN npm install --production

# Copier le reste du code
COPY . .

# Expose le port interne (celui utilisé par ton app)
EXPOSE 1234

# Commande de démarrage (adapte si package.json a un autre script)
CMD ["npm", "start"]
