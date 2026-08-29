import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { setTeamSession } from "@/lib/auth";

const joinSchema = z.object({
  roomCode: z.string().min(1, "Room code is required").max(20).toUpperCase(),
  teamName: z.string().min(1, "Team name is required").max(50),
});

function generateJoinCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = joinSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { roomCode, teamName } = result.data;

    const competition = await prisma.competition.findUnique({
      where: { roomCode },
    });

    if (!competition || competition.status !== "LOBBY") {
      return NextResponse.json(
        { error: "Invalid room code or competition not open" },
        { status: 400 }
      );
    }

    const joinCode = generateJoinCode();
    const team = await prisma.team.create({
      data: {
        name: teamName,
        joinCode,
        competitionId: competition.id,
      },
    });

    const session = await setTeamSession(team.id, joinCode, competition.roomCode);
    
    const response = NextResponse.json({ success: true, teamId: team.id });
    response.cookies.set("team_session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
