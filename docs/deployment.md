# Deployment Guide

AI Meme War is designed to be easily deployable using Docker.

## Production Topology
Because real-time updates are driven by a custom Socket.IO server (`server.js`) rather than standard Serverless Functions, deploying to standard Vercel is not recommended. Vercel Serverless Functions do not support persistent WebSocket connections natively without third-party services like Pusher or Ably.

Instead, the optimal deployment strategy is a **Containerized VPS** (e.g., AWS EC2, DigitalOcean Droplet, Render).

## Docker Compose
The provided `docker-compose.yml` spins up:
1. `db`: A PostgreSQL 15 alpine instance.
2. `app`: The Next.js + Socket.IO Node.js container.

### Steps to Deploy
1. Clone the repository on your server.
2. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   # Edit .env and insert your GEMINI_API_KEY and a secure JWT_SECRET
   ```
3. Run Docker Compose:
   ```bash
   docker compose up --build -d
   ```
4. Configure your Reverse Proxy (Nginx/Caddy) to point to `localhost:3000` and ensure it is configured to allow WebSocket Upgrade headers.

### Example Nginx Configuration
```nginx
server {
    listen 80;
    server_name memewar.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```
