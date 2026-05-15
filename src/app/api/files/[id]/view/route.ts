export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth-server";

function getBlobPathnameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, "");
  } catch {
    return url.replace(/^\/+/, "");
  }
}

function encodeFileName(fileName: string) {
  return encodeURIComponent(fileName).replace(/['()]/g, escape);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUser();

    const file = await prisma.file.findUnique({
      where: {
        id: params.id,
      },
      include: {
        content: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { message: "Arquivo não encontrado." },
        { status: 404 }
      );
    }

    if (user.role === "client") {
      if (!user.clientId || file.content.clientId !== user.clientId) {
        return NextResponse.json(
          { message: "Sem permissão para visualizar este arquivo." },
          { status: 403 }
        );
      }
    }

    const pathname = getBlobPathnameFromUrl(file.url);

    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) {
      return new NextResponse("Arquivo não encontrado no Blob.", {
        status: 404,
      });
    }

    if (result.statusCode === 304) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          "Cache-Control": "private, no-cache",
        },
      });
    }

    const contentType =
      result.blob.contentType || "application/octet-stream";

    return new NextResponse(result.stream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeFileName(
          file.name
        )}`,
        "X-Content-Type-Options": "nosniff",
        ETag: result.blob.etag,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 }
      );
    }

    console.error("Erro ao visualizar arquivo:", error);

    return NextResponse.json(
      { message: "Erro ao visualizar arquivo." },
      { status: 500 }
    );
  }
}