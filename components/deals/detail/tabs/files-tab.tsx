"use client"

import type { Deal } from "@/lib/mock-data"
import { FileText, ImageIcon, FileSpreadsheet, Upload, Download, Eye, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileItem {
  id: string
  name: string
  type: "pdf" | "image" | "spreadsheet" | "doc"
  size: string
  uploadedBy: string
  uploadedAt: string
  category: string
}

const MOCK_FILES: FileItem[] = [
  { id: "f1", name: "Utility_Bill_Jan2026.pdf", type: "pdf", size: "1.2 MB", uploadedBy: "Austin E.", uploadedAt: "Feb 5, 2026", category: "Utility" },
  { id: "f2", name: "Roof_Photo_Front.jpg", type: "image", size: "3.4 MB", uploadedBy: "Mike T.", uploadedAt: "Feb 3, 2026", category: "Site Photos" },
  { id: "f3", name: "Roof_Photo_Rear.jpg", type: "image", size: "2.8 MB", uploadedBy: "Mike T.", uploadedAt: "Feb 3, 2026", category: "Site Photos" },
  { id: "f4", name: "Main_Panel_Photo.jpg", type: "image", size: "2.1 MB", uploadedBy: "Mike T.", uploadedAt: "Feb 3, 2026", category: "Site Photos" },
  { id: "f5", name: "Credit_Application.pdf", type: "pdf", size: "245 KB", uploadedBy: "System", uploadedAt: "Feb 1, 2026", category: "Financing" },
  { id: "f6", name: "Proposal_v2.pdf", type: "pdf", size: "890 KB", uploadedBy: "Austin E.", uploadedAt: "Jan 28, 2026", category: "Proposals" },
]

const typeIcons = {
  pdf: FileText,
  image: ImageIcon,
  spreadsheet: FileSpreadsheet,
  doc: FileText,
}

const typeColors = {
  pdf: "text-destructive bg-destructive/10",
  image: "text-chart-2 bg-chart-2/10",
  spreadsheet: "text-success bg-success/10",
  doc: "text-primary bg-primary/10",
}

export function FilesTab({ deal }: { deal: Deal }) {
  const categories = [...new Set(MOCK_FILES.map((f) => f.category))]

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Files</h3>
          <p className="text-xs text-muted-foreground">{MOCK_FILES.length} files uploaded</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload File
        </button>
      </div>

      {/* Drop zone */}
      <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 transition-colors hover:border-primary/50 hover:bg-muted/50">
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Drag and drop files here
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            PDF, JPG, PNG, XLSX up to 25MB
          </p>
        </div>
      </div>

      {/* File List grouped by category */}
      {categories.map((cat) => (
        <div key={cat}>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {cat}
          </h4>
          <div className="space-y-2">
            {MOCK_FILES.filter((f) => f.category === cat).map((file) => {
              const Icon = typeIcons[file.type]
              return (
                <div
                  key={file.id}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      typeColors[file.type]
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {file.size} &middot; {file.uploadedBy} &middot; {file.uploadedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Preview file"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="More options"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
