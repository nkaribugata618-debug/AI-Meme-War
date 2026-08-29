import { prisma } from "../../lib/prisma.js";
import { signUserToken } from "../../lib/auth.js";
import { allowMethods, apiError, requiredString, requireId } from "../_utils/http.js";
export default async function handler(req, res) { if (!allowMethods(req, res, ["POST"])) return; try { const teamId = requireId(req.body?.teamId, "teamId"); const userName = requiredString(req.body?.userName, "userName", 60); const team = await prisma.team.findUnique({ where: { id: teamId } }); if (!team) return res.status(404).json({ error: "Team not found" }); const user = await prisma.user.create({ data: { name: userName, teamId } }); res.status(201).json({ team, user, token: signUserToken(user) }); } catch (error) { apiError(res, error); } }
