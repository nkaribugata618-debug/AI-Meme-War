"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/lib/socket-client";
import { CompetitionState, DEFAULT_STATE } from "@/lib/socket-events";
import { Card, CardContent } from "@/components/ui/card";
import VotingPad from "@/components/audience/VotingPad";
import LiveLeaderboard from "@/components/leaderboard/LiveLeaderboard";
import { motion, AnimatePresence } from "framer-motion";

export default function AudienceView() {
  const params = useParams();
  const roomCode = params.roomCode as string;

  const [state, setState] = useState<CompetitionState>(DEFAULT_STATE);
  const [participants, setParticipants] = useState(0);

  useEffect(() => {
    socket.connect();
    
    socket.on("connect", () => {
      socket.emit("joinRoom", roomCode, "AUDIENCE");
    });

    socket.on("stateUpdate", setState);
    socket.on("participantCount", setParticipants);

    return () => {
      socket.off("connect");
      socket.off("stateUpdate");
      socket.off("participantCount");
      socket.disconnect();
    };
  }, [roomCode]);

  const submissions = state.presentationSubmissions || [];
  const index = Math.min(state.presentationSlideIndex, Math.max(0, submissions.length - 1));
  const currentSubmission = submissions[index];

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10 mb-8">
        <h1 className="text-xl font-bold text-white">AI Meme War</h1>
        <p className="text-sm text-slate-400">
          Room: <span className="text-pink-400 font-mono">{roomCode}</span> 
          <span className="mx-2">•</span> 
          Audience: {participants}
        </p>
      </header>

      <main className="flex-1 flex flex-col">
        {state.status === "LOBBY" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl font-bold text-white mb-4 animate-pulse">Waiting for host to start...</h2>
            <p className="text-xl text-slate-400">Get ready to judge the best memes.</p>
          </div>
        )}

        {(state.status === "ACTIVE" && (state.roundStatus === "SETUP" || state.roundStatus === "ACTIVE" || state.roundStatus === "LOCKED")) && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Card className="border-pink-500/30 bg-pink-500/5 max-w-2xl w-full">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl text-pink-400 mb-2">Round {state.roundNumber} is in progress</h2>
                <p className="text-4xl font-bold text-white mb-8">{state.prompt}</p>
                <div className="inline-block px-4 py-2 bg-slate-900 rounded-full text-slate-300">
                  {state.roundStatus === "LOCKED" ? "Teams are done building!" : "Teams are currently building..."}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {state.status === "ACTIVE" && state.roundStatus === "PRESENTATION" && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <h2 className="text-2xl text-pink-500 font-bold mb-1">Round {state.roundNumber}</h2>
              <p className="text-white opacity-80">{state.prompt}</p>
            </div>
            
            <AnimatePresence mode="wait">
              {currentSubmission ? (
                <motion.div
                  key={currentSubmission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center w-full max-w-lg"
                >
                  <Card className="w-full bg-white/5 border-white/10 overflow-hidden shadow-xl">
                    <CardContent className="p-0">
                      <div 
                        className="w-full aspect-square bg-contain bg-center bg-no-repeat bg-black"
                        style={{ backgroundImage: `url(${currentSubmission.imageUrl})` }}
                      />
                    </CardContent>
                  </Card>
                  
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: state.teamNamesRevealed ? 1 : 0, height: state.teamNamesRevealed ? "auto" : 0 }}
                    className="mt-6 text-center overflow-hidden w-full"
                  >
                    <h3 className="text-2xl font-bold text-white tracking-wide">
                      Created by <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">{currentSubmission.teamName}</span>
                    </h3>
                    {currentSubmission.aiCommentary && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: state.teamNamesRevealed ? 1 : 0 }} 
                        transition={{ delay: 0.5 }}
                        className="mt-4 p-4 bg-purple-900/40 border border-purple-500/30 rounded-xl max-w-md mx-auto"
                      >
                        <p className="text-lg text-purple-200 italic">"{currentSubmission.aiCommentary}"</p>
                        <p className="text-xs text-purple-400/80 mt-1 uppercase tracking-wider font-semibold">🤖 AI Judge</p>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <div className="text-xl text-slate-500">Waiting for memes...</div>
              )}
            </AnimatePresence>
          </div>
        )}

        {state.status === "ACTIVE" && state.roundStatus === "VOTING" && state.roundId && (
          <VotingPad roundId={state.roundId} roomCode={roomCode} />
        )}

        {(state.roundStatus === "COMPLETED" || state.status === "COMPLETED") && state.roundId && (
          <LiveLeaderboard roundId={state.roundId} teamNamesRevealed={state.teamNamesRevealed} />
        )}
      </main>
    </div>
  );
}
