"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AppointmentWithRelations } from "@/lib/actions/appointments";

const PAGE_SIZE = 20;

interface AppointmentListViewProps {
  appointments: AppointmentWithRelations[];
  onAppointmentClick: (a: AppointmentWithRelations) => void;
  page?: number;
  onPageChange?: (page: number) => void;
}

export function AppointmentListView({
  appointments,
  onAppointmentClick,
  page = 1,
  onPageChange,
}: AppointmentListViewProps) {
  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = appointments.slice(start, start + PAGE_SIZE);

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No appointments in this range
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date / Time</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Closer</TableHead>
              <TableHead>Setter</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slice.map((a) => {
              const contactName = a.contact
                ? `${a.contact.first_name ?? ""} ${a.contact.last_name ?? ""}`.trim() ||
                  "—"
                : "—";
              const dateTime = a.scheduled_start
                ? new Date(a.scheduled_start).toLocaleString(undefined, {
                    dateStyle: "short",
                    timeStyle: "short",
                  })
                : "—";
              const closerName = a.closer
                ? `${a.closer.first_name} ${a.closer.last_name}`
                : "—";
              const setterName = a.setter
                ? `${a.setter.first_name} ${a.setter.last_name}`
                : "—";
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{dateTime}</TableCell>
                  <TableCell>{contactName}</TableCell>
                  <TableCell className="max-w-[180px] truncate">
                    {a.location ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {(a.appointment_type ?? "in_home").replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {closerName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {setterName}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAppointmentClick(a)}
                    >
                      Details
                    </Button>
                    {a.deal?.id && (
                      <Button variant="link" size="sm" asChild>
                        <Link href={`/deals/${a.deal.id}`}>Deal</Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({appointments.length} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
