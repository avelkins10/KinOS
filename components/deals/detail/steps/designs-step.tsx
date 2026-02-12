"use client";

import React, { useState } from "react";
import type { DealForUI } from "@/lib/deals-mappers";
import { DesignRequestForm } from "@/components/deals/design-request-form";
import { DesignResultsCard } from "@/components/deals/design-results-card";
import { DesignStatusBadge } from "@/components/deals/design-status-badge";
import {
  Sun,
  Zap,
  BarChart3,
  ExternalLink,
  Clock,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

export function DesignsStep({
  deal,
  onDealUpdated,
}: {
  deal: DealForUI;
  onDealUpdated?: () => void;
}) {
  const { toast } = useToast();
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const hasProject = !!deal.auroraProjectId;
  const designStatus = deal.designStatus ?? "not_started";
  const isDesignCompleted =
    designStatus === "design_completed" || designStatus === "design_accepted";
  const isDesignRejected = designStatus === "design_rejected";
  const isDesignRequested =
    designStatus === "design_requested" ||
    designStatus === "design_in_progress";
  const canRequestDesign =
    hasProject && !isDesignRequested && !isDesignCompleted;

  const handleCreateProject = async () => {
    setCreatingProject(true);
    try {
      const res = await fetch(`/api/deals/${deal.id}/aurora`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_project" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");
      toast({
        title: "Aurora project created",
        description: "You can now enter consumption and request a design.",
      });
      onDealUpdated?.();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setCreatingProject(false);
    }
  };

  const handleRequestRedesign = () => {
    setRequestFormOpen(true);
  };

  const designRequestedTooltip = deal.designRequestedAt
    ? `Requested ${new Date(deal.designRequestedAt).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        },
      )}`
    : undefined;

  if (!hasProject) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Designs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Request a design from Aurora to begin the system design process.
          </p>
        </div>
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sun className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              No Aurora project yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Create an Aurora project to generate a solar design for this
              customer. You can then enter consumption and request a design.
            </p>
            <Button
              type="button"
              className="mt-5 min-h-[44px] gap-2"
              onClick={handleCreateProject}
              disabled={creatingProject}
            >
              <ExternalLink className="h-4 w-4" />
              {creatingProject ? "Creating…" : "Create Aurora project"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground">Designs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDesignCompleted
              ? "Aurora design results for this project."
              : isDesignRejected
                ? "Design was rejected. Request a new design below."
                : isDesignRequested
                  ? "Design request is in progress."
                  : "Request a design from Aurora or open Sales Mode."}
          </p>
        </div>
        <DesignStatusBadge
          status={designStatus}
          tooltip={isDesignRequested ? designRequestedTooltip : undefined}
        />
      </div>

      {/* Consumption summary when project exists but no design yet */}
      {!isDesignCompleted &&
        !isDesignRejected &&
        deal.annualKwh != null &&
        deal.annualKwh > 0 && (
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Consumption on file
            </h4>
            <div className="flex flex-wrap gap-4">
              {deal.utilityCompany && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {deal.utilityCompany}
                  </span>
                </div>
              )}
              {deal.annualKwh != null && deal.annualKwh > 0 && (
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {deal.annualKwh.toLocaleString()} kWh/yr
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Design requested / in progress */}
      {isDesignRequested && !isDesignCompleted && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
              <Clock className="h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Design in progress</p>
                <p className="text-sm text-muted-foreground">
                  Aurora typically completes designs within 30 minutes to 3
                  hours. This page will update when the design is ready.
                </p>
              </div>
            </div>
            {deal.designRequestType && (
              <p className="mt-3 text-xs text-muted-foreground">
                Request type: {deal.designRequestType.replace(/_/g, " ")}
                {deal.targetOffset != null &&
                  ` · Target offset: ${deal.targetOffset}%`}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 min-h-[44px]"
              disabled
            >
              Request design (already requested)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Design completed */}
      {isDesignCompleted && (
        <DesignResultsCard
          deal={deal}
          onRequestRedesign={handleRequestRedesign}
        />
      )}

      {/* Design rejected */}
      {isDesignRejected && (
        <Card className="border-red-200 dark:border-red-900/50">
          <CardContent className="py-6">
            {deal.rejectionReason && (
              <p className="text-sm text-muted-foreground">
                {deal.rejectionReason}
              </p>
            )}
            <Button
              type="button"
              className="mt-4 min-h-[44px] gap-2"
              onClick={() => setRequestFormOpen(true)}
            >
              <Zap className="h-4 w-4" />
              Request new design
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Request design button when project exists and no design requested yet */}
      {canRequestDesign && (
        <div className="flex justify-end">
          <Button
            type="button"
            className="min-h-[44px] gap-2"
            onClick={() => setRequestFormOpen(true)}
          >
            <Sun className="h-4 w-4" />
            Request design
          </Button>
        </div>
      )}

      <DesignRequestForm
        dealId={deal.id}
        designStatus={designStatus}
        open={requestFormOpen}
        onOpenChange={setRequestFormOpen}
        onSuccess={() => {
          setRequestFormOpen(false);
          onDealUpdated?.();
        }}
        onCancel={() => setRequestFormOpen(false)}
      />
    </div>
  );
}
