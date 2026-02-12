"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AdderItem {
  id?: string;
  name: string;
  amount: number;
  total: number;
  quantity: number;
  pricingType: string;
  isAutoApplied?: boolean;
  tiers?: Array<{ label: string; amount?: number; ppw?: number }>;
  selectedTier?: string;
  customAmount?: number;
  enabled?: boolean;
}

export function ProposalAddersCard({
  autoApplied,
  manualAdders,
  onToggle,
  onTierChange,
  onCustomAmountChange,
  runningTotal,
  disabled,
}: {
  autoApplied: AdderItem[];
  manualAdders: AdderItem[];
  onToggle: (name: string, enabled: boolean) => void;
  onTierChange: (name: string, tier: string) => void;
  onCustomAmountChange: (name: string, value: number) => void;
  runningTotal: number;
  disabled?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <h4 className="text-sm font-semibold">Adders</h4>
      </CardHeader>
      <CardContent className="space-y-4">
        {autoApplied.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Auto-applied (system)
            </p>
            <ul className="space-y-2">
              {autoApplied.map((a) => (
                <li
                  key={a.name}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    {a.name}
                  </span>
                  <span className="text-sm font-medium">
                    ${a.total.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {manualAdders.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Optional (value adders)
            </p>
            <ul className="space-y-2">
              {manualAdders.map((a) => (
                <li
                  key={a.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
                >
                  <div className="flex min-h-[44px] items-center gap-2">
                    <Checkbox
                      id={`adder-${a.name}`}
                      checked={a.enabled ?? false}
                      onCheckedChange={(c) => onToggle(a.name, !!c)}
                      disabled={disabled}
                    />
                    <Label htmlFor={`adder-${a.name}`} className="text-sm">
                      {a.name}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.tiers && a.tiers.length > 0 ? (
                      <Select
                        value={a.selectedTier ?? a.tiers[0]?.label}
                        onValueChange={(v) => onTierChange(a.name, v)}
                        disabled={disabled || !a.enabled}
                      >
                        <SelectTrigger className="h-9 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {a.tiers.map((t) => (
                            <SelectItem key={t.label} value={t.label}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : a.pricingType === "custom" ? (
                      <Input
                        type="number"
                        className="w-24"
                        placeholder="Amount"
                        value={a.customAmount ?? ""}
                        onChange={(e) =>
                          onCustomAmountChange(
                            a.name,
                            Number(e.target.value) || 0,
                          )
                        }
                        disabled={disabled || !a.enabled}
                      />
                    ) : null}
                    <span className="min-w-[80px] text-right text-sm font-medium">
                      ${(a.enabled ? a.total : 0).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="border-t border-border pt-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>Adders total</span>
            <span>${runningTotal.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
