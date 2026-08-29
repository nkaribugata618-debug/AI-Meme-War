import { createHmac, timingSafeEqual } from "node:crypto";

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = (value) => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
const signature = (payload) => createHmac("sha256", process.env.JWT_SECRET).update(payload).digest("base64url");

export function signUserToken(user) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  const payload = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, teamId: user.teamId, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })}`;
  return `${payload}.${signature(payload)}`;
}

export function authenticatedUserId(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !process.env.JWT_SECRET) { const error = new Error("Authentication is required"); error.status = 401; throw error; }
  const [header, claims, provided] = token.split(".");
  const payload = `${header}.${claims}`;
  const expected = signature(payload);
  if (!provided || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) { const error = new Error("Invalid authentication token"); error.status = 401; throw error; }
  const data = decode(claims);
  if (!data.sub || data.exp < Math.floor(Date.now() / 1000)) { const error = new Error("Authentication token has expired"); error.status = 401; throw error; }
  return data.sub;
}
