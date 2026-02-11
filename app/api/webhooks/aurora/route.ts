import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Aurora webhook handler
  // To be implemented in Epic 6
  return NextResponse.json(
    { message: "Aurora webhook endpoint" },
    { status: 200 },
  );
}
