import { Suspense } from "react";
import { getContacts } from "@/lib/actions/contacts";
import { getOffices, getClosers } from "@/lib/actions/deals";
import { LeadsPageClient } from "@/components/leads/leads-page-client";
import type {
  ContactFilters,
  ContactSortField,
  ContactSortDir,
} from "@/lib/actions/contacts";
import type { LeadStatus } from "@/lib/utils/lead-status";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = typeof params?.search === "string" ? params.search : undefined;
  const officeId =
    typeof params?.office === "string" ? params.office : undefined;
  const ownerId = typeof params?.owner === "string" ? params.owner : undefined;
  const setterId =
    typeof params?.setter === "string" ? params.setter : undefined;
  const source = typeof params?.source === "string" ? params.source : undefined;
  const status =
    typeof params?.status === "string"
      ? (params.status as LeadStatus)
      : undefined;
  const dateFrom =
    typeof params?.dateFrom === "string" ? params.dateFrom : undefined;
  const dateTo = typeof params?.dateTo === "string" ? params.dateTo : undefined;
  const hasAppointmentParam = params?.hasAppointment;
  const hasAppointment =
    hasAppointmentParam === "true"
      ? true
      : hasAppointmentParam === "no"
        ? false
        : undefined;
  const page = parseInt(
    typeof params?.page === "string" ? params.page : "1",
    10,
  );
  const perPage = Math.min(
    parseInt(typeof params?.perPage === "string" ? params.perPage : "25", 10),
    100,
  );
  const sortBy = (
    typeof params?.sortBy === "string" ? params.sortBy : undefined
  ) as ContactSortField | undefined;
  const sortDir = (
    typeof params?.sortDir === "string" ? params.sortDir : undefined
  ) as ContactSortDir | undefined;

  const filters: ContactFilters = {};
  if (search) filters.search = search;
  if (officeId) filters.officeId = officeId;
  if (ownerId) filters.ownerId = ownerId;
  if (setterId) filters.setterId = setterId;
  if (source) filters.leadSource = source;
  if (status) filters.leadStatus = status;
  if (dateFrom || dateTo) filters.dateRange = { from: dateFrom, to: dateTo };
  if (hasAppointment !== undefined) filters.hasAppointment = hasAppointment;
  if (sortBy) filters.sortBy = sortBy;
  if (sortDir) filters.sortDir = sortDir;

  const [contactsResult, officesResult, closersResult] = await Promise.all([
    getContacts(filters, { limit: perPage, offset: (page - 1) * perPage }),
    getOffices(),
    getClosers(officeId),
  ]);

  const initialData = contactsResult.data ?? [];
  const total = contactsResult.total ?? 0;
  const officeOptions = officesResult.data ?? [];
  const closerOptions = closersResult.data ?? [];
  const setterOptions = closerOptions;

  return (
    <Suspense fallback={<LeadsLoadingSkeleton />}>
      <LeadsPageClient
        initialData={initialData}
        initialTotal={total}
        officeOptions={officeOptions}
        ownerOptions={closerOptions}
        setterOptions={setterOptions}
        initialFilters={{
          search,
          officeId,
          ownerId,
          setterId,
          source,
          status,
          dateFrom,
          dateTo,
          hasAppointment,
          page,
          perPage,
          sortBy,
          sortDir,
        }}
      />
    </Suspense>
  );
}

function LeadsLoadingSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-6 py-5">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-1 h-4 w-48 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="h-64 w-full animate-pulse rounded-xl bg-muted/50" />
      </div>
    </div>
  );
}
