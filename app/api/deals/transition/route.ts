import { NextResponse } from "next/server";
import { transitionDealStage } from "@/lib/actions/deals";
import type { DealStage } from "@/lib/constants/pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dealId = body?.dealId as string | undefined;
    const toStage = body?.toStage as DealStage | undefined;
    if (!dealId || !toStage) {
      return NextResponse.json(
        { error: "dealId and toStage are required" },
        { status: 400 },
      );
    }
    const { data, error } = await transitionDealStage(dealId, toStage);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Transition failed" },
      { status: 500 },
    );
  }
}
