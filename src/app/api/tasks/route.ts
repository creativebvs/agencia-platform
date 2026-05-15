export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

const allowedPriorities = ["low", "medium", "high"];
const allowedStatuses = ["todo", "doing", "done"];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  try {
    const user = await requireUser();

    const where =
      user.role === "client"
        ? {
            clientId: user.clientId || "",
          }
        : {};

    const tasks = await prisma.task.findMany({
      where,
      include: {
        client: true,
        content: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao listar tarefas:", error);

    return NextResponse.json(
      { message: "Erro ao listar tarefas." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Cliente não pode criar tarefas." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const title = getString(body.title);
    const clientId = getString(body.clientId);
    const contentId = getString(body.contentId);
    const description = getString(body.description);
    const assignee = getString(body.assignee);
    const dueDate =
      typeof body.dueDate === "string" && body.dueDate
        ? new Date(body.dueDate)
        : null;

    const priority = allowedPriorities.includes(getString(body.priority))
      ? getString(body.priority)
      : "medium";

    const status = allowedStatuses.includes(getString(body.status))
      ? getString(body.status)
      : "todo";

    if (!title || !clientId) {
      return NextResponse.json(
        { message: "Título e cliente são obrigatórios." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { message: "Cliente não encontrado." },
        { status: 404 }
      );
    }

    if (contentId) {
      const content = await prisma.content.findUnique({
        where: {
          id: contentId,
        },
      });

      if (!content) {
        return NextResponse.json(
          { message: "Conteúdo vinculado não encontrado." },
          { status: 404 }
        );
      }

      if (content.clientId !== clientId) {
        return NextResponse.json(
          {
            message:
              "O conteúdo selecionado precisa pertencer ao mesmo cliente da tarefa.",
          },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        clientId,
        contentId: contentId || null,
        status,
        description: description || null,
        priority,
        assignee: assignee || null,
        dueDate,
      },
      include: {
        client: true,
        content: {
          include: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao criar tarefa:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro ao criar tarefa: ${error.message}`
            : "Erro ao criar tarefa.",
      },
      { status: 500 }
    );
  }
}