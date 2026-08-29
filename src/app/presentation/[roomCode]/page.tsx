"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/lib/socket-client";
import { CompetitionState, DEFAULT_STATE } from "@/lib/socket-events";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize } from "lucide-react";

export default function PresentationMode() {
  const params = useParams();
  const roomCode = params.roomCode as string;

  const [state, setState] = useState<CompetitionState>(DEFAULT_STATE);

  useEffect(() => {
    socket.connect();
    socket.on("connect", () => {
      socket.emit("joinRoom", roomCode, "HOST");
    });
    socket.on("stateUpdate", setState);

    return () => {
      socket.off("stateUpdate", setState);
    };
  }, [roomCode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        socket.emit("hostCommand", roomCode, "NEXT_MEME");
      } else if (e.key === "ArrowLeft") {
        socket.emit("hostCommand", roomCode, "PREV_MEME");
      } else if (e.key === " ") { // Spacebar to reveal
        socket.emit("hostCommand", roomCode, "REVEAL_TEAMS");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [roomCode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  };

  if (state.roundStatus !== "PRESENTATION" && state.roundStatus !== "VOTING" && state.roundStatus !== "COMPLETED") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <h1 className="text-4xl text-slate-500 font-bold tracking-widest">WAITING FOR PRESENTATION</h1>
        <button onClick={toggleFullscreen} className="absolute top-4 right-4 text-slate-500 hover:text-white">
          <Maximize className="w-6 h-6" />
        </button>
      </div>
    );
  }

  const submissions = state.presentationSubmissions || [];
  const index = Math.min(state.presentationSlideIndex, Math.max(0, submissions.length - 1));
  const currentSubmission = submissions[index];

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative">
      <button onClick={toggleFullscreen} className="absolute top-4 right-4 text-slate-500 hover:text-white z-50">
        <Maximize className="w-6 h-6" />
      </button>

      <div className="absolute top-8 left-8 z-50">
        <h2 className="text-2xl text-pink-500 font-bold">Round {state.roundNumber}</h2>
        <p className="text-xl text-white opacity-80">{state.prompt}</p>
      </div>

      <div className="absolute top-8 right-16 z-50">
         <p className="text-xl text-slate-400 font-mono">
            {submissions.length > 0 ? `Meme ${index + 1} of ${submissions.length}` : ""}
         </p>
      </div>

      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        <AnimatePresence mode="wait">
          {currentSubmission ? (
            <motion.div
              key={currentSubmission.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex flex-col items-center w-full max-w-5xl"
            >
              <div 
                className="w-full aspect-square md:aspect-auto md:h-[70vh] bg-contain bg-center bg-no-repeat shadow-2xl shadow-pink-500/20"
                style={{ backgroundImage: `url(${currentSubmission.imageUrl})` }}
              />
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: state.teamNamesRevealed ? 1 : 0, y: state.teamNamesRevealed ? 0 : 20 }}
                className="mt-8 text-center"
              >
                <h3 className="text-4xl font-bold text-white tracking-wide">
                  Created by <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">{currentSubmission.teamName}</span>
                </h3>
                {currentSubmission.aiCommentary && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: state.teamNamesRevealed ? 1 : 0 }} 
                    transition={{ delay: 0.5 }}
                    className="mt-4 p-4 bg-purple-900/40 border border-purple-500/30 rounded-xl inline-block max-w-2xl"
                  >
                    <p className="text-xl text-purple-200 italic">"{currentSubmission.aiCommentary}"</p>
                    <p className="text-sm text-purple-400/80 mt-1 uppercase tracking-wider font-semibold">🤖 AI Judge</p>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ) : (
            <div className="text-2xl text-slate-500">No submissions found.</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
