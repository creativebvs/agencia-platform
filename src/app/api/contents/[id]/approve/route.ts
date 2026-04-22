import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const action = body.action;
    const feedback = body.feedback || null;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { message: "Ação inválida" },
        { status: 400 }
      );
    }

    const status =
      action === "approve" ? "approved" : "changes_requested";

    const content = await prisma.content.update({
      where: { id: params.id },
      data: {
        status,
        feedback,
      },
    });

    // 🔔 NOTIFICAÇÃO
    await prisma.notification.create({
      data: {
        message:
          action === "approve"
            ? `Conteúdo "${content.title}" foi APROVADO`
            : `Conteúdo "${content.title}" precisa de AJUSTES: ${feedback || ""}`,
      },
    });

    return NextResponse.json(content);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Erro interno" },
      { status: 500 }
    );
  }
}