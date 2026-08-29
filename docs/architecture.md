# Architecture Overview

## Tech Stack
*   **Frontend**: Next.js 15 (App Router), React, TypeScript, TailwindCSS, Framer Motion
*   **Backend**: Custom Node.js Server (`server.js`) wrapping Next.js API Routes + Socket.IO
*   **Database**: PostgreSQL with Prisma ORM
*   **AI**: Google Gemini API (Text & Image generation)

## Components
1.  **Host Dashboard**: Used for creating and managing competitions, starting timers, and revealing memes.
2.  **Team Meme Studio**: The core interaction area where teams generate ideas, captions, and images using AI.
3.  **Audience Interface**: A real-time mobile-optimized voting screen and live leaderboard.

## Data Flow
*   **REST APIs**: Used for persistent actions (authentication, creating competitions, saving final submissions).
*   **WebSockets**: Used for ephemeral, real-time actions (live timer sync, participant count updates, live voting leaderboard updates).
