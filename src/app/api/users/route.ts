export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireRole } from "@/lib/auth-server";
import { hashPassword } from "@/lib/password";

export async function GET() {
  try {
    await requireRole(["admin"]);

    const users = await prisma.user.findMany({
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      client: user.client,
      createdAt: user.createdAt,
    }));

    return NextResponse.json(safeUsers, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    console.error("Erro ao listar usuários:", error);

    return NextResponse.json(
      { message: "Erro ao listar usuários." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(["admin"]);

    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    const clientId =
      typeof body.clientId === "string" ? body.clientId.trim() : "";

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Nome, email, senha e perfil são obrigatórios." },
        { status: 400 }
      );
    }

    if (!["admin", "creative", "client"].includes(role)) {
      return NextResponse.json(
        { message: "Perfil inválido." },
        { status: 400 }
      );
    }

    if (role === "client" && !clientId) {
      return NextResponse.json(
        { message: "Selecione um cliente para o usuário client." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Já existe um usuário com esse email." },
        { status: 409 }
      );
    }

const user = await prisma.user.create({
  data: {
    name,
    email,
    password: await hashPassword(password),
    role,
    clientId: role === "client" ? clientId : null,
  },
  include: {
    client: true, // 👈 ESSENCIAL
  },
});
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        client: user.client,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    console.error("Erro ao criar usuário:", error);

    return NextResponse.json(
      { message: "Erro ao criar usuário." },
      { status: 500 }
    );
  }
}