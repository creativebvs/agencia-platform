export const dynamic = "force-dynamic";

import { randomUUID } from "crypto";
import { prisma } from "@/db/prisma";

export const SESSION_COOKIE_NAME = "creative_session";

export async function createSession(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getUserBySessionToken(token: string | null) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          client: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: { token },
    });

    return null;
  }

  return session.user;
}

export async function deleteSession(token: string | null) {
  if (!token) return;

  try {
    await prisma.session.delete({
      where: { token },
    });
  } catch {
    // sessão já removida
  }
}