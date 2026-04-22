import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

// ======================
// GET
// ======================
export async function GET(
  request: Request,
  context: any
) {
  try {
    await requireUser();

    const id = context.params.id;

    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar cliente." },
      { status: 500 }
    );
  }
}

// ======================
// PUT
// ======================
export async function PUT(
  request: Request,
  context: any
) {
  try {
    const user = await requireUser();

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    const id = context.params.id;
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(client);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao atualizar cliente." },
      { status: 500 }
    );
  }
}

// ======================
// DELETE
// ======================
export async function DELETE(
  request: Request,
  context: any
) {
  try {
    const user = await requireUser();

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    const id = context.params.id;

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Cliente excluído com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao excluir cliente." },
      { status: 500 }
    );
  }
}