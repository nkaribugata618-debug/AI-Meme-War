# API Documentation

## Authentication Routes
*   `POST /api/auth/register`: Register a new Host user.
*   `POST /api/auth/login`: Login as a Host user. Returns HttpOnly JWT.
*   `POST /api/auth/logout`: Clears the HttpOnly JWT.

## Host Routes
*   `POST /api/host/competitions`: Create a new competition (returns a roomCode).
*   `GET /api/host/competitions`: List all competitions for the logged-in Host.

## Team Routes
*   `POST /api/team/join`: Join a competition using a room code. Sets an anonymous `team_session` cookie.

## Audience Routes
*   `POST /api/audience/join`: Join a competition using a room code. Sets an anonymous `audience_session` cookie.
*   `POST /api/audience/vote`: Submit a vote for a meme. Validated against the session cookie.
