import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const word = searchParams.get("word");
  const validateWordResponse = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
  );

  return NextResponse.json({ ok: validateWordResponse.status === 200 });
}
