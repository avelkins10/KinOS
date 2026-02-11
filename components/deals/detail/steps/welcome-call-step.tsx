"use client";

import type { DealForUI } from "@/lib/deals-mappers";
import { cn } from "@/lib/utils";
import { Check, PhoneCall, Square } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

function getChecklist(deal: DealForUI): ChecklistItem[] {
  const isLate = [
    "contract_sent",
    "contract_signed",
    "submission_ready",
    "submitted",
    "intake_approved",
    "intake_rejected",
  ].includes(deal.stage);
  return [
    {
      id: "wc1",
      label: "Confirm installation address",
      description:
        "Verify the customer's installation address matches the contract.",
      completed: isLate,
    },
    {
      id: "wc2",
      label: "Review system details",
      description: `${deal.systemSize ?? 0} kW system, ${deal.panelCount ?? 0} panels, ${deal.inverterBrand ?? "TBD"} inverter.`,
      completed: isLate,
    },
    {
      id: "wc3",
      label: "Explain timeline expectations",
      description:
        "Provide estimated timeline for permitting, installation, and PTO.",
      completed: isLate,
    },
    {
      id: "wc4",
      label: "Confirm financing terms",
      description: `${deal.lender ?? "No lender"} - ${deal.lenderProduct ?? "N/A"}, $${deal.monthlyPayment ?? 0}/mo.`,
      completed: isLate,
    },
    {
      id: "wc5",
      label: "Review lender-specific requirements",
      description:
        "Cover any lender-specific post-sale disclosures or acknowledgements.",
      completed: isLate,
    },
    {
      id: "wc6",
      label: "Verify customer contact info",
      description: `${deal.phone} / ${deal.email}`,
      completed: isLate,
    },
    {
      id: "wc7",
      label: "Schedule site survey",
      description: "Coordinate a date for the site survey with the customer.",
      completed: [
        "contract_signed",
        "submission_ready",
        "submitted",
        "intake_approved",
        "intake_rejected",
      ].includes(deal.stage),
    },
  ];
}

export function WelcomeCallStep({ deal }: { deal: DealForUI }) {
  const items = getChecklist(deal);
  const completedCount = items.filter((i) => i.completed).length;
  const allDone = completedCount === items.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Welcome Call</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Lender-specific post-sale requirements checklist.
          </p>
        </div>
        {allDone && (
          <div className="flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1.5">
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-bold text-success">Completed</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <PhoneCall className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">
              Checklist Progress
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {completedCount}/{items.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                allDone ? "bg-success" : "bg-primary",
              )}
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-4 transition-all",
              item.completed
                ? "border-success/20 bg-success/5"
                : "border-border bg-card hover:bg-muted/30",
            )}
          >
            <div className="mt-0.5">
              {item.completed ? (
                <div className="flex h-5 w-5 items-center justify-center rounded bg-success">
                  <Check
                    className="h-3 w-3 text-success-foreground"
                    strokeWidth={3}
                  />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded border-2 border-border">
                  <Square className="h-0 w-0" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  item.completed
                    ? "text-success line-through"
                    : "text-foreground",
                )}
              >
                {item.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
