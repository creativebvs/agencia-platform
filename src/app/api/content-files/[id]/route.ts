import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

type Context = {
  params: { id: string };
};
export async function POST(req: Request, context: Context) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão para enviar arquivos." },
        { status: 403 }
      );
    }

    

    const content = await prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      return NextResponse.json(
        { message: "Conteúdo não encontrado." },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo é obrigatório." },
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
        clientId: content.clientId,
        contentId: content.id,
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

    console.error("Erro ao enviar arquivo para conteúdo:", error);

    return NextResponse.json(
      { message: "Erro ao enviar arquivo para conteúdo." },
      { status: 500 }
    );
  }
}