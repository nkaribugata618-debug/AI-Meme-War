import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const createCompetitionSchema = z.object({
  name: z.string().max(50).optional(),
});

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createCompetitionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const { name } = result.data;

    let roomCode = generateRoomCode();
    // Ensure uniqueness
    while (await prisma.competition.findUnique({ where: { roomCode } })) {
      roomCode = generateRoomCode();
    }

    const competition = await prisma.competition.create({
      data: {
        name: name || "New Meme War",
        roomCode,
        hostId: session.userId,
      },
    });

    return NextResponse.json({ success: true, competition });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const competitions = await prisma.competition.findMany({
      where: { hostId: session.userId },
      include: {
        _count: {
          select: { teams: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, competitions });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
