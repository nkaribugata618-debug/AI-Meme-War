import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAudienceSession } from "@/lib/auth";
import { z } from "zod";

const voteSchema = z.object({
  submissionId: z.string().uuid("Invalid submission ID"),
  roundId: z.string().uuid("Invalid round ID"),
});

export async function POST(req: Request) {
  try {
    const session = await getAudienceSession();
    if (!session || !session.sessionId) {
      return NextResponse.json({ error: "Unauthorized. Please rejoin the audience session." }, { status: 401 });
    }

    const body = await req.json();
    const result = voteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { submissionId, roundId } = result.data;

    // Checked via Zod already

    const round = await prisma.round.findUnique({
      where: { id: roundId }
    });

    if (!round || round.status !== "VOTING") {
      return NextResponse.json({ error: "Voting is currently closed." }, { status: 403 });
    }

    // Check if user already voted in this round
    const existingVote = await prisma.vote.findFirst({
      where: {
        voterSession: session.sessionId,
        submission: {
          roundId: roundId
        }
      }
    });

    if (existingVote) {
      return NextResponse.json({ error: "You have already voted in this round." }, { status: 403 });
    }

    const vote = await prisma.vote.create({
      data: {
        submissionId,
        voterSession: session.sessionId
      }
    });

    return NextResponse.json({ success: true, vote });
  } catch (err) {
    console.error("Voting error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
