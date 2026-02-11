"use client";

import React from "react";

import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import { Check, User, Building2, MapPin, Phone, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

function ConfirmRow({
  label,
  value,
  icon: Icon,
  verified,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  verified: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted/30">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          verified
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">
          {value || "Not assigned"}
        </p>
      </div>
      {verified && (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success">
          <Check className="h-3 w-3 text-success-foreground" strokeWidth={3} />
        </div>
      )}
    </div>
  );
}

export function DealAssignmentStep({
  deal,
  dealDetail,
}: {
  deal: DealForUI;
  dealDetail?: import("@/lib/actions/deals").DealDetail | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Deal Assignment</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm all personnel and customer information is accurate before
          proceeding.
        </p>
      </div>

      {/* Team Assignment */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Team
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <ConfirmRow
            icon={User}
            label="Closer"
            value={deal.closer.name}
            verified={true}
          />
          <ConfirmRow
            icon={User}
            label="Setter"
            value={deal.setter.name}
            verified={true}
          />
          <ConfirmRow
            icon={Building2}
            label="Office"
            value={deal.closer.office}
            verified={true}
          />
          <ConfirmRow
            icon={User}
            label="Team"
            value="Residential Solar"
            verified={true}
          />
        </div>
      </div>

      {/* Customer Information */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Customer
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <ConfirmRow
            icon={User}
            label="Customer Name"
            value={deal.customerName}
            verified={!!deal.customerName}
          />
          <ConfirmRow
            icon={MapPin}
            label="Address"
            value={`${deal.address}, ${deal.city}, ${deal.state}`}
            verified={!!deal.address}
          />
          <ConfirmRow
            icon={Phone}
            label="Phone"
            value={deal.phone}
            verified={!!deal.phone}
          />
          <ConfirmRow
            icon={Mail}
            label="Email"
            value={deal.email}
            verified={!!deal.email}
          />
        </div>
      </div>

      {/* Confirm Button */}
      <div className="flex justify-end">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
        >
          <Check className="h-4 w-4" />
          Confirm Assignment
        </button>
      </div>
    </div>
  );
}
