"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User, Mail, Phone, ExternalLink } from "lucide-react";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";
import { useRouter } from "next/navigation";

interface AppointmentDetailModalProps {
  appointment: AppointmentWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDetailModal({
  appointment,
  open,
  onOpenChange,
}: AppointmentDetailModalProps) {
  const router = useRouter();

  if (!appointment) return null;

  const contact = appointment.contact;
  const contactName = contact
    ? `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || "—"
    : "—";
  const address = contact
    ? [contact.address, contact.city, contact.state, contact.zip]
        .filter(Boolean)
        .join(", ")
    : (appointment.location ?? "—");
  const mapsUrl =
    address !== "—"
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;
  const startTime = appointment.scheduled_start
    ? new Date(appointment.scheduled_start).toLocaleString(undefined, {
        dateStyle: "full",
        timeStyle: "short",
      })
    : "—";
  const closerName = appointment.closer
    ? `${appointment.closer.first_name} ${appointment.closer.last_name}`
    : "—";
  const setterName = appointment.setter
    ? `${appointment.setter.first_name} ${appointment.setter.last_name}`
    : "—";

  async function handleCancel() {
    const res = await fetch(`/api/appointments/${appointment!.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && !json.error) {
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact</p>
            <p className="font-semibold">{contactName}</p>
            {contact?.email && (
              <a
                href={`mailto:${contact.email}`}
                className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {contact.email}
              </a>
            )}
            {contact?.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                {contact.phone}
              </a>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Date & time
            </p>
            <p className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {startTime}
            </p>
            {appointment.timezone && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {appointment.timezone}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Location
            </p>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <MapPin className="h-4 w-4 shrink-0" />
                {address}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="flex items-center gap-1.5">{address}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {(appointment.appointment_type ?? "in_home").replace("_", " ")}
            </Badge>
            <Badge variant="outline">{appointment.status}</Badge>
            {appointment.outcome && (
              <Badge variant="outline">{appointment.outcome}</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Closer</p>
              <p className="font-medium">{closerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Setter</p>
              <p className="font-medium">{setterName}</p>
            </div>
          </div>
          {appointment.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes</p>
              <p className="text-sm">{appointment.notes}</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {appointment.deal?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/deals/${appointment.deal!.id}`)}
            >
              View Deal
            </Button>
          )}
          {contact?.id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/leads/${contact.id}`)}
            >
              View Contact
            </Button>
          )}
          {appointment.status === "scheduled" ||
          appointment.status === "confirmed" ? (
            <Button variant="destructive" size="sm" onClick={handleCancel}>
              Cancel Appointment
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
