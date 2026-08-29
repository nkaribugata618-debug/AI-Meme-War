"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket-client";
import { Button } from "@/components/ui/button";
import { LeaderboardEntry } from "@/components/leaderboard/LiveLeaderboard";
import { CheckCircle } from "lucide-react";

interface Props {
  roundId: string;
  roomCode: string;
}

export default function VotingPad({ roundId, roomCode }: Props) {
  const [submissions, setSubmissions] = useState<LeaderboardEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch submissions for voting
    const fetchSubmissions = async () => {
      try {
        const res = await fetch(`/api/leaderboard?roundId=${roundId}`);
        const data = await res.json();
        if (data.success) {
          // Shuffle submissions to avoid bias based on submission time
          const shuffled = data.leaderboard.sort(() => 0.5 - Math.random());
          setSubmissions(shuffled);
        }
      } catch (err) {
        console.error("Failed to fetch submissions", err);
      }
    };
    fetchSubmissions();
  }, [roundId]);

  const submitVote = async () => {
    if (!selectedId) return;
    
    if (!confirm("Are you sure? You can only vote once per round!")) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: selectedId, roundId }),
      });
      const data = await res.json();

      if (data.success) {
        setHasVoted(true);
        // Ping server to update leaderboard for everyone
        socket.emit("voteUpdateSignal", roomCode);
      } else {
        setError(data.error || "Failed to submit vote");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasVoted) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <CheckCircle className="w-16 h-16 text-green-500" />
        <h2 className="text-3xl font-bold text-white">Vote Locked In!</h2>
        <p className="text-slate-400">Look at the main screen to see the live leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Cast Your Vote</h2>
        <p className="text-slate-400">Select the funniest meme. You only get one vote!</p>
      </div>

      {error && <p className="text-red-400 text-center bg-red-900/30 py-2 rounded">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((sub) => (
          <div 
            key={sub.id}
            onClick={() => setSelectedId(sub.id)}
            className={`cursor-pointer rounded-2xl overflow-hidden border-4 transition-all duration-200 ${
              selectedId === sub.id ? "border-pink-500 scale-105 shadow-[0_0_20px_rgba(236,72,153,0.5)]" : "border-slate-800 hover:border-slate-600"
            }`}
          >
            <div 
              className="w-full aspect-square bg-cover bg-center"
              style={{ backgroundImage: `url(${sub.imageUrl})` }}
            />
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 left-0 right-0 px-4">
        <Button 
          className="w-full max-w-md mx-auto block py-6 text-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-xl"
          disabled={!selectedId || isSubmitting}
          onClick={submitVote}
        >
          {isSubmitting ? "Submitting..." : "Submit Vote"}
        </Button>
      </div>
    </div>
  );
}
