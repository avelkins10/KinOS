import { NextResponse } from "next/server";
import { searchDeals } from "@/lib/actions/deals";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const { data, error } = await searchDeals(q.trim());
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 500 },
    );
  }
}
