FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar codigo fuente
COPY . .

# Puerto de la aplicacion
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "dev"]
