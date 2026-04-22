import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

// ======================
// DELETE - excluir arquivo
// ======================
export async function DELETE(request: Request, context: any) {
  try {
    await requireUser();

    const id = context.params.id;

    await prisma.file.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Arquivo excluído com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao excluir arquivo." },
      { status: 500 }
    );
  }
}