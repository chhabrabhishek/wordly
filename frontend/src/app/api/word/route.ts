import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const length = searchParams.get("length");
  const randomWordResponse = await fetch(
    `https://random-word-api.vercel.app/api?words=1&length=${length}`
  );
  const randomWord = await randomWordResponse.json();

  return NextResponse.json(randomWord);
}
