import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  try {
    const resp = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(query)}`,
      { next: { revalidate: 0 } }
    );
    if (!resp.ok) {
      return NextResponse.json(
        { error: "Pollinations request failed" },
        { status: resp.status }
      );
    }
    const text = await resp.text();
    return new NextResponse(text, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
