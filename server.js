/* eslint-disable @typescript-eslint/no-require-imports */
const { createServer } = require("node:http");
const next = require("next");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const { jwtVerify } = require("jose");

const secretKey = process.env.JWT_SECRET || "default_secret";
const key = new TextEncoder().encode(secretKey);

async function decrypt(input) {
  const { payload } = await jwtVerify(input, key, { algorithms: ["HS256"] });
  return payload;
}

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((res, c) => {
    const [key, val] = c.trim().split('=').map(decodeURIComponent);
    return Object.assign(res, { [key]: val });
  }, {});
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();

const rooms = new Map();
const roomCleanups = new Map();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    let currentRoom = null;

    socket.on("joinRoom", async (roomCode, role) => {
      roomCode = roomCode.toUpperCase();
      
      const cookies = parseCookies(socket.request.headers.cookie);
      let verifiedRole = "GUEST";
      
      try {
        if (role === "HOST" && cookies.host_session) {
          const payload = await decrypt(cookies.host_session);
          if (payload.role === "HOST") verifiedRole = "HOST";
        } else if (role === "TEAM" && cookies.team_session) {
          const payload = await decrypt(cookies.team_session);
          if (payload.role === "TEAM" && payload.roomCode === roomCode) verifiedRole = "TEAM";
        } else if (role === "AUDIENCE" && cookies.audience_session) {
          const payload = await decrypt(cookies.audience_session);
          if (payload.role === "AUDIENCE" && payload.roomCode === roomCode) verifiedRole = "AUDIENCE";
        }
      } catch (e) {
        console.error(`[Socket Auth Error] ${socket.id}`, e.message);
      }
      
      // If someone tries to claim a role without valid tokens, downgrade or reject
      if (role !== "GUEST" && verifiedRole === "GUEST") {
         console.warn(`[${roomCode}] Rejected unauthorized join attempt by ${socket.id} claiming to be ${role}`);
         socket.emit("error", { message: "Unauthorized socket connection" });
         return;
      }
      
      socket.join(roomCode);
      socket.data.role = verifiedRole;
      currentRoom = roomCode;

      if (!rooms.has(roomCode)) {
        try {
          const comp = await prisma.competition.findUnique({ where: { roomCode } });
          rooms.set(roomCode, {
            timerInterval: null,
            remainingSeconds: 0,
            isPaused: false,
            state: {
              status: comp ? comp.status : "LOBBY",
              roundStatus: "SETUP",
              roundNumber: 0,
              roundId: null,
              prompt: "",
              presentationSlideIndex: 0,
              teamNamesRevealed: false,
              presentationSubmissions: [],
            }
          });
        } catch (e) {
          console.error("[Socket DB Error]", e);
          rooms.set(roomCode, {
            timerInterval: null,
            remainingSeconds: 0,
            isPaused: false,
            state: {
              status: "LOBBY",
              roundStatus: "SETUP",
              roundNumber: 0,
              roundId: null,
              prompt: "",
              presentationSlideIndex: 0,
              teamNamesRevealed: false,
              presentationSubmissions: [],
            }
          });
        }
      }

      const roomData = rooms.get(roomCode);
      if (roomData) {
        socket.emit("stateUpdate", roomData.state);
        socket.emit("timerUpdate", { remainingSeconds: roomData.remainingSeconds, isPaused: roomData.isPaused });
      }
      
      if (roomCleanups.has(roomCode)) {
        clearTimeout(roomCleanups.get(roomCode));
        roomCleanups.delete(roomCode);
      }
      
      const count = io.sockets.adapter.rooms.get(roomCode)?.size || 0;
      io.to(roomCode).emit("participantCount", count);
    });

    socket.on("hostCommand", async (roomCode, command, payload) => {
      roomCode = roomCode.toUpperCase();
      
      if (socket.data.role !== "HOST") {
        console.warn(`[${roomCode}] Unauthorized command attempt by ${socket.id}`);
        return;
      }

      const roomData = rooms.get(roomCode);
      if (!roomData) return;

      console.log(`[${roomCode}] Host Command: ${command}`, payload);

      switch (command) {
        case "START_ROUND":
          roomData.state.status = "ACTIVE";
          roomData.state.roundStatus = "ACTIVE";
          roomData.state.roundNumber = payload?.roundNumber || 1;
          roomData.state.roundId = payload?.roundId || null;
          roomData.state.prompt = payload?.prompt || "Make a meme about... AI!";
          roomData.state.presentationSlideIndex = 0;
          roomData.state.teamNamesRevealed = false;
          
          roomData.remainingSeconds = payload?.duration || 300; 
          roomData.isPaused = false;
          
          if (roomData.timerInterval) clearInterval(roomData.timerInterval);
          
          roomData.timerInterval = setInterval(() => {
            if (!roomData.isPaused && roomData.remainingSeconds > 0) {
              roomData.remainingSeconds--;
              io.to(roomCode).emit("timerUpdate", { 
                remainingSeconds: roomData.remainingSeconds, 
                isPaused: roomData.isPaused 
              });
              if (roomData.remainingSeconds === 0) {
                 roomData.state.roundStatus = "LOCKED";
                 io.to(roomCode).emit("stateUpdate", roomData.state);
              }
            }
          }, 1000);

          io.to(roomCode).emit("stateUpdate", roomData.state);
          // Broadcast initial timer
          io.to(roomCode).emit("timerUpdate", { 
            remainingSeconds: roomData.remainingSeconds, 
            isPaused: roomData.isPaused 
          });
          break;

        case "PAUSE_TIMER":
          roomData.isPaused = true;
          io.to(roomCode).emit("timerUpdate", { remainingSeconds: roomData.remainingSeconds, isPaused: true });
          break;
          
        case "RESUME_TIMER":
          roomData.isPaused = false;
          io.to(roomCode).emit("timerUpdate", { remainingSeconds: roomData.remainingSeconds, isPaused: false });
          break;
          
        case "LOCK_SUBMISSIONS":
          roomData.state.roundStatus = "LOCKED";
          roomData.isPaused = true;
          io.to(roomCode).emit("stateUpdate", roomData.state);

          // [AI PIPELINE] Asynchronous AI Judging
          if (roomData.state.roundId) {
             const roundId = roomData.state.roundId;
             const prompt = roomData.state.prompt;
             (async () => {
                try {
                   const { aiConfig } = await import("./src/config/ai.ts");
                   if (!aiConfig.toggles.enableAiJudging) return;
                   
                   const { GeminiProvider } = await import("./src/lib/ai/gemini-provider.ts");
                   const apiKey = process.env.GEMINI_API_KEY || "";
                   if (!apiKey) return;
                   const provider = new GeminiProvider(apiKey);
                   
                   const subs = await prisma.submission.findMany({ where: { roundId, isFinal: true } });
                   for (const sub of subs) {
                      if (sub.imageUrl && !sub.aiScore) {
                         try {
                            const score = await provider.judgeMeme(sub.imageUrl, prompt);
                            const commentary = aiConfig.toggles.enableAiCommentary ? 
                               await provider.generateCommentary(sub.imageUrl, prompt) : null;
                               
                            await prisma.submission.update({
                               where: { id: sub.id },
                               data: { aiScore: score, aiCommentary: commentary }
                            });
                         } catch (err) {
                            console.error(`[AI] Failed to judge submission ${sub.id}`, err);
                         }
                      }
                   }
                } catch (e) {
                   console.error("[AI] Judging Pipeline Error", e);
                }
             })();
          }
          break;
          
        case "START_PRESENTATION":
          if (roomData.state.roundId) {
            try {
              const subs = await prisma.submission.findMany({
                where: { roundId: roomData.state.roundId, isFinal: true },
                include: { team: { select: { name: true } } },
                orderBy: { createdAt: "asc" }
              });
              roomData.state.presentationSubmissions = subs.map((s) => ({
                id: s.id,
                teamName: s.team.name,
                imageUrl: s.imageUrl,
                aiScore: s.aiScore,
                aiCommentary: s.aiCommentary
              }));
            } catch (e) {
              console.error("[Socket] Failed to load submissions", e);
              roomData.state.presentationSubmissions = [];
            }
          } else {
            roomData.state.presentationSubmissions = [];
          }
          roomData.state.presentationSlideIndex = 0;
          roomData.state.teamNamesRevealed = false;
          roomData.state.roundStatus = "PRESENTATION";
          io.to(roomCode).emit("stateUpdate", roomData.state);
          break;
          
        case "START_VOTING":
          roomData.state.roundStatus = "VOTING";
          io.to(roomCode).emit("stateUpdate", roomData.state);
          break;
          
        case "END_VOTING":
          roomData.state.roundStatus = "COMPLETED";
          io.to(roomCode).emit("stateUpdate", roomData.state);
          
          // [AI PIPELINE] Generate Winner Commentary
          if (roomData.state.roundId) {
             const roundId = roomData.state.roundId;
             (async () => {
                try {
                   const { aiConfig } = await import("./src/config/ai.ts");
                   if (!aiConfig.toggles.enableWinnerCommentary) return;
                   
                   const subs = await prisma.submission.findMany({ 
                       where: { roundId },
                       include: { team: true, _count: { select: { votes: true } } }
                   });
                   const totalVotes = subs.reduce((sum, s) => sum + s._count.votes, 0);
                   
                   const formatted = subs.map(s => {
                      const audienceRaw = s._count.votes;
                      const aiRaw = s.aiScore || 0;
                      const audienceNorm = totalVotes > 0 ? (audienceRaw / totalVotes) * 100 : 0;
                      const combined = (audienceNorm * aiConfig.weights.audience) + (aiRaw * aiConfig.weights.ai);
                      return { team: s.team.name, votes: audienceRaw, aiScore: aiRaw, combined };
                   }).sort((a,b) => b.combined - a.combined);
                   
                   if (formatted.length > 0) {
                      const topTeams = formatted.slice(0, 3).map((f, i) => `#${i+1} ${f.team} (Score: ${f.combined.toFixed(1)})`).join(", ");
                      const { GeminiProvider } = await import("./src/lib/ai/gemini-provider.ts");
                      const apiKey = process.env.GEMINI_API_KEY || "";
                      if (apiKey) {
                         const provider = new GeminiProvider(apiKey);
                         const commentary = await provider.generateWinnerSummary(topTeams);
                         await prisma.round.update({
                            where: { id: roundId },
                            data: { winnerCommentary: commentary }
                         });
                      }
                   }
                } catch (e) {
                   console.error("[AI] Winner Commentary Error", e);
                }
             })();
          }
          break;
          
        case "NEXT_MEME":
          const count = roomData.state.presentationSubmissions?.length || 0;
          if (count === 0) {
            roomData.state.roundStatus = "VOTING";
            roomData.state.presentationSlideIndex = 0;
          } else if (roomData.state.presentationSlideIndex < count - 1) {
            roomData.state.presentationSlideIndex++;
            roomData.state.teamNamesRevealed = false; // reset for next meme
          } else {
            // Auto transition to voting
            roomData.state.roundStatus = "VOTING";
          }
          io.to(roomCode).emit("stateUpdate", roomData.state);
          break;
          
        case "PREV_MEME":
          roomData.state.presentationSlideIndex = Math.max(0, roomData.state.presentationSlideIndex - 1);
          roomData.state.teamNamesRevealed = false;
          io.to(roomCode).emit("stateUpdate", roomData.state);
          break;
          
        case "REVEAL_TEAMS":
          roomData.state.teamNamesRevealed = true;
          io.to(roomCode).emit("stateUpdate", roomData.state);
          break;
          
        case "NEXT_ROUND":
          roomData.state.roundStatus = "SETUP";
          io.to(roomCode).emit("stateUpdate", roomData.state);
          break;
          
        case "END_COMPETITION":
          roomData.state.status = "COMPLETED";
          io.to(roomCode).emit("stateUpdate", roomData.state);
          break;
      }
    });

    socket.on("voteUpdateSignal", (roomCode) => {
      roomCode = roomCode.toUpperCase();
      io.to(roomCode).emit("voteUpdate");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      if (currentRoom) {
        const count = io.sockets.adapter.rooms.get(currentRoom)?.size || 0;
        io.to(currentRoom).emit("participantCount", count);
        
        if (count === 0) {
          const timeout = setTimeout(() => {
            const roomData = rooms.get(currentRoom);
            if (roomData && roomData.timerInterval) {
              clearInterval(roomData.timerInterval);
            }
            rooms.delete(currentRoom);
            roomCleanups.delete(currentRoom);
            console.log(`Cleaned up idle room: ${currentRoom}`);
          }, 30 * 60 * 1000); // 30 minutes
          
          roomCleanups.set(currentRoom, timeout);
        }
      }
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
