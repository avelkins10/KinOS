import { NextResponse } from "next/server";
import {
  getContacts,
  createContact,
  exportContactsToCSV,
  importContactsFromCSV,
  checkDuplicates,
  type ContactFilters,
} from "@/lib/actions/contacts";
import type { LeadStatus } from "@/lib/utils/lead-status";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    if (action === "export") {
      const filters: ContactFilters = {};
      const officeId = searchParams.get("office") ?? undefined;
      const ownerId = searchParams.get("owner") ?? undefined;
      const setterId = searchParams.get("setter") ?? undefined;
      const source = searchParams.get("source") ?? undefined;
      const status = searchParams.get("status") as LeadStatus | undefined;
      const dateFrom = searchParams.get("dateFrom") ?? undefined;
      const dateTo = searchParams.get("dateTo") ?? undefined;
      const search = searchParams.get("search") ?? undefined;
      const hasAppointment = searchParams.get("hasAppointment");
      if (officeId) filters.officeId = officeId;
      if (ownerId) filters.ownerId = ownerId;
      if (setterId) filters.setterId = setterId;
      if (source) filters.leadSource = source;
      if (status) filters.leadStatus = status;
      if (dateFrom || dateTo)
        filters.dateRange = { from: dateFrom, to: dateTo };
      if (hasAppointment === "true") filters.hasAppointment = true;
      if (search) filters.search = search;
      const { data: csv, error } = await exportContactsToCSV(filters);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    if (action === "check-duplicates") {
      const phone = searchParams.get("phone") ?? undefined;
      const email = searchParams.get("email") ?? undefined;
      const { data, error } = await checkDuplicates(phone, email);
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json(data);
    }

    const search = searchParams.get("search") ?? undefined;
    const officeId = searchParams.get("office") ?? undefined;
    const ownerId = searchParams.get("owner") ?? undefined;
    const setterId = searchParams.get("setter") ?? undefined;
    const source = searchParams.get("source") ?? undefined;
    const status = searchParams.get("status") as LeadStatus | undefined;
    const dateFrom = searchParams.get("dateFrom") ?? undefined;
    const dateTo = searchParams.get("dateTo") ?? undefined;
    const hasAppointment = searchParams.get("hasAppointment");
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = Math.min(
      parseInt(searchParams.get("perPage") ?? "25", 10),
      100,
    );
    const filters: ContactFilters = {};
    if (search) filters.search = search;
    if (officeId) filters.officeId = officeId;
    if (ownerId) filters.ownerId = ownerId;
    if (setterId) filters.setterId = setterId;
    if (source) filters.leadSource = source;
    if (status) filters.leadStatus = status;
    if (dateFrom || dateTo) filters.dateRange = { from: dateFrom, to: dateTo };
    if (hasAppointment === "true") filters.hasAppointment = true;

    const { data, total, error } = await getContacts(filters, {
      limit: perPage,
      offset: (page - 1) * perPage,
    });
    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ data, total });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Request failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.rows && Array.isArray(body.rows)) {
      const { data, error } = await importContactsFromCSV(body.rows, {
        skipDuplicates: body.skipDuplicates ?? false,
      });
      if (error) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.json(data);
    }
    const firstName = body?.first_name?.trim();
    const lastName = body?.last_name?.trim();
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "first_name and last_name are required" },
        { status: 400 },
      );
    }
    const { data, error, duplicateId } = await createContact({
      first_name: firstName,
      last_name: lastName,
      email: body?.email ?? null,
      phone: body?.phone ?? null,
      secondary_email: body?.secondary_email ?? null,
      secondary_phone: body?.secondary_phone ?? null,
      address: body?.address ?? null,
      address2: body?.address2 ?? null,
      city: body?.city ?? null,
      state: body?.state ?? null,
      zip: body?.zip ?? null,
      owner_id: body?.owner_id ?? null,
      contact_source: body?.contact_source ?? "Manual",
      contact_type: body?.contact_type ?? "lead",
    });
    if (error) {
      return NextResponse.json(
        { error, duplicateId: duplicateId ?? undefined },
        { status: 400 },
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 500 },
    );
  }
}
