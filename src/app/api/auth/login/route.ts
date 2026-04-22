import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = body.email;
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Dados inválidos" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const valid = await verifyPassword(password, user.password);

    if (!valid) {
      return NextResponse.json(
        { message: "Senha inválida" },
        { status: 401 }
      );
    }

    // 🔥 CRIAR SESSÃO
    const token = randomUUID();

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 dias

await prisma.session.create({
  data: {
    token,
    userId: user.id,
    expiresAt, // 👈 ESSENCIAL
  },
});

    const response = NextResponse.json({ success: true });

    // 🍪 COOKIE (CORRIGIDO)
    response.cookies.set({
  name: "session",
  value: token,
  httpOnly: true,
  path: "/",
  sameSite: "lax",
  expires: expiresAt, // 👈 sincroniza com backend
});

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Erro ao fazer login" },
      { status: 500 }
    );
  }
}