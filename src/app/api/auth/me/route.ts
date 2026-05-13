export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("creative_session")?.value ||
      cookieStore.get("session")?.value ||
      null;

    if (!token) {
      return NextResponse.json(null, { status: 200 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            clientId: true,
            client: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(null, { status: 200 });
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.delete({
        where: { token },
      });

      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(session.user, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar usuário atual:", error);
    return NextResponse.json(null, { status: 200 });
  }
}