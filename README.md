# AI Meme War

A Vite/React meme battle frontend backed by serverless Vercel API Routes, Neon PostgreSQL, Prisma, and OpenAI.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `OPENAI_API_KEY`, and a long `JWT_SECRET` value. Neon connection strings should use TLS (`sslmode=require`).
2. Install dependencies with `npm install`.
3. Create tables locally or in Neon with `npx prisma migrate deploy` (or `npx prisma migrate dev` during local schema work).
4. Start the frontend with `npm run dev`. Run Vercel's local environment with `npx vercel dev` to serve `/api` routes too.

## API

All request bodies are JSON. Team creation and joining return a seven-day bearer token. Send it as `Authorization: Bearer <token>` for `/api/submit` and `/api/vote`; server identity always takes precedence over a supplied author/voter ID. API errors use `{ "error": "..." }` and appropriate HTTP status codes.

| Route | Method | Body/query | Purpose |
| --- | --- | --- | --- |
| `/api/team/create` | POST | `name`, `userName` | Create a team and its first member. |
| `/api/team/join` | POST | `teamId`, `userName` | Add a player to a team. |
| `/api/game/start` | POST | `teamId` | Start a five-minute team game. |
| `/api/game/end` | POST | `gameId` | End a game early. |
| `/api/generate` | POST | `prompt` | Generate a text-free meme image with OpenAI Images. |
| `/api/caption` | POST | `prompt` | Generate a meme caption with GPT. |
| `/api/submit` | POST | `gameId`, `authorId`, `imageUrl`, `prompt`, optional `caption` | Save an active-game entry. |
| `/api/vote` | POST | `memeId`, `voterId` | Add one vote; repeat votes return 409. |
| `/api/leaderboard` | GET | `?gameId=...` | Return meme entries sorted by votes. |

## Deploying to Vercel

Import the repository into Vercel, add the three environment variables in the project settings, and deploy. Vercel automatically serves files in `api/` as serverless functions; no Express server is required. Run `npx prisma migrate deploy` against the production Neon database during your deployment pipeline before serving traffic.

## Data model

`Team` has members and games. Every game lasts five minutes, receives `Meme` submissions from its own team, and has a vote leaderboard. Prisma's composite unique index on `(memeId, voterId)` enforces duplicate-vote protection at the database layer.
