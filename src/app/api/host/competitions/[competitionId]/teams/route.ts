import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId } = await params;

    // Verify host owns this competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition || competition.hostId !== session.userId) {
      return NextResponse.json({ error: "Competition not found or unauthorized" }, { status: 404 });
    }

    const teams = await prisma.team.findMany({
      where: {
        competitionId,
      },
      include: {
        submissions: {
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const mappedTeams = teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      joinCode: team.joinCode,
      createdAt: team.createdAt,
      hasSubmitted: team.submissions.length > 0,
    }));

    return NextResponse.json({ success: true, teams: mappedTeams });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
