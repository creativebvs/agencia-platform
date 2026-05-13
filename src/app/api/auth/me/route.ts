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
          include: {
            client: true,
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

    return NextResponse.json(
      {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        clientId: session.user.clientId,
        client: session.user.client,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar usuário atual:", error);
    return NextResponse.json(null, { status: 200 });
  }
}