import { NextResponse } from "next/server";
import { GeminiProvider } from "@/lib/ai/gemini-provider";
import { AIProviderError } from "@/lib/ai/ai-provider";
import { getSession, getTeamSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { protectAiEndpoint } from "@/lib/ai-protection";
import { z } from "zod";

const ideaSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
});

export async function POST(req: Request) {
  try {
    const hostSession = await getSession();
    const teamSession = await getTeamSession();
    
    let userId = "";
    if (hostSession) {
      userId = hostSession.userId as string;
      const host = await prisma.user.findUnique({ where: { id: userId } });
      if (!host) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (teamSession) {
      userId = teamSession.teamId as string;
      const team = await prisma.team.findUnique({ where: { id: userId } });
      if (!team) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = ideaSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const { prompt } = result.data;

    const apiKey = process.env.GEMINI_API_KEY || "";
    const provider = new GeminiProvider(apiKey);
    
    const ideas = await protectAiEndpoint({
      userId,
      endpoint: "ideas",
      prompt,
      rateLimitMax: 10,
      rateLimitWindowMs: 60 * 1000,
      cacheTtlMs: 5 * 60 * 1000, // 5 minutes
      fn: () => provider.generateIdeas(prompt),
    });

    return NextResponse.json({ success: true, ideas });
  } catch (error: any) {
    if (error.message === "RATE_LIMIT_EXCEEDED") {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before trying again." },
        { status: 429 }
      );
    }
    
    // Log real error on server
    console.error("[AI Ideas API Error]:", error);
    
    return NextResponse.json({ error: "Idea generation failed. Please try again." }, { status: 500 });
  }
}
