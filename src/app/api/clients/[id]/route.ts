export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireUser();

    const { id } = await context.params;

    const client = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    if (user.role === "client") {
      if (!user.clientId || user.clientId !== client.id) {
        return NextResponse.json(
          { message: "Sem permissão para este cliente." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao buscar cliente:", error);

    return NextResponse.json(
      { message: "Erro ao buscar cliente." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireUser();

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    const name = getString(body.name);
    const officialContact = getString(body.officialContact);
    const phone = getString(body.phone);
    const instagram = getString(body.instagram);
    const address = getString(body.address);
    const notes = getString(body.notes);

    if (!name) {
      return NextResponse.json(
        { message: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    const existingClient = await prisma.client.findUnique({
      where: {
        id,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    const client = await prisma.client.update({
      where: {
        id,
      },
      data: {
        name,
        officialContact: officialContact || null,
        phone: phone || null,
        instagram: instagram || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(client, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao atualizar cliente:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro ao atualizar cliente: ${error.message}`
            : "Erro ao atualizar cliente.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await requireUser();

    if (user.role !== "admin") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const usersLinked = await prisma.user.count({
      where: {
        clientId: id,
      },
    });

    if (usersLinked > 0) {
      return NextResponse.json(
        {
          message:
            "Este cliente possui usuários vinculados. Remova ou edite os usuários antes de excluir o cliente.",
        },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: {
        id,
      },
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

    console.error("Erro ao excluir cliente:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro ao excluir cliente: ${error.message}`
            : "Erro ao excluir cliente.",
      },
      { status: 500 }
    );
  }
}