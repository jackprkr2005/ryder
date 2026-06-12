# Ryder — backend + front-end in one container
# Serves the app, REST API and WebSocket realtime from a single port.
FROM node:22-slim

WORKDIR /app

# install backend deps first (better layer caching)
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

# copy the whole app (front-end at repo root + server/)
COPY . .

ENV PORT=3000
EXPOSE 3000

# node:sqlite needs the experimental flag on Node 22
CMD ["node", "--experimental-sqlite", "server/server.js"]
