export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Não autenticado" },
        { status: 401 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { message: "Sessão inválida" },
        { status: 401 }
      );
    }

    let contents;

    // 🔥 ADMIN vê tudo
    if (session.user.role === "admin") {
      contents = await prisma.content.findMany({
        orderBy: { createdAt: "desc" },
      });
    } else {
      // 🔥 CLIENT ou CREATIVE vê só do cliente
      contents = await prisma.content.findMany({
        where: {
          clientId: session.user.clientId || "",
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(contents);
  } catch (error) {
    console.error("Erro ao buscar conteúdos:", error);

    return NextResponse.json(
      { message: "Erro interno" },
      { status: 500 }
    );
  }
}