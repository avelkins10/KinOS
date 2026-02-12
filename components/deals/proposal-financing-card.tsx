"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LenderWithProducts } from "@/lib/actions/pricing-data";

export function ProposalFinancingCard({
  lenders,
  selectedLenderId,
  selectedProductId,
  dealerFeePercent,
  monthlyPayment,
  onLenderChange,
  onProductChange,
  stateCode,
  disabled,
}: {
  lenders: LenderWithProducts[];
  selectedLenderId: string | null;
  selectedProductId: string | null;
  dealerFeePercent: number | null;
  monthlyPayment: number | null;
  onLenderChange: (lenderId: string | null) => void;
  onProductChange: (productId: string | null) => void;
  stateCode?: string;
  disabled?: boolean;
}) {
  const selectedLender = lenders.find((l) => l.lender.id === selectedLenderId);
  const products = selectedLender?.products ?? [];
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <Card>
      <CardHeader>
        <h4 className="text-sm font-semibold">Financing</h4>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Lender</Label>
          <Select
            value={selectedLenderId ?? ""}
            onValueChange={(v) => {
              onLenderChange(v || null);
              onProductChange(null);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select lender" />
            </SelectTrigger>
            <SelectContent>
              {lenders.map((l) => (
                <SelectItem key={l.lender.id} value={l.lender.id}>
                  {l.lender.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedLender && products.length > 0 && (
          <div className="space-y-2">
            <Label>Product</Label>
            <Select
              value={selectedProductId ?? ""}
              onValueChange={(v) => onProductChange(v || null)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedProduct && (
          <>
            {selectedProduct.sales_facing_fee_percent != null && (
              <p className="text-sm text-muted-foreground">
                Dealer fee:{" "}
                <span className="font-medium text-foreground">
                  {(
                    Number(selectedProduct.sales_facing_fee_percent) * 100
                  ).toFixed(2)}
                  %
                </span>
              </p>
            )}
            {monthlyPayment != null && monthlyPayment > 0 && (
              <p className="text-lg font-semibold text-foreground">
                Monthly payment: $
                {monthlyPayment.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
