export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const file = await prisma.file.findUnique({
      where: {
        id,
      },
      include: {
        content: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo não encontrado." },
        { status: 404 }
      );
    }

    if (user.role === "client") {
      if (!user.clientId || file.content.clientId !== user.clientId) {
        return NextResponse.json(
          { message: "Sem permissão para este arquivo." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(file, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao buscar arquivo:", error);

    return NextResponse.json(
      { message: "Erro ao buscar arquivo." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão para excluir arquivo." },
        { status: 403 }
      );
    }

    const file = await prisma.file.findUnique({
      where: {
        id,
      },
    });

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo não encontrado." },
        { status: 404 }
      );
    }

    try {
      if (file.url) {
        await del(file.url);
      }
    } catch (blobError) {
      console.error("Erro ao excluir arquivo do Blob:", blobError);
    }

    await prisma.file.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Arquivo excluído." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao excluir arquivo:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro ao excluir arquivo: ${error.message}`
            : "Erro ao excluir arquivo.",
      },
      { status: 500 }
    );
  }
}