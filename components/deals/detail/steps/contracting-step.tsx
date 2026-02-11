"use client"

import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { FileText, Send, Eye, Download, Check } from "lucide-react"

interface DocItem {
  id: string
  name: string
  recipient: string
  status: "pending" | "sent" | "viewed" | "signed"
  sentAt?: string
}

function getMockDocs(deal: Deal): DocItem[] {
  const isSigned = deal.stage === "contract_signed" || deal.stage === "submitted"
  if (!isSigned && deal.stage !== "financing_approved") return []

  if (isSigned) {
    return [
      { id: "doc1", name: "Solar Installation Agreement", recipient: deal.customerName, status: "signed", sentAt: "Feb 2, 2026" },
      { id: "doc2", name: "Right to Cancel", recipient: deal.customerName, status: "signed", sentAt: "Feb 2, 2026" },
      { id: "doc3", name: "Interconnection Authorization", recipient: deal.customerName, status: "viewed", sentAt: "Feb 4, 2026" },
      { id: "doc4", name: "Credit Authorization", recipient: deal.customerName, status: "signed", sentAt: "Feb 2, 2026" },
    ]
  }

  return [
    { id: "doc1", name: "Solar Installation Agreement", recipient: deal.customerName, status: "pending" },
    { id: "doc2", name: "Right to Cancel", recipient: deal.customerName, status: "pending" },
    { id: "doc3", name: "Interconnection Authorization", recipient: deal.customerName, status: "pending" },
  ]
}

const statusConfig = {
  pending: { dot: "bg-muted-foreground/30", label: "Pending", textClass: "text-muted-foreground" },
  sent: { dot: "bg-primary", label: "Sent", textClass: "text-primary" },
  viewed: { dot: "bg-warning", label: "Viewed", textClass: "text-warning" },
  signed: { dot: "bg-success", label: "Signed", textClass: "text-success" },
}

export function ContractingStep({ deal }: { deal: Deal }) {
  const docs = getMockDocs(deal)

  if (docs.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Contracting</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and send contracts for signature.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No contracts yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Complete financing approval before generating contracts.
          </p>
        </div>
      </div>
    )
  }

  const signedCount = docs.filter((d) => d.status === "signed").length
  const allSigned = signedCount === docs.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Contracting</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {signedCount} of {docs.length} documents signed.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          style={{ boxShadow: "0 1px 3px rgba(14,165,233,0.3)" }}
        >
          <Send className="h-3.5 w-3.5" />
          Send Contract Packet
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all duration-500", allSigned ? "bg-success" : "bg-primary")}
            style={{ width: `${(signedCount / docs.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">
          {Math.round((signedCount / docs.length) * 100)}%
        </span>
      </div>

      {/* Documents */}
      <div className="space-y-2">
        {docs.map((doc) => {
          const cfg = statusConfig[doc.status]
          return (
            <div key={doc.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/30">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                doc.status === "signed" ? "bg-success/10" : "bg-muted"
              )}>
                {doc.status === "signed" ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <FileText className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{doc.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  To: {doc.recipient}
                  {doc.sentAt && ` · Sent ${doc.sentAt}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                  <span className={cn("text-xs font-semibold", cfg.textClass)}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
