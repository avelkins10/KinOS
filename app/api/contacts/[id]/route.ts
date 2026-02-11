import { NextResponse } from "next/server";
import {
  getContact,
  updateContact,
  deleteContact,
} from "@/lib/actions/contacts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const { data, error } = await getContact(id);
    if (error) return NextResponse.json({ error }, { status: 400 });
    if (!data)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Fetch failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const body = await request.json();
    const { data, error } = await updateContact(id, {
      first_name: body?.first_name,
      last_name: body?.last_name,
      email: body?.email,
      phone: body?.phone,
      secondary_email: body?.secondary_email,
      secondary_phone: body?.secondary_phone,
      address: body?.address,
      address2: body?.address2,
      city: body?.city,
      state: body?.state,
      zip: body?.zip,
      owner_id: body?.owner_id,
      contact_source: body?.contact_source,
      contact_type: body?.contact_type,
      lead_status: body?.lead_status,
    });
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const { success, error } = await deleteContact(id);
    if (!success) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 500 },
    );
  }
}
