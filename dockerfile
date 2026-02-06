FROM node:18-alpine

WORKDIR /app

# deps
COPY package.json package-lock.json ./
RUN npm install --production

# app files
COPY server ./server
COPY public ./public
COPY .env.path ./


EXPOSE 8080

CMD ["node", "server/server.js"]
