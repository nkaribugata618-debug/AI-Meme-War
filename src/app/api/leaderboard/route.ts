import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aiConfig } from "@/config/ai";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roundId = searchParams.get("roundId");

    if (!roundId) {
      return NextResponse.json({ error: "Missing roundId" }, { status: 400 });
    }

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { winnerCommentary: true }
    });

    const submissions = await prisma.submission.findMany({
      where: { roundId, isFinal: true },
      include: {
        team: { select: { name: true } },
        _count: { select: { votes: true } }
      }
    });

    const totalVotes = submissions.reduce((sum: number, s: any) => sum + s._count.votes, 0);

    const leaderboard = submissions.map((sub: any) => {
      const audienceRaw = sub._count.votes;
      const aiRaw = sub.aiScore || 0;
      const audienceNorm = totalVotes > 0 ? (audienceRaw / totalVotes) * 100 : 0;
      const combined = (audienceNorm * aiConfig.weights.audience) + (aiRaw * aiConfig.weights.ai);

      return {
        id: sub.id,
        teamName: sub.team.name,
        imageUrl: sub.imageUrl,
        state: sub.state,
        votes: audienceRaw,
        aiScore: aiRaw,
        combinedScore: combined
      };
    }).sort((a: any, b: any) => b.combinedScore - a.combinedScore);

    return NextResponse.json({ 
      success: true, 
      leaderboard,
      winnerCommentary: round?.winnerCommentary || null
    });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
