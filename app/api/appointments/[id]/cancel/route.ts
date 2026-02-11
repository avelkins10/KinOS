import { NextRequest, NextResponse } from "next/server";
import { cancelAppointment } from "@/lib/actions/appointments";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Missing appointment id" },
      { status: 400 },
    );
  }
  let body: { reason?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    // optional body
  }
  const { data, error } = await cancelAppointment(id, body?.reason);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  return NextResponse.json({ data }, { status: 200 });
}
