export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const token = req.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${SESSION_COOKIE_NAME}=`))
      ?.split("=")[1] || null;

    await deleteSession(token);

    const response = NextResponse.json(
      { message: "Logout realizado com sucesso." },
      { status: 200 }
    );

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);

    return NextResponse.json(
      { message: "Erro ao fazer logout." },
      { status: 500 }
    );
  }
}