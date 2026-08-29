import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const startRoundSchema = z.object({
  roomCode: z.string().min(1).max(20),
  roundNumber: z.number().int().positive(),
  prompt: z.string().min(1).max(500),
  durationSeconds: z.number().int().positive(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "HOST") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = startRoundSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { roomCode, roundNumber, prompt, durationSeconds } = result.data;

    // Checked via Zod already

    const competition = await prisma.competition.findUnique({
      where: { roomCode: roomCode.toUpperCase() }
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    // Upsert or create round
    const existingRound = await prisma.round.findFirst({
      where: { competitionId: competition.id, roundNumber }
    });

    let round;
    if (existingRound) {
      round = await prisma.round.update({
        where: { id: existingRound.id },
        data: { prompt, status: "ACTIVE" }
      });
    } else {
      round = await prisma.round.create({
        data: {
          competitionId: competition.id,
          roundNumber,
          prompt,
          status: "ACTIVE"
        }
      });
    }

    return NextResponse.json({ success: true, roundId: round.id });
  } catch (error) {
    console.error("Start Round Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
