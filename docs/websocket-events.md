# WebSocket Architecture & Events

AI Meme War uses a custom `node server.js` setup wrapping both Next.js App Router and `socket.io` to achieve high-performance real-time synchronization.

## Namespaces & Rooms
- Connections occur on the root namespace `/`.
- Clients join a room specifically by `roomCode` (e.g. `ABCD12`).
- Timer data and state are tracked entirely in server memory (`rooms` Map) for 0ms latency broadcasts without DB bottlenecks.

## Server-to-Client Events (Downstream)
- `stateUpdate (CompetitionState)`: Sent whenever the host modifies the competition state (e.g., status changes, round starts).
- `timerUpdate ({ remainingSeconds, isPaused })`: Emitted every 1 second while a timer is active, and immediately when paused/resumed.
- `participantCount (number)`: Fired to all clients in a room when a user joins or disconnects.

## Client-to-Server Events (Upstream)
- `joinRoom (roomCode, role, entityId?)`: Dispatched automatically by Team/Audience/Host clients upon connection to synchronize to the correct isolated room.
- `hostCommand (roomCode, command, payload?)`: Exclusively dispatched by the Host to transition the state machine.

### Host Commands
1. `START_ROUND`: Initializes a timer interval on the server and broadcasts the prompt.
2. `PAUSE_TIMER`: Stops the server interval temporarily.
3. `RESUME_TIMER`: Restarts the server interval.
4. `LOCK_SUBMISSIONS`: Forces a hard stop to the current round.
5. `START_PRESENTATION`: Transitions state to presentation view.
6. `START_VOTING`: Transitions state to audience voting view.
7. `END_VOTING`: Closes the current round.

## Reconnection Strategy
The Next.js client uses `autoConnect: false` initially and establishes connection programmatically within `useEffect`. `socket.io-client` handles exponential backoff automatically up to 10 reconnection attempts. State is instantly refreshed upon a successful `joinRoom` emission after reconnecting.
