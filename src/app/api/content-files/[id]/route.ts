import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

// ======================
// GET
// ======================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();

    const files = await prisma.file.findMany({
      where: {
        contentId: params.id,
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar arquivos." },
      { status: 500 }
    );
  }
}

// ======================
// DELETE
// ======================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();

    await prisma.file.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Arquivo excluído." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao excluir arquivo." },
      { status: 500 }
    );
  }
}