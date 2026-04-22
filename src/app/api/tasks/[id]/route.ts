import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: body.status,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    console.error("Erro ao atualizar task:", error);

    return NextResponse.json(
      { message: "Erro ao atualizar task." },
      { status: 500 }
    );
  }
}