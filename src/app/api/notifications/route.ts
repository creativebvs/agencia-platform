export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.user) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    let count = 0;

    if (session.user.role === "admin") {
      count = await prisma.content.count({
        where: {
          status: "waiting_client",
        },
      });
    } else if (session.user.role === "creative") {
      count = await prisma.content.count({
        where: {
          status: "waiting_client",
          clientId: session.user.clientId || undefined,
        },
      });
    }

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}