"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Home, Building2, Palette } from "lucide-react";

const ROOF_MATERIALS = [
  "Asphalt Shingles",
  "Metal Standing Seam",
  "Metal Corrugated",
  "Tile",
  "Flat / Membrane",
  "Other",
] as const;

type DesignRequestType = "design_team" | "auto_designer" | "sales_mode";

export interface DesignRequestFormProps {
  dealId: string;
  designStatus?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DesignRequestForm({
  dealId,
  designStatus,
  onSuccess,
  onCancel,
  open,
  onOpenChange,
}: DesignRequestFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] =
    useState<DesignRequestType>("design_team");
  const [targetOffset, setTargetOffset] = useState("105");
  const [mountingType, setMountingType] = useState<"roof" | "ground">("roof");
  const [roofMaterial, setRoofMaterial] = useState<string>("");
  const [preferredModule, setPreferredModule] = useState("");
  const [preferredInverter, setPreferredInverter] = useState("");
  const [notes, setNotes] = useState("");

  const alreadyRequested =
    designStatus === "design_requested" ||
    designStatus === "design_in_progress" ||
    designStatus === "design_completed" ||
    designStatus === "design_accepted";
  const isSalesMode = requestType === "sales_mode";
  const canSubmit = !alreadyRequested && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/aurora`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_design_request",
          design_request_type: requestType,
          target_offset: isSalesMode
            ? undefined
            : parseInt(targetOffset, 10) || 105,
          mounting_type: isSalesMode ? undefined : mountingType,
          roof_material: isSalesMode ? undefined : roofMaterial || undefined,
          preferred_module_id: isSalesMode
            ? undefined
            : preferredModule.trim() || undefined,
          preferred_inverter_id: isSalesMode
            ? undefined
            : preferredInverter.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit design request");
      }
      if (data.sales_mode_url) {
        window.open(data.sales_mode_url, "_blank", "noopener,noreferrer");
        toast({
          title: "Sales Mode opened",
          description: "Aurora Sales Mode opened in a new tab.",
        });
      } else {
        toast({
          title: "Design requested",
          description: "Aurora will process your design request.",
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Request design</DialogTitle>
          <DialogDescription>
            Choose how you want the system design: Design Team (full custom),
            AutoDesigner (automated), or Sales Mode (build in Aurora).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Design request type</Label>
            <RadioGroup
              value={requestType}
              onValueChange={(v) => setRequestType(v as DesignRequestType)}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <label
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
                )}
              >
                <RadioGroupItem value="design_team" />
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Design Team</span>
              </label>
              <label
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
                )}
              >
                <RadioGroupItem value="auto_designer" />
                <Palette className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">AutoDesigner</span>
              </label>
              <label
                className={cn(
                  "flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-input bg-background px-4 py-3 transition-colors hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5",
                )}
              >
                <RadioGroupItem value="sales_mode" />
                <Home className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Sales Mode</span>
              </label>
            </RadioGroup>
            {requestType === "sales_mode" && (
              <p className="text-xs text-muted-foreground">
                Sales Mode opens Aurora so you can build the design yourself. No
                other options needed.
              </p>
            )}
          </div>

          {!isSalesMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="target-offset">Target offset (%)</Label>
                <Input
                  id="target-offset"
                  type="number"
                  min={80}
                  max={150}
                  value={targetOffset}
                  onChange={(e) => setTargetOffset(e.target.value)}
                  aria-label="Target offset percentage"
                />
                <p className="text-xs text-muted-foreground">
                  Default 105% — design will aim to offset 105% of annual usage.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mounting type</Label>
                <div className="flex gap-3">
                  <label
                    className={cn(
                      "flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50",
                      mountingType === "roof"
                        ? "border-primary bg-primary/5"
                        : "border-input bg-background",
                    )}
                  >
                    <input
                      type="radio"
                      name="mounting"
                      checked={mountingType === "roof"}
                      onChange={() => setMountingType("roof")}
                      className="sr-only"
                    />
                    <Home className="h-5 w-5" />
                    <span className="text-sm font-medium">Roof</span>
                  </label>
                  <label
                    className={cn(
                      "flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50",
                      mountingType === "ground"
                        ? "border-primary bg-primary/5"
                        : "border-input bg-background",
                    )}
                  >
                    <input
                      type="radio"
                      name="mounting"
                      checked={mountingType === "ground"}
                      onChange={() => setMountingType("ground")}
                      className="sr-only"
                    />
                    <Building2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Ground</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roof-material">Roof material</Label>
                <Select value={roofMaterial} onValueChange={setRoofMaterial}>
                  <SelectTrigger id="roof-material">
                    <SelectValue placeholder="Select roof material" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOF_MATERIALS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preferred-module">
                    Preferred module (optional)
                  </Label>
                  <Input
                    id="preferred-module"
                    value={preferredModule}
                    onChange={(e) => setPreferredModule(e.target.value)}
                    placeholder="e.g. module ID or name"
                    aria-label="Preferred module"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred-inverter">
                    Preferred inverter (optional)
                  </Label>
                  <Input
                    id="preferred-inverter"
                    value={preferredInverter}
                    onChange={(e) => setPreferredInverter(e.target.value)}
                    placeholder="e.g. inverter ID or name"
                    aria-label="Preferred inverter"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="design-notes">Notes for designer</Label>
            <Textarea
              id="design-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
              className="resize-none"
              aria-label="Notes for designer"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? "Submitting…" : "Submit design request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
