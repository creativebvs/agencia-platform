export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireRole, requireUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      if (!user.clientId) {
        return NextResponse.json([], { status: 200 });
      }

      const clients = await prisma.client.findMany({
        where: {
          id: user.clientId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(clients, { status: 200 });
    }

    const clients = await prisma.client.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao listar clientes:", error);

    return NextResponse.json(
      { message: "Erro ao listar clientes." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(["admin"]);

    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "Nome do cliente é obrigatório." },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
      },
    });

    return NextResponse.json(client, { status: 201 });
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

    console.error("Erro ao criar cliente:", error);

    return NextResponse.json(
      { message: "Erro ao criar cliente." },
      { status: 500 }
    );
  }
}