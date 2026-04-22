import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error("Erro ao listar tasks:", error);

    return NextResponse.json(
      { message: "Erro ao listar tasks." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const clientId =
      typeof body.clientId === "string" ? body.clientId.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const priority =
      typeof body.priority === "string" ? body.priority.trim() : "medium";
    const assignee =
      typeof body.assignee === "string" ? body.assignee.trim() : "";
    const dueDate =
      typeof body.dueDate === "string" && body.dueDate
        ? new Date(body.dueDate)
        : null;

    if (!title || !clientId) {
      return NextResponse.json(
        { message: "Título e cliente são obrigatórios." },
        { status: 400 }
      );
    }

const task = await prisma.task.create({
  data: {
    title,
    clientId,
    status: "todo", // 👈 ESSENCIAL (CORREÇÃO)
    description: description || null,
    priority: priority || "medium",
    assignee: assignee || null,
    dueDate,
  },
  include: {
    client: true,
  },
});

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar task:", error);

    return NextResponse.json(
      { message: "Erro ao criar task." },
      { status: 500 }
    );
  }
}