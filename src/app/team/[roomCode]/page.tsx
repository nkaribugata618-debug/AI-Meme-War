"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/lib/socket-client";
import { CompetitionState, DEFAULT_STATE } from "@/lib/socket-events";
import MemeStudio from "@/components/meme-studio/MemeStudio";

export default function TeamDashboard() {
  const params = useParams();
  const roomCode = params.roomCode as string;

  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<CompetitionState>(DEFAULT_STATE);
  const [timer, setTimer] = useState({ remainingSeconds: 0, isPaused: false });

  useEffect(() => {
    socket.connect();
    
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinRoom", roomCode, "TEAM");
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("stateUpdate", (newState) => {
      setState(newState);
    });

    socket.on("timerUpdate", (timeData) => {
      setTimer(timeData);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("stateUpdate");
      socket.off("timerUpdate");
      socket.disconnect();
    };
  }, [roomCode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto flex flex-col gap-6">
      <header className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            Team Dashboard
          </h1>
          <p className="text-sm text-slate-400">Room: {roomCode} | Status: {connected ? "Connected" : "Reconnecting..."}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono text-white">
            {formatTime(timer.remainingSeconds)}
          </div>
          {timer.isPaused && <p className="text-sm text-yellow-400">Paused</p>}
        </div>
      </header>

      <main className="flex-1">
        {state.status === "LOBBY" && (
          <div className="flex items-center justify-center h-64 border border-dashed border-white/20 rounded-2xl">
            <p className="text-xl text-slate-400">Waiting for host to start the competition...</p>
          </div>
        )}

        {(state.status === "ACTIVE" && (state.roundStatus === "ACTIVE" || state.roundStatus === "LOCKED")) && (
          <MemeStudio 
            roundId={state.roundNumber.toString()} 
            roundPrompt={state.prompt} 
            isLocked={state.roundStatus === "LOCKED"} 
          />
        )}
      </main>
    </div>
  );
}
