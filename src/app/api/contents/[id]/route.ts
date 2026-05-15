export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = [
  "draft",
  "in_review",
  "waiting_client",
  "approved",
  "published",
  "changes_requested",
];

export async function GET(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const content = await prisma.content.findUnique({
      where: {
        id,
      },
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

    if (user.role === "client") {
      if (!user.clientId || content.clientId !== user.clientId) {
        return NextResponse.json(
          { message: "Sem permissão para este conteúdo." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao buscar conteúdo:", error);

    return NextResponse.json(
      { message: "Erro ao buscar conteúdo." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const body = await request.json();

    const existingContent = await prisma.content.findUnique({
      where: {
        id,
      },
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

      const status =
        typeof body.status === "string" ? body.status.trim() : "";

      if (!["approved", "changes_requested"].includes(status)) {
        return NextResponse.json(
          { message: "Cliente só pode aprovar ou pedir ajustes." },
          { status: 403 }
        );
      }

      const approvalNote =
        typeof body.approvalNote === "string"
          ? body.approvalNote.trim()
          : "";

      const updatedByClient = await prisma.content.update({
        where: {
          id,
        },
        data: {
          status,
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
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : existingContent.status;

    const clientId =
      typeof body.clientId === "string" && body.clientId.trim()
        ? body.clientId.trim()
        : existingContent.clientId;

    const approvalNote =
      typeof body.approvalNote === "string"
        ? body.approvalNote.trim()
        : existingContent.approvalNote || "";

    const scheduledDate =
      typeof body.scheduledDate === "string" && body.scheduledDate
        ? new Date(body.scheduledDate)
        : null;

    if (!title || !type || !clientId) {
      return NextResponse.json(
        { message: "Título, tipo e cliente são obrigatórios." },
        { status: 400 }
      );
    }

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Status inválido." },
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

    const content = await prisma.content.update({
      where: {
        id,
      },
      data: {
        title,
        type,
        caption: caption || null,
        description: description || null,
        status,
        scheduledDate,
        approvalNote: approvalNote || null,
        clientId,
      },
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
      {
        message:
          error instanceof Error
            ? `Erro ao atualizar conteúdo: ${error.message}`
            : "Erro ao atualizar conteúdo.",
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
        { message: "Sem permissão." },
        { status: 403 }
      );
    }

    const content = await prisma.content.findUnique({
      where: {
        id,
      },
      include: {
        files: true,
      },
    });

    if (!content) {
      return NextResponse.json(
        { message: "Conteúdo não encontrado." },
        { status: 404 }
      );
    }

    for (const file of content.files) {
      try {
        if (file.url) {
          await del(file.url);
        }
      } catch (blobError) {
        console.error("Erro ao excluir arquivo do Blob:", file.id, blobError);
      }
    }

    await prisma.file.deleteMany({
      where: {
        contentId: id,
      },
    });

    await prisma.content.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      { message: "Conteúdo excluído." },
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
      {
        message:
          error instanceof Error
            ? `Erro ao excluir conteúdo: ${error.message}`
            : "Erro ao excluir conteúdo.",
      },
      { status: 500 }
    );
  }
}