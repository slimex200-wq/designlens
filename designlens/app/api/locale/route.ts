import { NextRequest, NextResponse } from "next/server";
import { locales, type Locale } from "@/i18n/request";

export async function POST(request: NextRequest) {
  const { locale } = (await request.json()) as { locale: string };

  if (!locales.includes(locale as Locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}
