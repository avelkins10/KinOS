import { NextResponse } from "next/server";
import {
  getFilterPresets,
  saveFilterPreset,
} from "@/lib/actions/filter-presets";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") ?? "leads";
    const { data, error } = await getFilterPresets(entityType);
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = body?.name as string | undefined;
    const filters = body?.filters as Record<string, unknown> | undefined;
    const entityType = (body?.entityType as string) ?? "leads";
    if (!name?.trim() || !filters || typeof filters !== "object") {
      return NextResponse.json(
        { error: "name and filters are required" },
        { status: 400 },
      );
    }
    const { data, error } = await saveFilterPreset(
      name.trim(),
      filters,
      entityType,
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Save failed" },
      { status: 500 },
    );
  }
}
