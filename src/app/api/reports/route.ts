export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

export async function GET() {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      if (!user.clientId) {
        return NextResponse.json([], { status: 200 });
      }

      const reports = await prisma.report.findMany({
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

      return NextResponse.json(reports, { status: 200 });
    }

    const reports = await prisma.report.findMany({
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao listar relatórios:", error);

    return NextResponse.json(
      { message: "Erro ao listar relatórios." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    if (user.role === "client") {
      return NextResponse.json(
        { message: "Sem permissão para criar relatórios." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const periodLabel =
      typeof body.periodLabel === "string" ? body.periodLabel.trim() : "";
    const clientId =
      typeof body.clientId === "string" ? body.clientId.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    const impressions = Number(body.impressions || 0);
    const reach = Number(body.reach || 0);
    const engagement = Number(body.engagement || 0);
    const clicks = Number(body.clicks || 0);
    const followersGained = Number(body.followersGained || 0);

    if (!title || !periodLabel || !clientId) {
      return NextResponse.json(
        { message: "Título, período e cliente são obrigatórios." },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        title,
        periodLabel,
        clientId,
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

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao criar relatório:", error);

    return NextResponse.json(
      { message: "Erro ao criar relatório." },
      { status: 500 }
    );
  }
}