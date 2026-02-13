"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DealForUI } from "@/lib/deals-mappers";
import type { DealDetail } from "@/lib/actions/deals";
import { cn } from "@/lib/utils";
import {
  Check,
  Shield,
  Upload,
  CheckSquare,
  MessageSquare,
  ExternalLink,
  ClipboardCheck,
  Loader2,
} from "lucide-react";
import {
  evaluateGates,
  getGateStatus,
  completeGate,
  uncompleteGate,
  type GateWithStatus,
} from "@/lib/actions/gates";
import { transitionDealStage } from "@/lib/actions/deals";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// ── Gate type icon + label mapping ──────────────────────────────

const GATE_TYPE_CONFIG: Record<
  string,
  {
    icon: typeof Check;
    bg: string;
    label: string;
  }
> = {
  document_signed: {
    icon: Shield,
    bg: "bg-primary/10 text-primary",
    label: "Auto",
  },
  file_uploaded: {
    icon: Upload,
    bg: "bg-chart-4/10 text-chart-4",
    label: "Upload",
  },
  financing_status: {
    icon: Shield,
    bg: "bg-primary/10 text-primary",
    label: "Auto",
  },
  checkbox: {
    icon: CheckSquare,
    bg: "bg-accent/10 text-accent",
    label: "Manual",
  },
  question: {
    icon: MessageSquare,
    bg: "bg-chart-3/10 text-chart-3",
    label: "Question",
  },
  external_status: {
    icon: ExternalLink,
    bg: "bg-accent/10 text-accent",
    label: "External",
  },
};

const AUTO_TYPES = ["document_signed", "file_uploaded", "financing_status"];

// ── Gate Item Renderer ──────────────────────────────────────────

