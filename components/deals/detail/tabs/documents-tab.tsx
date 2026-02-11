"use client"

import type { Deal } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { FileText, Send, Download, Eye } from "lucide-react"

interface Doc {
  id: string
  name: string
  recipient: string
  status: "sent" | "viewed" | "signed"
  sentAt: string
  viewedAt?: string
  signedAt?: string
}

function getMockDocs(deal: Deal): Doc[] {
  if (deal.stage !== "contract_signed" && deal.stage !== "submitted") return []
  return [
    { id: "doc1", name: "Solar Installation Agreement", recipient: deal.customerName, status: "signed", sentAt: "Feb 2, 2026", viewedAt: "Feb 2, 2026", signedAt: "Feb 3, 2026" },
    { id: "doc2", name: "Right to Cancel", recipient: deal.customerName, status: "signed", sentAt: "Feb 2, 2026", viewedAt: "Feb 2, 2026", signedAt: "Feb 3, 2026" },
    { id: "doc3", name: "Interconnection Authorization", recipient: deal.customerName, status: "viewed", sentAt: "Feb 4, 2026", viewedAt: "Feb 4, 2026" },
  ]
}

const statusDots = {
  sent: "bg-muted-foreground",
  viewed: "bg-primary",
  signed: "bg-success",
}

export function DocumentsTab({ deal }: { deal: Deal }) {
  const docs = getMockDocs(deal)

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <FileText className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">No documents yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Documents will appear after contracts are sent for signature.
        </p>
        <button
          type="button"
          className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Send className="h-4 w-4" />
          Send Contract Packet
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{docs.length} documents</p>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Send className="h-3.5 w-3.5" />
          Send Contract Packet
        </button>
      </div>
      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-muted/30">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{doc.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">To: {doc.recipient}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Status dots */}
              <div className="flex items-center gap-1.5">
                {(["sent", "viewed", "signed"] as const).map((s) => {
                  const isReached = ["sent", "viewed", "signed"].indexOf(doc.status) >= ["sent", "viewed", "signed"].indexOf(s)
                  return (
                    <div key={s} className="flex flex-col items-center gap-0.5">
                      <div className={cn("h-2 w-2 rounded-full", isReached ? statusDots[s] : "bg-border")} />
                      <span className="text-[8px] text-muted-foreground/50 capitalize">{s}</span>
                    </div>
                  )
                })}
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
        ))}
      </div>
    </div>
  )
}
