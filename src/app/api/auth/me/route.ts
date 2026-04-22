import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    if (!token) {
      return NextResponse.json(null, { status: 200 });
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: { client: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(session.user, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar sessão:", error);
    return NextResponse.json(null, { status: 500 });
  }
}