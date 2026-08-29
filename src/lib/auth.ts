import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.JWT_SECRET || "default_secret";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: Record<string, unknown>, expiresIn = "24h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("host_session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function getTeamSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("team_session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function getAudienceSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("audience_session")?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch {
    return null;
  }
}

export async function setSession(userId: string, role: string) {
  const session = await encrypt({ userId, role }, "24h");
  return session;
}

export async function setTeamSession(teamId: string, joinCode: string, roomCode: string) {
  const session = await encrypt({ teamId, joinCode, roomCode, role: "TEAM" }, "24h");
  return session;
}

export async function setAudienceSession(sessionId: string, roomCode: string) {
  const session = await encrypt({ sessionId, roomCode, role: "AUDIENCE" }, "24h");
  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set("host_session", "", { expires: new Date(0) });
}
