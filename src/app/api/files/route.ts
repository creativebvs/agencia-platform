export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

function sanitizeFileName(fileName: string) {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function GET() {
  try {
    const user = await requireUser();

    const where =
      user.role === "client"
        ? {
            content: {
              clientId: user.clientId || "",
            },
          }
        : {};

    const files = await prisma.file.findMany({
      where,
      include: {
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

    return NextResponse.json(files, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao listar arquivos:", error);

    return NextResponse.json(
      { message: "Erro ao listar arquivos." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão para enviar arquivos." },
        { status: 403 }
      );
    }

    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const contentId = formData.get("contentId")?.toString() || "";

    if (!file || !contentId) {
      return NextResponse.json(
        { message: "Arquivo e conteúdo são obrigatórios." },
        { status: 400 }
      );
    }

    const content = await prisma.content.findUnique({
      where: {
        id: contentId,
      },
      include: {
        client: true,
      },
    });

    if (!content) {
      return NextResponse.json(
        { message: "Conteúdo não encontrado." },
        { status: 404 }
      );
    }

    const safeFileName = sanitizeFileName(file.name);
    const pathname = `contents/${contentId}/${Date.now()}-${safeFileName}`;

    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
    });

    const savedFile = await prisma.file.create({
      data: {
        name: file.name,
        url: blob.url,
        contentId,
      },
      include: {
        content: {
          include: {
            client: true,
          },
        },
      },
    });

    return NextResponse.json(savedFile, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao enviar arquivo:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? `Erro ao enviar arquivo: ${error.message}`
            : "Erro ao enviar arquivo.",
      },
      { status: 500 }
    );
  }
}