export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getCurrentUser() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("creative_session")?.value ||
    cookieStore.get("session")?.value ||
    null;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!session || !session.user) {
    return null;
  }

  if (session.expiresAt && session.expiresAt < new Date()) {
    await prisma.session.delete({
      where: { token },
    });

    return null;
  }

  return session.user;
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    const where =
      user.role === "admin"
        ? {}
        : {
            clientId: user.clientId || "",
          };

    const contents = await prisma.content.findMany({
      where,
      include: {
        client: true,
        files: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(contents, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar conteúdos:", error);

    return NextResponse.json(
      { message: "Erro interno ao buscar conteúdos." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Cliente não pode criar conteúdo." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "post";
    const caption =
      typeof body.caption === "string" ? body.caption.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const status =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "draft";
    const clientId =
      typeof body.clientId === "string" ? body.clientId.trim() : "";
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

    const allowedStatuses = [
      "draft",
      "in_review",
      "waiting_client",
      "approved",
      "published",
      "changes_requested",
    ];

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

    const content = await prisma.content.create({
      data: {
        title,
        type,
        caption: caption || null,
        description: description || null,
        status,
        scheduledDate,
        clientId,
      },
      include: {
        client: true,
        files: true,
      },
    });

    return NextResponse.json(content, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar conteúdo:", error);

    return NextResponse.json(
      { message: "Erro interno ao criar conteúdo." },
      { status: 500 }
    );
  }
}