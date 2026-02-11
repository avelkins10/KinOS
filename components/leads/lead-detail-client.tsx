"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { ContactDetail } from "@/lib/actions/contacts";
import type { LeadStatus } from "@/lib/utils/lead-status";

const LEAD_STATUSES: LeadStatus[] = [
  "New Lead",
  "Active Lead",
  "Customer",
  "Lost",
  "On Hold",
];
import { ContactInfoCard } from "./contact-info-card";
import { AssignmentCard } from "./assignment-card";
import { AppointmentsSection } from "./appointments-section";
import { DealsSection } from "./deals-section";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";
import { NotesSection } from "@/components/shared/notes-section";
import { AttachmentsSection } from "@/components/shared/attachments-section";

interface LeadDetailClientProps {
  contact: ContactDetail;
  officeOptions: { id: string; name: string }[];
  ownerOptions: { id: string; name: string }[];
  setterOptions: { id: string; name: string }[];
  currentUserId?: string;
  isAdmin?: boolean;
  appointments?: AppointmentWithRelations[];
}

export function LeadDetailClient({
  contact,
  officeOptions,
  ownerOptions,
  setterOptions,
  currentUserId,
  isAdmin,
  appointments = [],
}: LeadDetailClientProps) {
  const router = useRouter();
  const [leadStatus, setLeadStatus] = useState<LeadStatus>(contact.leadStatus);
  const name = `${contact.first_name} ${contact.last_name}`.trim();
  const contactType = contact.contact_type ?? "lead";

  const handleLeadStatusChange = async (value: LeadStatus) => {
    setLeadStatus(value);
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_status: value }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Update failed");
        setLeadStatus(contact.leadStatus);
        return;
      }
      router.refresh();
    } catch {
      toast.error("Update failed");
      setLeadStatus(contact.leadStatus);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-6 py-5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => router.push("/leads")}
            aria-label="Back to leads"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="page-header text-foreground">{name || "Lead"}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {contactType}
              </Badge>
              <Select
                value={leadStatus}
                onValueChange={(v) => handleLeadStatusChange(v as LeadStatus)}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue placeholder="Lead status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ContactInfoCard
              contactId={contact.id}
              initialData={{
                first_name: contact.first_name,
                last_name: contact.last_name,
                email: contact.email,
                phone: contact.phone,
                secondary_email: contact.secondary_email,
                secondary_phone: contact.secondary_phone,
                address: contact.address,
                city: contact.city,
                state: contact.state,
                zip: contact.zip,
              }}
              onUpdate={() => router.refresh()}
            />
            <AssignmentCard
              contactId={contact.id}
              office={contact.office ?? null}
              officeOptions={officeOptions}
              owner={contact.owner ?? null}
              ownerOptions={ownerOptions}
              setter={contact.setter ?? null}
              setterOptions={setterOptions}
              contactSource={contact.contact_source}
              onUpdate={() => router.refresh()}
            />
          </div>

          <AppointmentsSection
            contactId={contact.id}
            appointments={appointments}
            closerOptions={ownerOptions}
            onUpdate={() => router.refresh()}
          />

          <DealsSection
            contactId={contact.id}
            deals={(contact.deals ?? []).map((d) => ({
              id: d.id,
              deal_number: d.deal_number,
              stage: d.stage,
              gross_price: d.gross_price,
              created_at: d.created_at,
            }))}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <NotesSection
              entityType="contact"
              entityId={contact.id}
              initialNotes={(contact.notes ?? []).map((n) => ({
                id: n.id,
                content: n.content,
                author_id: n.author_id,
                is_pinned: n.is_pinned ?? false,
                created_at: n.created_at,
                author: null,
              }))}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
            <AttachmentsSection
              entityType="contact"
              entityId={contact.id}
              initialAttachments={contact.attachments ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
