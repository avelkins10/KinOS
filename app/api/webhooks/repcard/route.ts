import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // RepCard webhook handler
  // To be implemented in Epic 2
  return NextResponse.json(
    { message: "RepCard webhook endpoint" },
    { status: 200 },
  );
}
