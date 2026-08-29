import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { setSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const session = await setSession(user.id, user.role);

    const response = NextResponse.json({ success: true });
    response.cookies.set("host_session", session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
