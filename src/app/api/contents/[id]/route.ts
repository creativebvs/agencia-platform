import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

// ======================
// GET - buscar conteúdo
// ======================
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireUser();

    const id = params.id;

    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        client: true,
        files: true,
      },
    });

    if (!content) {
      return NextResponse.json(
        { message: "Conteúdo não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar conteúdo." },
      { status: 500 }
    );
  }
}

// ======================
// PUT - atualizar conteúdo
// ======================
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const id = params.id;
    const body = await request.json();

    const existing = await prisma.content.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Conteúdo não encontrado." },
        { status: 404 }
      );
    }

    if (user.role === "client") {
      const allowedStatuses = ["approved", "changes_requested"];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { message: "Sem permissão." },
          { status: 403 }
        );
      }

      const updated = await prisma.content.update({
        where: { id },
        data: {
          status: body.status,
          feedback: body.approvalNote || null, // 👈 CORRIGIDO (não existe approvalNote no schema)
        },
      });

      return NextResponse.json(updated);
    }

    const updated = await prisma.content.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        feedback: body.description || null, // 👈 adaptado pro schema real
        status: body.status,
        scheduledDate: body.scheduledDate
          ? new Date(body.scheduledDate)
          : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao atualizar conteúdo." },
      { status: 500 }
    );
  }
}

// ======================
// DELETE - excluir conteúdo
// ======================
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    const id = params.id;

    await prisma.content.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Conteúdo excluído." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao excluir conteúdo." },
      { status: 500 }
    );
  }
}