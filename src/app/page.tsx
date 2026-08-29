"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Users, Crown } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span className="text-sm font-medium text-pink-100">The Ultimate Meme Showdown</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
          AI Meme War
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Teams compete to create the funniest AI-generated memes before time runs out. 
          Audience votes live. May the best meme win.
        </p>
      </motion.div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-10">
        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="h-full flex flex-col items-center text-center">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-pink-500/20 flex items-center justify-center mb-4 mx-auto">
                <Crown className="w-6 h-6 text-pink-400" />
              </div>
              <CardTitle>Host an Event</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-slate-400 mb-6 flex-1">
                Create a room, set the timer, and manage the competition.
              </p>
              <Link href="/host" className="w-full">
                <Button variant="glass" className="w-full">Create Room</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="h-full flex flex-col items-center text-center border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.1)]">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle>Join as Team</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-slate-400 mb-6 flex-1">
                Enter a room code, generate memes with AI, and submit your masterpiece.
              </p>
              <Link href="/join?mode=TEAM" className="w-full">
                <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 border-0">
                  Join Competition
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="h-full flex flex-col items-center text-center">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle>Join Audience</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-sm text-slate-400 mb-6 flex-1">
                Watch the live leaderboard and vote for the funniest memes.
              </p>
              <Link href="/join?mode=AUDIENCE" className="w-full">
                <Button variant="glass" className="w-full">Vote Now</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </div>
  );
}
