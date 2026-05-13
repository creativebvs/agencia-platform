export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/db/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("creative_session")?.value ||
      cookieStore.get("session")?.value ||
      null;

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.set("creative_session", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("session", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);

    return NextResponse.json(
      { message: "Erro ao fazer logout." },
      { status: 500 }
    );
  }
}