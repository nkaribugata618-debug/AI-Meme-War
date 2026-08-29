import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("roomCode");

    if (!roomCode) {
      return NextResponse.json({ error: "Missing roomCode" }, { status: 400 });
    }

    const competition = await prisma.competition.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
      include: {
        _count: { select: { teams: true } },
        teams: true,
        rounds: {
          include: {
            submissions: {
              include: {
                _count: { select: { votes: true } },
                team: true
              }
            }
          }
        }
      }
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    let totalVotes = 0;
    const votesPerRound: Record<number, number> = {};
    let mostPopularMeme = null;
    let highestVoteCount = -1;

    competition.rounds.forEach((r: any) => {
      let roundVotes = 0;
      r.submissions.forEach((sub: any) => {
        const v = sub._count.votes;
        roundVotes += v;
        if (v > highestVoteCount) {
          highestVoteCount = v;
          mostPopularMeme = {
            imageUrl: sub.imageUrl,
            teamName: sub.team.name,
            votes: v
          };
        }
      });
      totalVotes += roundVotes;
      votesPerRound[r.roundNumber] = roundVotes;
    });

    // Aggregate overall team scores
    const teamScores: Record<string, { teamName: string; totalVotes: number }> = {};
    competition.teams.forEach((t: any) => {
      teamScores[t.id] = { teamName: t.name, totalVotes: 0 };
    });

    competition.rounds.forEach((r: any) => {
      r.submissions.forEach((sub: any) => {
        if (teamScores[sub.teamId]) {
          teamScores[sub.teamId].totalVotes += sub._count.votes;
        }
      });
    });

    const overallLeaderboard = Object.values(teamScores).sort((a, b) => b.totalVotes - a.totalVotes);

    return NextResponse.json({
      success: true,
      stats: {
        competitionName: competition.name,
        totalTeams: competition._count.teams,
        totalRounds: competition.rounds.length,
        totalVotes,
        avgVotesPerRound: competition.rounds.length > 0 ? (totalVotes / competition.rounds.length).toFixed(1) : 0,
        votesPerRound,
        mostPopularMeme,
        overallLeaderboard,
      }
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
