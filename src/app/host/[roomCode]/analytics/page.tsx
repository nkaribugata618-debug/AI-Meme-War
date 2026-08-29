"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { Download, Users, Layers, Activity, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function AnalyticsDashboard() {
  const params = useParams();
  const roomCode = params.roomCode as string;
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/analytics?roomCode=${roomCode}`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [roomCode]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading Analytics...</div>;
  if (!stats) return <div className="min-h-screen flex items-center justify-center text-red-400">Failed to load analytics.</div>;

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 p-6 rounded-2xl border border-white/10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            {stats.competitionName} - Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">Room Code: {roomCode}</p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" className="border-pink-500/50 hover:bg-pink-900/30 text-pink-300" onClick={() => exportToCSV(stats, roomCode)}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button variant="outline" className="border-purple-500/50 hover:bg-purple-900/30 text-purple-300" onClick={() => exportToPDF(stats, roomCode)}>
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400"><Users /></div>
            <div>
              <p className="text-sm text-slate-400">Total Teams</p>
              <p className="text-2xl font-bold text-white">{stats.totalTeams}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400"><Layers /></div>
            <div>
              <p className="text-sm text-slate-400">Total Rounds</p>
              <p className="text-2xl font-bold text-white">{stats.totalRounds}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-pink-900/30 rounded-lg text-pink-400"><Activity /></div>
            <div>
              <p className="text-sm text-slate-400">Total Votes</p>
              <p className="text-2xl font-bold text-white">{stats.totalVotes}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-yellow-900/30 rounded-lg text-yellow-400"><Trophy /></div>
            <div>
              <p className="text-sm text-slate-400">Avg Votes / Round</p>
              <p className="text-2xl font-bold text-white">{stats.avgVotesPerRound}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Overall Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.overallLeaderboard.map((team: any, i: number) => {
                const percentage = stats.totalVotes > 0 ? (team.totalVotes / stats.totalVotes) * 100 : 0;
                return (
                  <div key={team.teamName} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white font-medium">{i + 1}. {team.teamName}</span>
                      <span className="text-pink-400">{team.totalVotes} votes</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
              {stats.overallLeaderboard.length === 0 && <p className="text-slate-500 text-sm">No data available yet.</p>}
            </div>
          </CardContent>
        </Card>

        {stats.mostPopularMeme && (
          <Card className="border-white/10 bg-white/5 flex flex-col">
            <CardHeader>
              <CardTitle>Most Popular Meme</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div 
                className="w-full max-w-sm aspect-square bg-cover bg-center rounded-xl border-4 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
                style={{ backgroundImage: `url(${stats.mostPopularMeme.imageUrl})` }}
              />
              <div className="text-center">
                <p className="text-xl font-bold text-white">{stats.mostPopularMeme.teamName}</p>
                <p className="text-yellow-400 font-medium">{stats.mostPopularMeme.votes} Votes</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
