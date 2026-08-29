import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setAudienceSession } from "@/lib/auth";
import { z } from "zod";

const joinSchema = z.object({
  roomCode: z.string().min(1, "Room code is required").max(20),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = joinSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }

    const { roomCode } = result.data;
    
    // Checked via Zod already


    const competition = await prisma.competition.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
    });

    if (!competition) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    // Generate a unique session ID for the audience member
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    const session = await setAudienceSession(sessionId, competition.roomCode);

    const response = NextResponse.json({ success: true });
    response.cookies.set("audience_session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
