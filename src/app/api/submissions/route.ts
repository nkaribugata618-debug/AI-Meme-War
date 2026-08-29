import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTeamSession } from "@/lib/auth";
import { z } from "zod";

const submissionSchema = z.object({
  action: z.string(),
  roundId: z.string().uuid(),
  state: z.any().optional(),
  imageUrl: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getTeamSession();
    if (!session || session.role !== "TEAM") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = submissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    const { action, roundId, state, imageUrl } = result.data;
    const teamId = session.teamId;

    if (!teamId || !roundId) {
      return NextResponse.json({ error: "Missing teamId or roundId" }, { status: 400 });
    }

    // Check if round is locked
    const round = await prisma.round.findUnique({ where: { id: roundId } });
    if (round?.status === "LOCKED" || round?.status === "COMPLETED") {
      return NextResponse.json({ error: "Submissions are locked for this round." }, { status: 403 });
    }

    // Upsert submission
    const existingSub = await prisma.submission.findFirst({
      where: { teamId, roundId }
    });

    const isFinal = action === "FINAL_SUBMIT";

    let submission;
    if (existingSub) {
      if (existingSub.isFinal) {
        return NextResponse.json({ error: "Already submitted." }, { status: 403 });
      }
      submission = await prisma.submission.update({
        where: { id: existingSub.id },
        data: { state, imageUrl, isFinal }
      });
    } else {
      submission = await prisma.submission.create({
        data: { teamId, roundId, state, imageUrl, isFinal }
      });
    }

    return NextResponse.json({ success: true, submission });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
