"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Trash, RefreshCw, Users, Activity, ExternalLink, Presentation, X } from "lucide-react";

interface Competition {
  id: string;
  name: string;
  roomCode: string;
  status: string;
  createdAt: string;
  _count?: {
    teams: number;
  };
}

interface Team {
  id: string;
  name: string;
  joinCode: string;
  createdAt: string;
  hasSubmitted: boolean;
}

export default function HostDashboard() {
  const router = useRouter();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  // Team Management Modal State
  const [manageCompId, setManageCompId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (manageCompId) {
      fetchTeams(manageCompId);
    }
  }, [manageCompId]);

  async function fetchCompetitions() {
    setLoading(true);
    const res = await fetch("/api/host/competitions");
    
    if (res.status === 401) {
      router.push("/host/login");
      return;
    }

    if (res.ok) {
      const data = await res.json();
      setCompetitions(data.competitions);
    }
    setLoading(false);
  }

  async function handleCreate() {
    const res = await fetch("/api/host/competitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Meme War Event ${competitions.length + 1}` }),
    });

    if (res.status === 401) {
      router.push("/host/login");
      return;
    }

    if (res.ok) {
      fetchCompetitions();
    }
  }

  async function fetchTeams(compId: string) {
    setLoadingTeams(true);
    const res = await fetch(`/api/host/competitions/${compId}/teams`);
    if (res.ok) {
      const data = await res.json();
      setTeams(data.teams);
    }
    setLoadingTeams(false);
  }

  async function handleRemoveTeam(teamId: string) {
    if (!manageCompId) return;
    if (!confirm("Are you sure you want to remove this team?")) return;

    const res = await fetch(`/api/host/competitions/${manageCompId}/teams/${teamId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTeams(teams.filter((t) => t.id !== teamId));
      fetchCompetitions(); // Refresh count
    }
  }

  async function handleResetJoinCode(teamId: string) {
    if (!manageCompId) return;
    const res = await fetch(`/api/host/competitions/${manageCompId}/teams/${teamId}`, {
      method: "PATCH",
    });
    if (res.ok) {
      const data = await res.json();
      setTeams(teams.map((t) => (t.id === teamId ? { ...t, joinCode: data.joinCode } : t)));
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {
      alert("Failed to copy");
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500 mb-2">
            Host Dashboard
          </h1>
          <p className="text-slate-400">Manage your active Meme War events</p>
        </div>
        <Button onClick={handleCreate} className="bg-white text-black hover:bg-slate-200">
          + Create New Event
        </Button>
      </div>

      {loading ? (
        <div className="animate-pulse flex gap-6 flex-wrap">
          <div className="w-80 h-96 bg-white/5 rounded-xl"></div>
          <div className="w-80 h-96 bg-white/5 rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {competitions.map((comp) => (
            <Card key={comp.id} className="relative overflow-hidden group flex flex-col">
              <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                <CardTitle className="text-2xl">{comp.name}</CardTitle>
                <div className="flex justify-between text-sm text-slate-400 mt-2">
                  <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${comp.status === "LOBBY" ? "bg-blue-500/20 text-blue-400" : comp.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : "bg-slate-500/20 text-slate-400"}`}>
                    {comp.status}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="flex flex-col items-center flex-1 p-6 space-y-6">
                <div className="w-full flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Room Code</span>
                    <span className="text-2xl font-mono tracking-widest text-pink-400">{comp.roomCode}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(comp.roomCode)}>
                    <Copy className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>

                <div className="flex gap-4 w-full">
                  <div className="flex-1 bg-white/5 rounded-lg p-3 text-center border border-white/5">
                    <div className="text-xs text-slate-400 mb-1">Registered Teams</div>
                    <div className="text-xl font-bold text-white flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      {comp._count?.teams || 0}
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG 
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/join?code=${comp.roomCode}`} 
                    size={140} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full mt-auto pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center gap-2 border-white/10 hover:bg-white/10"
                    onClick={() => setManageCompId(comp.id)}
                  >
                    <Users className="w-4 h-4" /> Teams
                  </Button>
                  <Link href={`/host/${comp.roomCode}`} className="w-full">
                    <Button className="w-full flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white border-0">
                      <ExternalLink className="w-4 h-4" /> Control
                    </Button>
                  </Link>
                  <Link href={`/presentation/${comp.roomCode}`} className="w-full">
                    <Button variant="outline" className="w-full flex items-center gap-2 border-white/10 hover:bg-white/10">
                      <Presentation className="w-4 h-4" /> Present
                    </Button>
                  </Link>
                  <Link href={`/host/${comp.roomCode}/analytics`} className="w-full">
                    <Button variant="outline" className="w-full flex items-center gap-2 border-white/10 hover:bg-white/10">
                      <Activity className="w-4 h-4" /> Analytics
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {competitions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-16 text-slate-400 border border-dashed border-white/20 rounded-2xl bg-white/5">
              <Users className="w-12 h-12 mb-4 text-slate-500 opacity-50" />
              <p className="text-lg">No competitions found. Create one to get started!</p>
            </div>
          )}
        </div>
      )}

      {/* Team Management Modal Overlay */}
      {manageCompId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-950 border-white/10 shadow-2xl overflow-hidden relative">
            <CardHeader className="border-b border-white/10 bg-white/5 sticky top-0 z-10">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl">Manage Teams</CardTitle>
                  <CardDescription className="text-slate-400 mt-1">
                    View and moderate teams registered for this competition.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setManageCompId(null)} className="rounded-full hover:bg-white/10">
                  <X className="w-6 h-6 text-slate-400" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {loadingTeams ? (
                <div className="p-8 flex justify-center text-slate-400">Loading teams...</div>
              ) : teams.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  No teams have joined yet.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {teams.map((team) => (
                    <div key={team.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {team.name}
                          {team.hasSubmitted && (
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              Submitted
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Joined {new Date(team.createdAt).toLocaleString()}</p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-black/50 p-2 rounded-lg border border-white/5">
                        <span className="font-mono text-pink-400 px-2">{team.joinCode}</span>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-white"
                            onClick={() => copyToClipboard(team.joinCode)}
                            title="Copy Join Code"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-white"
                            onClick={() => handleResetJoinCode(team.id)}
                            title="Reset Join Code"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border-0"
                        onClick={() => handleRemoveTeam(team.id)}
                        title="Remove Team"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
