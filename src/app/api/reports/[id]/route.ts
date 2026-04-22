import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: Request, context: Context) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão para editar relatórios." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const periodLabel =
      typeof body.periodLabel === "string" ? body.periodLabel.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    const impressions = Number(body.impressions || 0);
    const reach = Number(body.reach || 0);
    const engagement = Number(body.engagement || 0);
    const clicks = Number(body.clicks || 0);
    const followersGained = Number(body.followersGained || 0);

    if (!title || !periodLabel) {
      return NextResponse.json(
        { message: "Título e período são obrigatórios." },
        { status: 400 }
      );
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        title,
        periodLabel,
        notes: notes || null,
        impressions,
        reach,
        engagement,
        clicks,
        followersGained,
      },
      include: {
        client: true,
      },
    });

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao editar relatório:", error);

    return NextResponse.json(
      { message: "Erro ao editar relatório." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: Context) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão para excluir relatórios." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    await prisma.report.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Relatório excluído com sucesso." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao excluir relatório:", error);

    return NextResponse.json(
      { message: "Erro ao excluir relatório." },
      { status: 500 }
    );
  }
}
