export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

const allowedPriorities = ["low", "medium", "high"];
const allowedStatuses = ["todo", "doing", "done"];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const task = await prisma.task.findUnique({
      where: {
        id,
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

    if (!task) {
      return NextResponse.json(
        { message: "Tarefa não encontrada." },
        { status: 404 }
      );
    }

    if (user.role === "client") {
      if (!user.clientId || task.clientId !== user.clientId) {
        return NextResponse.json(
          { message: "Sem permissão para esta tarefa." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao buscar tarefa:", error);

    return NextResponse.json(
      { message: "Erro ao buscar tarefa." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Cliente não pode editar tarefas." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const existingTask = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { message: "Tarefa não encontrada." },
        { status: 404 }
      );
    }

    const updateData: {
      title?: string;
      status?: "todo" | "doing" | "done";
      priority?: "low" | "medium" | "high";
      description?: string | null;
      assignee?: string | null;
      dueDate?: Date | null;
      clientId?: string | null;
      contentId?: string | null;
    } = {};

    if ("title" in body) {
      const title = getString(body.title);

      if (!title) {
        return NextResponse.json(
          { message: "Título é obrigatório." },
          { status: 400 }
        );
      }

      updateData.title = title;
    }

    if ("status" in body) {
      const status = getString(body.status);

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { message: "Status inválido." },
          { status: 400 }
        );
      }

      updateData.status = status as "todo" | "doing" | "done";
    }

    if ("priority" in body) {
      const priority = getString(body.priority);

      if (!allowedPriorities.includes(priority)) {
        return NextResponse.json(
          { message: "Prioridade inválida." },
          { status: 400 }
        );
      }

      updateData.priority = priority as "low" | "medium" | "high";
    }

    if ("description" in body) {
      const description = getString(body.description);
      updateData.description = description || null;
    }

    if ("assignee" in body) {
      const assignee = getString(body.assignee);
      updateData.assignee = assignee || null;
    }

    if ("dueDate" in body) {
      updateData.dueDate =
        typeof body.dueDate === "string" && body.dueDate
          ? new Date(body.dueDate)
          : null;
    }

    if ("clientId" in body) {
      const clientId = getString(body.clientId);

      if (!clientId) {
        return NextResponse.json(
          { message: "Cliente é obrigatório." },
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

      updateData.clientId = clientId;
    }

    if ("contentId" in body) {
      const contentId = getString(body.contentId);

      if (!contentId) {
        updateData.contentId = null;
      } else {
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

        const finalClientId =
          updateData.clientId || existingTask.clientId || "";

        if (content.clientId !== finalClientId) {
          return NextResponse.json(
            {
              message:
                "O conteúdo selecionado precisa pertencer ao mesmo cliente da tarefa.",
            },
            { status: 400 }
          );
        }

        updateData.contentId = contentId;
      }
    }

    const updated = await prisma.task.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        client: true,
        content: {
          include: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao atualizar tarefa:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro ao atualizar tarefa: ${error.message}`
            : "Erro ao atualizar tarefa.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Cliente não pode excluir tarefas." },
        { status: 403 }
      );
    }

    const task = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task) {
      return NextResponse.json(
        { message: "Tarefa não encontrada." },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Tarefa excluída." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao excluir tarefa:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro ao excluir tarefa: ${error.message}`
            : "Erro ao excluir tarefa.",
      },
      { status: 500 }
    );
  }
}