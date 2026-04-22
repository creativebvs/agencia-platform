import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { message: "Ação inválida" },
        { status: 400 }
      );
    }

    const status =
      action === "approve" ? "approved" : "changes_requested";

    const updated = await prisma.content.update({
      where: { id: params.id },
      data: {
        status,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao atualizar conteúdo" },
      { status: 500 }
    );
  }
}