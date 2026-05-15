export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/db/prisma";

const DAYS_TO_KEEP = 7;

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authorization = request.headers.get("authorization");

    if (!cronSecret) {
      return NextResponse.json(
        { message: "CRON_SECRET não configurado." },
        { status: 500 }
      );
    }

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: "Não autorizado." },
        { status: 401 }
      );
    }

    const cutoffDate = new Date(
      Date.now() - DAYS_TO_KEEP * 24 * 60 * 60 * 1000
    );

    const oldFiles = await prisma.file.findMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    let deletedFromBlob = 0;
    let failedFromBlob = 0;

    for (const file of oldFiles) {
      try {
        if (file.url) {
          await del(file.url);
          deletedFromBlob += 1;
        }
      } catch (error) {
        failedFromBlob += 1;
        console.error("Erro ao excluir do Blob:", file.id, error);
      }
    }

    const ids = oldFiles.map((file) => file.id);

    let deletedFromDatabase = 0;

    if (ids.length > 0) {
      const result = await prisma.file.deleteMany({
        where: {
          id: {
            in: ids,
          },
        },
      });

      deletedFromDatabase = result.count;
    }

    return NextResponse.json(
      {
        success: true,
        daysToKeep: DAYS_TO_KEEP,
        cutoffDate,
        found: oldFiles.length,
        deletedFromBlob,
        failedFromBlob,
        deletedFromDatabase,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao limpar arquivos antigos:", error);

    return NextResponse.json(
      { message: "Erro ao limpar arquivos antigos." },
      { status: 500 }
    );
  }
}