import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ competitionId: string; teamId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId, teamId } = await params;

    // Verify host owns this competition
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition || competition.hostId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
    }

    await prisma.team.delete({
      where: { id: teamId, competitionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ competitionId: string; teamId: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { competitionId, teamId } = await params;

    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
    });

    if (!competition || competition.hostId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 404 });
    }

    // Generate new unique join code
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let newJoinCode = "";
    for (let i = 0; i < 8; i++) {
      newJoinCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const team = await prisma.team.update({
      where: { id: teamId, competitionId },
      data: { joinCode: newJoinCode },
    });

    return NextResponse.json({ success: true, joinCode: team.joinCode });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
