import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

// ======================
// GET - listar arquivos
// ======================
export async function GET(request: Request, context: any) {
  try {
    await requireUser();

    const id = context.params.id;

    const files = await prisma.file.findMany({
      where: {
        contentId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao buscar arquivos." },
      { status: 500 }
    );
  }
}

// ======================
// POST - criar arquivo
// ======================
export async function POST(request: Request, context: any) {
  try {
    await requireUser();

    const id = context.params.id;
    const body = await request.json();

    const file = await prisma.file.create({
      data: {
        url: body.url,
        name: body.name,
        contentId: id,
      },
    });

    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json(
      { message: "Erro ao criar arquivo." },
      { status: 500 }
    );
  }
}