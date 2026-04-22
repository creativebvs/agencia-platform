import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

export async function POST(request: Request, context: any) {
  try {
    const user = await requireUser();

    if (user.role !== "client") {
      return NextResponse.json(
        { message: "Apenas clientes podem aprovar." },
        { status: 403 }
      );
    }

    const id = context.params.id;
    const body = await request.json();

    const allowedStatuses = ["approved", "changes_requested"];

    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { message: "Status inválido." },
        { status: 400 }
      );
    }

    const updated = await prisma.content.update({
      where: { id },
      data: {
        status: body.status,
        approvalNote: body.approvalNote || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao aprovar conteúdo." },
      { status: 500 }
    );
  }
}