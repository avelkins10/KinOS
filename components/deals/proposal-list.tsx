"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Copy, Trash2 } from "lucide-react";
import type { ProposalWithRelations } from "@/lib/actions/proposals";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ready: "bg-primary/10 text-primary",
  finalized: "bg-emerald-500/10 text-emerald-700",
  superseded: "bg-muted/50 text-muted-foreground",
};

export function ProposalList({
  proposals,
  activeProposalId,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
  isDeleting,
}: {
  proposals: ProposalWithRelations[];
  activeProposalId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: string | null;
}) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const targetProposal = deleteTarget
    ? proposals.find((p) => p.id === deleteTarget)
    : null;

  if (proposals.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={onNew} className="gap-2">
          <Plus className="h-4 w-4" />
          New Proposal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Tabs
        value={activeProposalId ?? proposals[0]?.id ?? ""}
        onValueChange={onSelect}
      >
        <TabsList className="flex w-full flex-wrap gap-1 bg-muted/50 p-1">
          {proposals.map((p) => (
            <TabsTrigger
              key={p.id}
              value={p.id}
              className={cn(
                "gap-2 data-[state=active]:bg-background",
                p.status === "finalized" && "border border-emerald-500/30",
              )}
            >
              <span className="truncate">{p.name}</span>
              <Badge
                variant="secondary"
                className={cn("text-[10px]", statusStyles[p.status] ?? "")}
              >
                {p.status}
              </Badge>
              {p.status === "draft" && (
                <span className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Duplicate"
                    className="rounded p-0.5 hover:bg-muted"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDuplicate(p.id);
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    className="rounded p-0.5 hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTarget(p.id);
                    }}
                    disabled={isDeleting === p.id}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onNew}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        New Proposal
      </Button>
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete
              {targetProposal ? ` "${targetProposal.name}"` : " this proposal"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
