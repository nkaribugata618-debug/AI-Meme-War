"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") || "";
  const initialMode = (searchParams.get("mode")?.toUpperCase() === "AUDIENCE" ? "AUDIENCE" : "TEAM") as "TEAM" | "AUDIENCE";

  const [roomCode, setRoomCode] = useState(initialCode);
  const [teamName, setTeamName] = useState("");
  const [mode, setMode] = useState<"TEAM" | "AUDIENCE">(initialMode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "TEAM") {
        const res = await fetch("/api/team/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode, teamName }),
        });
        const data = await res.json();
        
        if (res.ok) {
          router.push(`/team/${roomCode.toUpperCase()}`);
        } else {
          setError(data.error || "Failed to join team");
        }
      } else {
        const res = await fetch("/api/audience/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomCode }),
        });
        const data = await res.json();

        if (res.ok) {
          router.push(`/audience/${roomCode.toUpperCase()}`);
        } else {
          setError(data.error || "Failed to join audience");
        }
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl text-center font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            Join Meme War
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
            <button 
              className={`flex-1 py-2 rounded-lg transition-colors ${mode === "TEAM" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              onClick={() => setMode("TEAM")}
            >
              Join as Team
            </button>
            <button 
              className={`flex-1 py-2 rounded-lg transition-colors ${mode === "AUDIENCE" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
              onClick={() => setMode("AUDIENCE")}
            >
              Join Audience
            </button>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Room Code</label>
              <input 
                type="text" 
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABCD12"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 outline-none uppercase"
                required
              />
            </div>

            {mode === "TEAM" && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Team Name</label>
                <input 
                  type="text" 
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. The Memelords"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-pink-500 outline-none"
                  required
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button type="submit" className="w-full py-6 text-lg mt-4" disabled={loading}>
              {loading ? "Joining..." : "Enter Arena"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <JoinForm />
    </Suspense>
  );
}
