"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function ProposalPricingCard({
  basePpw,
  minPpw,
  maxPpw,
  systemSizeKw,
  baseCost,
  goalSeekTarget,
  useGoalSeek,
  onBasePpwChange,
  onGoalSeekChange,
  onUseGoalSeekChange,
  disabled,
}: {
  basePpw: number;
  minPpw: number;
  maxPpw: number;
  systemSizeKw: number | null;
  baseCost: number;
  goalSeekTarget: string;
  useGoalSeek: boolean;
  onBasePpwChange: (v: number) => void;
  onGoalSeekChange: (v: string) => void;
  onUseGoalSeekChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const systemWatts = (systemSizeKw ?? 0) * 1000;
  const outOfBounds = basePpw < minPpw || basePpw > maxPpw;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Pricing</h4>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="goal-seek-toggle"
              className="text-xs text-muted-foreground"
            >
              Goal seek
            </Label>
            <Switch
              id="goal-seek-toggle"
              checked={useGoalSeek}
              onCheckedChange={onUseGoalSeekChange}
              disabled={disabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {useGoalSeek ? (
          <div className="space-y-2">
            <Label htmlFor="goal-seek-input">Target gross cost ($)</Label>
            <Input
              id="goal-seek-input"
              type="number"
              placeholder="45000"
              value={goalSeekTarget}
              onChange={(e) => onGoalSeekChange(e.target.value)}
              disabled={disabled}
              className={cn(
                "max-w-[180px]",
                outOfBounds && "border-destructive",
              )}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="base-ppw">Base $/W</Label>
            <Input
              id="base-ppw"
              type="number"
              step="0.01"
              min={minPpw}
              max={maxPpw}
              value={basePpw}
              onChange={(e) => onBasePpwChange(Number(e.target.value) || 0)}
              disabled={disabled}
              className={cn(
                "max-w-[120px]",
                outOfBounds && "border-destructive",
              )}
            />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              Range: ${minPpw.toFixed(2)} – ${maxPpw.toFixed(2)}/W
            </span>
          </div>
          <Slider
            value={[Math.min(maxPpw, Math.max(minPpw, basePpw))]}
            min={minPpw}
            max={maxPpw}
            step={0.05}
            onValueChange={([v]) => onBasePpwChange(v)}
            disabled={disabled || useGoalSeek}
            className="w-full"
          />
        </div>
        {systemWatts > 0 && (
          <p className="text-sm text-muted-foreground">
            Base cost:{" "}
            <span className="font-medium text-foreground">
              ${baseCost.toLocaleString()}
            </span>{" "}
            ({systemSizeKw?.toFixed(2)} kW × ${basePpw.toFixed(2)}/W)
          </p>
        )}
        {outOfBounds && (
          <p className="text-xs text-destructive">
            Base $/W is outside allowed range.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
