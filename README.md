# AI Meme War

A live competition platform where teams compete to create the funniest AI-generated meme within a time limit, followed by live audience voting.

## Tech Stack
- **Frontend**: Next.js 15, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes + Custom Node.js Socket.IO server
- **Database**: PostgreSQL (managed via Prisma ORM)
- **AI Integration**: Google Gemini API (Ideas, Captions, Images)
- **Deployment**: Docker & Docker Compose

## Features
- 🎤 **Host Presentation Mode**: Full-screen projector-friendly view.
- 🎨 **Meme Studio**: Drag-and-drop canvas with AI text generation.
- 🗳️ **Live Voting**: Secure, cookie-validated audience voting.
- 🏆 **Live Leaderboard**: Real-time Framer Motion animated rankings.
- 📊 **Analytics**: Export CSV/PDF reports of the competition.

## Installation & Local Development

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```

3. **Database Setup**:
   Ensure PostgreSQL is running locally, then push the schema:
   ```bash
   npx prisma db push
   ```

4. **Run the App**:
   Because we use a custom Socket.IO server alongside Next.js, run:
   ```bash
   npm run build
   node server.js
   ```
   *Note: Standard `npm run dev` might not start the socket server natively without nodemon wrapping `server.js`.*

## Docker Deployment (Production)

To run the entire stack (PostgreSQL + App) in a production environment:

1. Ensure Docker and Docker Compose are installed.
2. Provide your AI key directly (or place it in a `.env` file):
   ```bash
   GEMINI_API_KEY="your-key-here" docker compose up --build -d
   ```
3. The app will be available on `http://localhost:3000`.

## Documentation
Check out the `/docs` folder for deep architectural dives:
- [API Reference](docs/api.md)
- [Architecture](docs/architecture.md)
- [Database Schema](docs/database.md)
- [Deployment Guide](docs/deployment.md)
- [Presentation Mode](docs/presentation.md)
- [Voting System](docs/voting.md)
- [Analytics & Export](docs/analytics.md)