function GateItem({
  gate,
  dealId,
  onUpdate,
}: {
  gate: GateWithStatus;
  dealId: string;
  onUpdate: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [textValue, setTextValue] = useState(gate.value ?? "");
  const config = GATE_TYPE_CONFIG[gate.gate_type] ?? GATE_TYPE_CONFIG.checkbox;
  const Icon = config.icon;
  const isAuto = AUTO_TYPES.includes(gate.gate_type);
  const conditions = (gate.conditions ?? {}) as Record<string, unknown>;

  const handleCheckboxToggle = async () => {
    setSaving(true);
    if (gate.isComplete) {
      await uncompleteGate(dealId, gate.id);
    } else {
      await completeGate(dealId, gate.id);
    }
    onUpdate();
    setSaving(false);
  };

  const handleSelectChange = async (value: string) => {
    setSaving(true);
    await completeGate(dealId, gate.id, value);
    onUpdate();
    setSaving(false);
  };

  const handleBooleanToggle = async (checked: boolean) => {
    setSaving(true);
    if (checked) {
      await completeGate(dealId, gate.id, "Yes");
    } else {
      await uncompleteGate(dealId, gate.id);
    }
    onUpdate();
    setSaving(false);
  };

  const handleTextBlur = async () => {
    if (textValue === (gate.value ?? "")) return;
    setSaving(true);
    if (textValue.trim()) {
      await completeGate(dealId, gate.id, textValue.trim());
    } else {
      await uncompleteGate(dealId, gate.id);
    }
    onUpdate();
    setSaving(false);
  };

  // Render the interaction control based on gate type
  const renderControl = () => {
    if (isAuto) return null; // Auto gates are read-only

    if (gate.gate_type === "checkbox" || gate.gate_type === "external_status") {
      return (
        <button
          type="button"
          disabled={saving}
          onClick={handleCheckboxToggle}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all",
            gate.isComplete
              ? "border-success bg-success"
              : "border-border hover:border-primary",
          )}
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : gate.isComplete ? (
            <Check
              className="h-3 w-3 text-success-foreground"
              strokeWidth={3}
            />
          ) : null}
        </button>
      );
    }

    if (gate.gate_type === "question") {
      const answerType = conditions.answer_type as string;

      if (answerType === "select") {
        const options = (conditions.options as string[]) ?? [];
        return (
          <Select
            value={gate.value ?? ""}
            onValueChange={handleSelectChange}
            disabled={saving}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      if (answerType === "boolean") {
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {gate.isComplete ? "Yes" : "No"}
            </span>
            <Switch
              checked={gate.isComplete}
              onCheckedChange={handleBooleanToggle}
              disabled={saving}
            />
          </div>
        );
      }

      // text type
      return (
        <Input
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={handleTextBlur}
          placeholder="Enter answer..."
          className="h-8 w-[200px] text-xs"
          disabled={saving}
        />
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4 transition-all",
        gate.isComplete
          ? "border-success/20 bg-success/5"
          : "border-border bg-card",
      )}
    >
      {/* Status icon */}
      {gate.isComplete ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success">
          <Check
            className="h-3.5 w-3.5 text-success-foreground"
            strokeWidth={3}
          />
        </div>
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-border">
          <Icon className="h-3 w-3 text-muted-foreground/40" />
        </div>
      )}

      {/* Label + detail */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            gate.isComplete ? "text-success" : "text-foreground",
          )}
        >
          {gate.name}
        </p>
        {gate.value && gate.gate_type === "question" && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {gate.value}
          </p>
        )}
        {gate.isComplete && gate.completion?.completed_at && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {new Date(gate.completion.completed_at).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Control or type badge */}
      <div className="flex items-center gap-2">
        {renderControl()}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase",
            config.bg,
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────

export function PreIntakeStep({
  deal,
  dealDetail,
  onDealUpdated,
}: {
  deal: DealForUI;
  dealDetail?: DealDetail | null;
  onDealUpdated?: () => void;
}) {
  const [gates, setGates] = useState<GateWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const autoAdvancedRef = useRef(false);

  const loadGates = useCallback(async () => {
    // Skip full evaluation for deals that already advanced past gates
    const skipEval = [
      "submission_ready",
      "submitted",
      "intake_approved",
      "intake_rejected",
    ].includes(deal.stage);

    const { data, error } = skipEval
      ? await getGateStatus(deal.id)
      : await evaluateGates(deal.id);

    if (error) {
      setLoadError(error);
    }
    setGates(data);
    setLoading(false);
  }, [deal.id, deal.stage]);

  useEffect(() => {
    loadGates();
  }, [loadGates]);

  // Auto-advance: when all required gates pass and deal is at contract_signed
  useEffect(() => {
    if (loading || gates.length === 0 || autoAdvancedRef.current) return;
    const requiredGates = gates.filter((g) => g.is_required);
    const allRequiredPassed = requiredGates.every((g) => g.isComplete);

    if (deal.stage === "contract_signed" && allRequiredPassed) {
      autoAdvancedRef.current = true;
      transitionDealStage(deal.id, "submission_ready").then(() => {
        onDealUpdated?.();
      });
    }
  }, [gates, loading, deal.stage, deal.id, onDealUpdated]);

  const passedCount = gates.filter((g) => g.isComplete).length;
  const allPassed = gates.length > 0 && passedCount === gates.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading gates...
        </span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Failed to load gates: {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Pre-Intake Checklist
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All required documents and gates before project submission.
          </p>
        </div>
        {allPassed && (
          <div className="flex items-center gap-2 rounded-full bg-success/10 border border-success/20 px-3 py-1.5">
            <Check className="h-3.5 w-3.5 text-success" />
            <span className="text-xs font-bold text-success">
              All Gates Passed
            </span>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-foreground">
              Gate Progress
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              {passedCount}/{gates.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                allPassed ? "bg-success" : "bg-primary",
              )}
              style={{
                width: `${gates.length > 0 ? (passedCount / gates.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Gates */}
      <div className="space-y-2">
        {gates.map((gate) => (
          <GateItem
            key={gate.id}
            gate={gate}
            dealId={deal.id}
            onUpdate={loadGates}
          />
        ))}
      </div>
    </div>
  );
}
