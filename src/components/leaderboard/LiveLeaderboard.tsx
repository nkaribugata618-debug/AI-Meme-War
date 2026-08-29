"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "@/lib/socket-client";
import { Trophy } from "lucide-react";

export interface LeaderboardEntry {
  id: string;
  teamName: string;
  imageUrl: string;
  votes: number;
  aiScore: number;
  combinedScore: number;
}

interface Props {
  roundId: string;
  teamNamesRevealed: boolean;
}

export default function LiveLeaderboard({ roundId, teamNamesRevealed }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winnerCommentary, setWinnerCommentary] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/leaderboard?roundId=${roundId}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setWinnerCommentary(data.winnerCommentary);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  }, [roundId]);

  useEffect(() => {
    fetchLeaderboard();
    socket.on("voteUpdate", fetchLeaderboard);
    return () => {
      socket.off("voteUpdate", fetchLeaderboard);
    };
  }, [fetchLeaderboard]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <h2 className="text-3xl font-bold text-center text-white mb-4">Live Leaderboard</h2>
      
      {winnerCommentary && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 p-6 rounded-2xl mb-8 text-center"
        >
          <p className="text-xl text-white font-medium italic">"{winnerCommentary}"</p>
          <p className="text-sm text-pink-300 mt-2 font-bold uppercase tracking-widest">🎤 Host AI</p>
        </motion.div>
      )}

      <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
        <ul className="flex flex-col gap-4">
          <AnimatePresence>
            {leaderboard.map((entry, index) => (
              <motion.li
                key={entry.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`flex items-center gap-6 p-4 rounded-xl border ${
                  index === 0 ? "bg-yellow-500/20 border-yellow-500/50" : "bg-slate-800 border-slate-700"
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/30 text-2xl font-bold text-slate-300">
                  {index === 0 ? <Trophy className="text-yellow-400" /> : `#${index + 1}`}
                </div>
                
                <div 
                  className="w-16 h-16 bg-cover bg-center rounded-lg border border-white/10" 
                  style={{ backgroundImage: `url(${entry.imageUrl})` }} 
                />
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white">
                    {teamNamesRevealed ? entry.teamName : `Team ???`}
                  </h3>
                  <div className="text-sm text-slate-400 mt-1 flex gap-4">
                    <span>👥 Audience: {entry.votes}</span>
                    <span>🤖 AI: {entry.aiScore}/100</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-3xl font-bold text-pink-400">{entry.combinedScore.toFixed(1)}</p>
                  <p className="text-sm text-slate-400 uppercase tracking-widest">Total Score</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {leaderboard.length === 0 && (
          <p className="text-center text-slate-500 py-8">No final submissions yet.</p>
        )}
      </div>
    </div>
  );
}
