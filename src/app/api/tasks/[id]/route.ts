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

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { message: "Tarefa não encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar tarefa." },
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

    const updated = await prisma.task.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao atualizar tarefa." },
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

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Tarefa excluída." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao excluir tarefa." },
      { status: 500 }
    );
  }
}