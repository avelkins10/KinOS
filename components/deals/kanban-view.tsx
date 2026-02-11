"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  STAGE_LABELS,
  KANBAN_STAGES,
  STAGE_DOT_COLORS,
  type DealStage,
} from "@/lib/constants/pipeline";
import type { DealForUI } from "@/lib/deals-mappers";
import { DealCard } from "./deal-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function DraggableDealCard({ deal }: { deal: DealForUI }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { stage: deal.stage },
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(isDragging && "opacity-50")}
    >
      <DealCard deal={deal} />
    </div>
  );
}

function DroppableColumn({
  stage,
  children,
  className,
}: {
  stage: DealStage;
  children: React.ReactNode;
  className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "ring-2 ring-primary/30 rounded-xl")}
    >
      {children}
    </div>
  );
}

export function KanbanView({ deals }: { deals: DealForUI[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticDeals, setOptimisticDeals] = useState<DealForUI[]>(deals);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over?.id) return;
      const dealId = active.id as string;
      const toStage = over.id as string;
      if (!dealId || !toStage) return;
      const deal = optimisticDeals.find((d) => d.id === dealId);
      if (!deal || deal.stage === toStage) return;

      setOptimisticDeals((prev) =>
        prev.map((d) =>
          d.id === dealId ? { ...d, stage: toStage as DealStage } : d,
        ),
      );

      const res = await fetch("/api/deals/transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, toStage }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOptimisticDeals((prev) =>
          prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d)),
        );
        toast.error(json.error ?? "Transition failed");
        return;
      }
      toast.success(`Moved to ${STAGE_LABELS[toStage as DealStage]}`);
    },
    [optimisticDeals],
  );

  const activeDeal = activeId
    ? optimisticDeals.find((d) => d.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_STAGES.map((stage) => {
          const stageDeals = optimisticDeals.filter((d) => d.stage === stage);
          const totalValue = stageDeals.reduce((s, d) => s + d.dealValue, 0);

          return (
            <DroppableColumn
              key={stage}
              stage={stage}
              className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-muted/30"
            >
              <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    STAGE_DOT_COLORS[stage],
                  )}
                />
                <span className="text-xs font-semibold text-foreground">
                  {STAGE_LABELS[stage]}
                </span>
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">
                  {stageDeals.length}
                </span>
              </div>
              {totalValue > 0 && (
                <div className="border-b border-border/50 px-4 py-1.5">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    ${(totalValue / 1000).toFixed(0)}k total
                  </span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-2">
                  {stageDeals.length === 0 ? (
                    <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-border/50">
                      <p className="text-xs text-muted-foreground/50">
                        No deals
                      </p>
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <DraggableDealCard key={deal.id} deal={deal} />
                    ))
                  )}
                </div>
              </div>
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="opacity-90 shadow-lg">
            <DealCard deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
