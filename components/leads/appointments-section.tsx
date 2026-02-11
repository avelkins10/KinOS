"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MapPin, Clock, User, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary border-primary/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  no_show: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-slate-100 text-slate-600 border-slate-300",
  rescheduled: "bg-amber-100 text-amber-800 border-amber-300",
};

interface AppointmentsSectionProps {
  contactId: string;
  appointments: AppointmentWithRelations[];
  closerOptions: { id: string; name: string }[];
  onUpdate?: () => void;
}

export function AppointmentsSection({
  contactId,
  appointments,
  closerOptions,
  onUpdate,
}: AppointmentsSectionProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closerId, setCloserId] = useState("");
  const [appointmentType, setAppointmentType] = useState<
    "in_home" | "virtual" | "phone"
  >("in_home");

  const active =
    [...appointments]
      .filter((a) => a.status === "scheduled" || a.status === "confirmed")
      .sort(
        (a, b) =>
          new Date(a.scheduled_start).getTime() -
          new Date(b.scheduled_start).getTime(),
      )[0] ?? null;
  const history = [...appointments].sort(
    (a, b) =>
      new Date(b.scheduled_start).getTime() -
      new Date(a.scheduled_start).getTime(),
  );

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!closerId) return;
    setLoading(true);
    const form = e.currentTarget;
    const scheduledStart = (
      form.elements.namedItem("scheduledStart") as HTMLInputElement
    ).value;
    const scheduledEnd = (
      form.elements.namedItem("scheduledEnd") as HTMLInputElement
    ).value;
    const location = (form.elements.namedItem("location") as HTMLInputElement)
      .value;
    const notes = (form.elements.namedItem("notes") as HTMLTextAreaElement)
      .value;
    if (!scheduledStart) {
      setLoading(false);
      return;
    }
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        closerId,
        scheduledStart,
        scheduledEnd: scheduledEnd || null,
        location: location || null,
        notes: notes || null,
        appointmentType,
      }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || json.error) return;
    setDialogOpen(false);
    onUpdate?.();
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Appointments</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8">
              <Plus className="h-3.5 w-3.5" />
              New appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New appointment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="scheduledStart">Date & time *</Label>
                <Input
                  id="scheduledStart"
                  name="scheduledStart"
                  type="datetime-local"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="scheduledEnd">End (optional)</Label>
                <Input
                  id="scheduledEnd"
                  name="scheduledEnd"
                  type="datetime-local"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="closerId">Closer *</Label>
                <Select value={closerId} onValueChange={setCloserId}>
                  <SelectTrigger id="closerId" className="mt-1">
                    <SelectValue placeholder="Select closer" />
                  </SelectTrigger>
                  <SelectContent>
                    {closerOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={appointmentType}
                  onValueChange={(v) =>
                    setAppointmentType(v as "in_home" | "virtual" | "phone")
                  }
                >
                  <SelectTrigger id="type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_home">In-Home</SelectItem>
                    <SelectItem value="virtual">Virtual</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Address or meeting link"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} className="mt-1" />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create appointment"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {active && (
          <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active appointment
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-foreground">
                {new Date(active.scheduled_start).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              <Badge className={cn("text-xs", STATUS_COLORS[active.status])}>
                {active.status}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {(active.appointment_type ?? "in_home").replace("_", " ")}
              </Badge>
            </div>
            {active.location && (
              <a
                href={
                  active.location.startsWith("http")
                    ? active.location
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(active.location)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <MapPin className="h-3.5 w-3.5" />
                {active.location}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {active.closer && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Closer: {active.closer.first_name} {active.closer.last_name}
              </p>
            )}
            {active.notes && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {active.notes}
              </p>
            )}
            {active.deal?.id && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0"
                onClick={() => router.push(`/deals/${active.deal!.id}`)}
              >
                View deal
              </Button>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Appointment history ({history.length})
          </p>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No appointments yet.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((a) => {
                const dateTime = new Date(a.scheduled_start).toLocaleString(
                  undefined,
                  { dateStyle: "short", timeStyle: "short" },
                );
                const closerName = a.closer
                  ? `${a.closer.first_name} ${a.closer.last_name}`
                  : "—";
                const setterName = a.setter
                  ? `${a.setter.first_name} ${a.setter.last_name}`
                  : "—";
                return (
                  <div
                    key={a.id}
                    role="button"
                    tabIndex={0}
                    className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border p-3 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                    onClick={() =>
                      a.deal?.id
                        ? router.push(`/deals/${a.deal.id}`)
                        : undefined
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{dateTime}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", STATUS_COLORS[a.status])}
                        >
                          {a.status}
                        </Badge>
                        {a.outcome && (
                          <span className="text-xs text-muted-foreground">
                            {a.outcome}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {a.location ?? "—"} · Closer: {closerName} · Set by{" "}
                        {setterName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
