import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

// ======================
// GET
// ======================
export async function GET(request: Request, context: any) {
  try {
    await requireUser();

    const id = context.params.id;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { message: "Relatório não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar relatório." },
      { status: 500 }
    );
  }
}

// ======================
// PUT
// ======================
export async function PUT(request: Request, context: any) {
  try {
    await requireUser();

    const id = context.params.id;
    const body = await request.json();

    const updated = await prisma.report.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao atualizar relatório." },
      { status: 500 }
    );
  }
}

// ======================
// DELETE
// ======================
export async function DELETE(request: Request, context: any) {
  try {
    await requireUser();

    const id = context.params.id;

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Relatório excluído." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao excluir relatório." },
      { status: 500 }
    );
  }
}