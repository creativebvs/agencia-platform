import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      if (!user.clientId) {
        return NextResponse.json([], { status: 200 });
      }

      const files = await prisma.fileItem.findMany({
        where: {
          clientId: user.clientId,
        },
        include: {
          client: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(files, { status: 200 });
    }

    const files = await prisma.fileItem.findMany({
      include: {
        client: true,
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
    const clientId = formData.get("clientId")?.toString() || "";

    if (!file || !clientId) {
      return NextResponse.json(
        { message: "Arquivo e cliente são obrigatórios." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = path.join(uploadsDir, safeFileName);

    await writeFile(filePath, buffer);

    const savedFile = await prisma.fileItem.create({
      data: {
        name: safeFileName,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        path: `/uploads/${safeFileName}`,
        clientId,
      },
      include: {
        client: true,
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
      { message: "Erro ao enviar arquivo." },
      { status: 500 }
    );
  }
}