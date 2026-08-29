"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HostLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Success, redirect to host dashboard
      router.push("/host");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-black to-black z-0" />
      
      <Card className="w-full max-w-md relative z-10 border-white/10 bg-black/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
            {isLogin ? "Host Login" : "Host Registration"}
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            {isLogin ? "Sign in to manage your events" : "Create an account to host an event"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="host@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white mt-4"
            >
              {loading ? "Please wait..." : (isLogin ? "Sign In" : "Register")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="ml-2 text-pink-400 hover:text-pink-300 transition-colors underline underline-offset-4"
            >
              {isLogin ? "Create one" : "Sign in here"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
