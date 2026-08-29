import { prisma } from "../../lib/prisma.js";

export async function activeGame(gameId) {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return null;
  if (game.status !== "ACTIVE" || game.endsAt <= new Date()) {
    if (game.status === "ACTIVE") await prisma.game.update({ where: { id: gameId }, data: { status: "ENDED", endedAt: new Date() } });
    return null;
  }
  return game;
}
