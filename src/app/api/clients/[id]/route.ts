import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireRole } from "@/lib/auth-server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, context: Context) {
  try {
    await requireRole(["admin"]);

    const { id } = await context.params;
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "Nome do cliente é obrigatório." },
        { status: 400 }
      );
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
      },
    });

    return NextResponse.json(updatedClient, { status: 200 });
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

    console.error("Erro ao atualizar cliente:", error);

    return NextResponse.json(
      { message: "Erro ao atualizar cliente." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: Context) {
  try {
    await requireRole(["admin"]);

    const { id } = await context.params;

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Cliente excluído com sucesso." },
      { status: 200 }
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

    console.error("Erro ao excluir cliente:", error);

    return NextResponse.json(
      { message: "Erro ao excluir cliente." },
      { status: 500 }
    );
  }
}