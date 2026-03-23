import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    colors: [],
    layouts: [],
    typography: [],
    period: new Date().toISOString().slice(0, 7),
  });
}
