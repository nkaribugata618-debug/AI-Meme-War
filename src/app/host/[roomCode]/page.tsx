"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { socket } from "@/lib/socket-client";
import { CompetitionState, DEFAULT_STATE, HostCommand } from "@/lib/socket-events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Download, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function HostControlPanel() {
  const params = useParams();
  const roomCode = params.roomCode as string;

  const [connected, setConnected] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [state, setState] = useState<CompetitionState>(DEFAULT_STATE);
  const [timer, setTimer] = useState({ remainingSeconds: 0, isPaused: false });
  const [isStartingRound, setIsStartingRound] = useState(false);

  const [promptInput, setPromptInput] = useState("Make a meme about college life");
  const [durationInput, setDurationInput] = useState(120);

  useEffect(() => {
    socket.connect();
    
    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinRoom", roomCode, "HOST");
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("stateUpdate", setState);
    socket.on("timerUpdate", setTimer);
    socket.on("participantCount", setParticipants);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("stateUpdate");
      socket.off("timerUpdate");
      socket.off("participantCount");
      socket.disconnect();
    };
  }, [roomCode]);

  const sendCommand = (cmd: HostCommand, payload?: Record<string, unknown>) => {
    socket.emit("hostCommand", roomCode, cmd, payload);
  };

  const handleStartRound = async () => {
    setIsStartingRound(true);
    try {
      const res = await fetch("/api/rounds/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          roomCode, 
          roundNumber: state.roundNumber + 1, 
          prompt: promptInput, 
          durationSeconds: durationInput 
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        sendCommand("START_ROUND", {
          roundNumber: state.roundNumber + 1,
          roundId: data.roundId,
          prompt: promptInput,
          duration: durationInput,
        });
      } else {
        alert(data.error);
      }
    } catch {
      alert("Failed to start round.");
    } finally {
      setIsStartingRound(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto flex flex-col gap-6">
      <header className="flex justify-between items-center bg-white/5 p-6 rounded-2xl border border-white/10">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            Host Controls: {roomCode}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Status: {connected ? <span className="text-green-400">Connected</span> : <span className="text-red-400">Disconnected</span>} 
            <span className="mx-2">•</span> 
            Participants: <span className="text-white font-bold">{participants}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-6 text-right">
          <div className="flex gap-2">
            <Link href={`/presentation/${roomCode}`} target="_blank">
              <Button variant="outline" size="sm" className="bg-indigo-900/30 border-indigo-500/50 hover:bg-indigo-900/50 text-indigo-300">
                <ExternalLink className="w-4 h-4 mr-2" /> Presentation Mode
              </Button>
            </Link>
            <Link href={`/host/${roomCode}/analytics`} target="_blank">
              <Button variant="outline" size="sm" className="bg-blue-900/30 border-blue-500/50 hover:bg-blue-900/50 text-blue-300">
                <BarChart2 className="w-4 h-4 mr-2" /> Analytics Dashboard
              </Button>
            </Link>
          </div>
          <div>
            <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">Time Remaining</p>
            <div className="text-5xl font-mono text-white">
              {formatTime(timer.remainingSeconds)}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Game Flow & Rounds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-slate-900 rounded-lg space-y-4 border border-slate-800">
              <h3 className="font-semibold text-white">Round Config</h3>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Meme Prompt</label>
                <input 
                  type="text" 
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  className="w-full bg-slate-800 border-none rounded p-2 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Duration (seconds)</label>
                <input 
                  type="number" 
                  value={durationInput}
                  onChange={(e) => setDurationInput(Number(e.target.value))}
                  className="w-full bg-slate-800 border-none rounded p-2 text-white outline-none"
                />
              </div>
              <Button 
                onClick={handleStartRound} 
                disabled={isStartingRound || (state.roundStatus !== "SETUP" && state.roundStatus !== "COMPLETED")}
                className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50"
              >
                {isStartingRound ? "Starting..." : `Start Round ${state.roundNumber + 1}`}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {timer.isPaused ? (
                <Button variant="outline" onClick={() => sendCommand("RESUME_TIMER")}>Resume Timer</Button>
              ) : (
                <Button variant="outline" onClick={() => sendCommand("PAUSE_TIMER")}>Pause Timer</Button>
              )}
              <Button variant="outline" onClick={() => sendCommand("LOCK_SUBMISSIONS")}>Lock Submissions</Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <Button className="bg-purple-900 hover:bg-purple-800 text-white" onClick={() => sendCommand("START_PRESENTATION")}>Start Presentation</Button>
              <Button className="bg-green-900 hover:bg-green-800 text-white" onClick={() => sendCommand("START_VOTING")}>Force Live Voting</Button>
              <Button className="bg-yellow-900 hover:bg-yellow-800 text-white" onClick={() => sendCommand("END_VOTING")}>End Voting (Show Results)</Button>
              <Button className="bg-indigo-900 hover:bg-indigo-800 text-white" onClick={() => sendCommand("NEXT_ROUND")}>Next Round Setup</Button>
            </div>
            
            <div className="pt-2 border-t border-white/10">
              <Button className="w-full bg-red-900/50 hover:bg-red-800 text-red-300" onClick={() => sendCommand("END_COMPETITION")}>End Full Competition</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Presentation Controls</CardTitle>
                <div className="text-sm font-mono bg-black/50 px-3 py-1 rounded text-pink-400">
                  {state.presentationSubmissions?.length > 0 ? (
                    `Meme ${Math.min(state.presentationSlideIndex + 1, state.presentationSubmissions.length)} of ${state.presentationSubmissions.length}`
                  ) : "0 Memes"}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => sendCommand("PREV_MEME")}>Previous Meme</Button>
                <Button variant="outline" onClick={() => sendCommand("NEXT_MEME")}>Next Meme / Auto-Vote</Button>
                <Button variant="outline" className="col-span-2" onClick={() => sendCommand("REVEAL_TEAMS")}>Reveal Team Names</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Current State</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Competition Status</span>
                  <span className="text-white font-mono">{state.status}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Round Status</span>
                  <span className="text-white font-mono">{state.roundStatus}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Current Round</span>
                  <span className="text-white font-mono">{state.roundNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">Presentation Slide</span>
                  <span className="text-white font-mono">{state.presentationSlideIndex}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-slate-400">Prompt</span>
                  <span className="text-white font-mono text-right max-w-[200px]">{state.prompt || "None"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
