import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/auth-server";

type Context = {
  params: { id: string };
};

export async function DELETE(_req: Request, context: Context) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

  

    const file = await prisma.fileItem.findUnique({
      where: { id },
    });

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo não encontrado." },
        { status: 404 }
      );
    }

    const fullPath = path.join(process.cwd(), "public", file.path);

    try {
      await unlink(fullPath);
    } catch (error) {
      console.warn("Arquivo físico não encontrado para exclusão:", error);
    }

    await prisma.fileItem.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Arquivo excluído com sucesso." },
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
      { message: "Erro ao excluir arquivo." },
      { status: 500 }
    );
  }
}