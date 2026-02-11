import { notFound } from "next/navigation";
import { getContact } from "@/lib/actions/contacts";
import { getOffices, getClosers } from "@/lib/actions/deals";
import { getCurrentUser } from "@/lib/actions/auth";
import { getContactAppointments } from "@/lib/actions/appointments";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [
    contactResult,
    officesResult,
    closersResult,
    user,
    appointmentsResult,
  ] = await Promise.all([
    getContact(id),
    getOffices(),
    getClosers(),
    getCurrentUser(),
    getContactAppointments(id),
  ]);
  const contact = contactResult.data;
  const error = contactResult.error;
  if (error || !contact) {
    notFound();
  }
  const officeOptions = officesResult.data ?? [];
  const ownerOptions = closersResult.data ?? [];
  const setterOptions = closersResult.data ?? [];
  const appointments = appointmentsResult.data ?? [];
  return (
    <LeadDetailClient
      contact={contact}
      officeOptions={officeOptions}
      ownerOptions={ownerOptions}
      setterOptions={setterOptions}
      currentUserId={user?.userId ?? undefined}
      isAdmin={user?.role === "admin"}
      appointments={appointments}
    />
  );
}
