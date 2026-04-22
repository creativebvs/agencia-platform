import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

type Context = {
  params: { id: string }; // ✅ CORREÇÃO AQUI
};

export async function PUT(req: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = context.params; // ✅ SEM await
    const body = await req.json();

    const existingContent = await prisma.content.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });

    if (!existingContent) {
      return NextResponse.json(
        { message: "Conteúdo não encontrado." },
        { status: 404 }
      );
    }

    if (user.role === "client") {
      if (!user.clientId || existingContent.clientId !== user.clientId) {
        return NextResponse.json(
          { message: "Sem permissão para este conteúdo." },
          { status: 403 }
        );
      }

      const allowedStatuses = ["approved", "changes_requested"];

      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { message: "Client só pode aprovar ou pedir ajustes." },
          { status: 403 }
        );
      }

      const approvalNote =
        typeof body.approvalNote === "string" ? body.approvalNote.trim() : "";

      const updatedByClient = await prisma.content.update({
        where: { id },
        data: {
          status: body.status,
          approvalNote: approvalNote || null,
        },
        include: {
          client: true,
          files: true,
        },
      });

      return NextResponse.json(updatedByClient, { status: 200 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "";
    const caption =
      typeof body.caption === "string" ? body.caption.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const status =
      typeof body.status === "string" ? body.status.trim() : "draft";
    const approvalNote =
      typeof body.approvalNote === "string" ? body.approvalNote.trim() : "";
    const scheduledDate =
      typeof body.scheduledDate === "string" && body.scheduledDate
        ? new Date(body.scheduledDate)
        : null;

    const updateData: {
      title?: string;
      type?: string;
      caption?: string | null;
      description?: string | null;
      status?: string;
      scheduledDate?: Date | null;
      approvalNote?: string | null;
    } = {};

    if ("title" in body || "type" in body) {
      if (!title || !type) {
        return NextResponse.json(
          { message: "Título e tipo são obrigatórios." },
          { status: 400 }
        );
      }

      updateData.title = title;
      updateData.type = type;
      updateData.caption = caption || null;
      updateData.description = description || null;
      updateData.scheduledDate = scheduledDate;
    }

    if ("status" in body) {
      updateData.status = status;
    }

    if ("approvalNote" in body) {
      updateData.approvalNote = approvalNote || null;
    }

    const content = await prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        files: true,
      },
    });

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao atualizar conteúdo:", error);

    return NextResponse.json(
      { message: "Erro ao atualizar conteúdo." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: Context) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    const { id } = context.params; // ✅ SEM await

    await prisma.content.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Conteúdo excluído com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao excluir conteúdo:", error);

    return NextResponse.json(
      { message: "Erro ao excluir conteúdo." },
      { status: 500 }
    );
  }
}