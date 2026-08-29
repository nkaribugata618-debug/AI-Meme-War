import { NextResponse } from "next/server";
import { GeminiProvider } from "@/lib/ai/gemini-provider";
import { AIProviderError } from "@/lib/ai/ai-provider";
import { getSession, getTeamSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { protectAiEndpoint } from "@/lib/ai-protection";
import { z } from "zod";

const imageSchema = z.object({
  prompt: z.string().trim().min(3).max(500),
  aspectRatio: z.enum(["1:1", "16:9"]).optional(),
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
    const result = imageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const { prompt, aspectRatio } = result.data;

    const apiKey = process.env.GEMINI_API_KEY || "";
    const provider = new GeminiProvider(apiKey);
    
    const imageUrl = await protectAiEndpoint({
      userId,
      endpoint: "image",
      prompt: `${prompt}-${aspectRatio || 'default'}`,
      rateLimitMax: 5,
      rateLimitWindowMs: 60 * 1000,
      cacheTtlMs: 10 * 60 * 1000, // 10 minutes
      fn: () => provider.generateImage(prompt, aspectRatio),
    });

    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    if (error.message === "RATE_LIMIT_EXCEEDED") {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before trying again." },
        { status: 429 }
      );
    }
    
    // Log real error on server
    console.error("[AI Image API Error]:", error);
    
    // Mask real error to client
    if (error instanceof AIProviderError && error.code === "IMAGE_GEN_UNAVAILABLE") {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
  }
}
