# Live Voting System

AI Meme War uses a secure, real-time voting architecture designed to prevent tampering while remaining completely anonymous.

## Validation & Security
- **Audience Sessions**: When an audience member joins, `/api/audience/join` generates a UUID and sets it securely in an HTTP-only `audience_session` cookie.
- **Vote Submission**: Votes are cast to `/api/votes`. The endpoint verifies:
  1. The cookie exists and decrypts to a valid session.
  2. The round is currently in the `VOTING` state.
  3. No existing record in the `Vote` table matches the `voterSession` for that specific `roundId`.

## Real-Time Synchronization
Instead of continuously polling or keeping complex server-side socket state for votes:
1. The client makes a secure REST request to submit the vote.
2. If successful, the client emits `voteUpdateSignal` to the Socket.IO server.
3. The server broadcasts `voteUpdate` to all clients in the room.
4. Clients displaying the leaderboard automatically re-fetch the latest counts and gracefully animate the new ranks using Framer Motion's `layout` properties.
