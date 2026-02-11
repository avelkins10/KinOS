"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Bookmark,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ContactWithMeta } from "@/lib/actions/contacts";
import type { LeadStatus } from "@/lib/utils/lead-status";
import { getAppointmentColor } from "@/lib/utils/lead-status";
import { CreateLeadDialog } from "./create-lead-dialog";
import { ImportLeadsDialog } from "./import-leads-dialog";

const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  "New Lead": "bg-slate-100 text-slate-800 border-slate-200",
  "Active Lead": "bg-blue-100 text-blue-800 border-blue-200",
  Customer: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Lost: "bg-red-100 text-red-800 border-red-200",
  "On Hold": "bg-amber-100 text-amber-800 border-amber-200",
};

const LEAD_SOURCES = ["RepCard", "Manual", "Web Form", "Referral", "Other"];

const LEAD_STATUSES: LeadStatus[] = [
  "New Lead",
  "Active Lead",
  "Customer",
  "Lost",
  "On Hold",
];

interface LeadsPageClientProps {
  initialData: ContactWithMeta[];
  initialTotal: number;
  officeOptions: { id: string; name: string }[];
  ownerOptions: { id: string; name: string }[];
  setterOptions: { id: string; name: string }[];
  initialFilters: {
    search?: string;
    officeId?: string;
    ownerId?: string;
    setterId?: string;
    source?: string;
    status?: LeadStatus;
    dateFrom?: string;
    dateTo?: string;
    hasAppointment?: boolean;
    page: number;
    perPage: number;
    sortBy?: string;
    sortDir?: string;
  };
}

interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  entity_type: string;
  created_at: string | null;
}

export function LeadsPageClient({
  initialData,
  initialTotal,
  officeOptions,
  ownerOptions,
  setterOptions,
  initialFilters,
}: LeadsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(initialFilters.search ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [savePresetName, setSavePresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  useEffect(() => {
    fetch("/api/filter-presets?entityType=leads")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setPresets(data) : []))
      .catch(() => setPresets([]));
  }, []);

  const withAppointments = initialData.filter(
    (c) => c.nextAppointment?.date,
  ).length;

  const applyFilters = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, String(value));
        } else {
          params.delete(key);
        }
      });
      params.set("page", "1");
      router.push(`/leads?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push("/leads");
    setSearchInput("");
  }, [router]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("search", value.trim());
      else params.delete("search");
      params.set("page", "1");
      router.push(`/leads?${params.toString()}`);
    },
    [router, searchParams],
  );

  const activeFilterCount = [
    initialFilters.officeId,
    initialFilters.ownerId,
    initialFilters.setterId,
    initialFilters.source,
    initialFilters.status,
    initialFilters.dateFrom,
    initialFilters.dateTo,
    initialFilters.hasAppointment,
  ].filter(Boolean).length;

  const totalPages = Math.ceil(initialTotal / initialFilters.perPage) || 1;
  const currentPage = Math.min(initialFilters.page, totalPages);

  const sortBy = initialFilters.sortBy ?? "created_at";
  const sortDir = initialFilters.sortDir ?? "desc";
  const toggleSort = (field: string) => {
    const nextDir = sortBy === field && sortDir === "desc" ? "asc" : "desc";
    applyFilters({
      sortBy: field,
      sortDir: nextDir,
    });
  };
  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50",
        sortBy === field && "font-semibold",
      )}
      onClick={() => toggleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortBy === field && (
          <span className="text-muted-foreground">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </TableHead>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border bg-card/80 px-6 py-5 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-header text-foreground">Leads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {initialTotal} leads · {withAppointments} with appointments
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearch(searchInput)
                }
                onBlur={() => handleSearch(searchInput)}
                className="h-9 pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-3.5 w-3.5" />
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-9"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New Lead
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" />
              Import CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9"
              asChild
            >
              <a
                href={`/api/contacts?action=export&${searchParams.toString()}`}
                download
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </a>
            </Button>
          </div>
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mt-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {showFilters ? "Hide filters" : "Show filters"}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Office
                </label>
                <Select
                  value={initialFilters.officeId ?? "all"}
                  onValueChange={(v) =>
                    applyFilters({ office: v === "all" ? undefined : v })
                  }
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All offices</SelectItem>
                    {officeOptions.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Lead Owner
                </label>
                <Select
                  value={initialFilters.ownerId ?? "all"}
                  onValueChange={(v) =>
                    applyFilters({ owner: v === "all" ? undefined : v })
                  }
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {ownerOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Setter
                </label>
                <Select
                  value={initialFilters.setterId ?? "all"}
                  onValueChange={(v) =>
                    applyFilters({ setter: v === "all" ? undefined : v })
                  }
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {setterOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Lead Source
                </label>
                <Select
                  value={initialFilters.source ?? "all"}
                  onValueChange={(v) =>
                    applyFilters({ source: v === "all" ? undefined : v })
                  }
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Lead Status
                </label>
                <Select
                  value={initialFilters.status ?? "all"}
                  onValueChange={(v) =>
                    applyFilters({
                      status: v === "all" ? undefined : (v as LeadStatus),
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Has Appointment
                </label>
                <Select
                  value={
                    initialFilters.hasAppointment === true
                      ? "yes"
                      : initialFilters.hasAppointment === false
                        ? "no"
                        : "all"
                  }
                  onValueChange={(v) =>
                    applyFilters({
                      hasAppointment:
                        v === "all" ? undefined : v === "yes" ? "true" : "no",
                    })
                  }
                >
                  <SelectTrigger className="h-9 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5" />
                Clear all
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="text-xs font-medium text-muted-foreground">
                Presets
              </span>
              <Select
                value=""
                onValueChange={(presetId) => {
                  const preset = presets.find((p) => p.id === presetId);
                  if (!preset?.filters || typeof preset.filters !== "object")
                    return;
                  const params = new URLSearchParams();
                  Object.entries(preset.filters).forEach(([k, v]) => {
                    if (v !== undefined && v !== null && v !== "")
                      params.set(k, String(v));
                  });
                  params.set("page", "1");
                  router.push(`/leads?${params.toString()}`);
                }}
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Load preset…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {presets.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Preset name"
                  value={savePresetName}
                  onChange={(e) => setSavePresetName(e.target.value)}
                  className="h-9 w-[140px] rounded-md border border-input bg-background px-2 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={!savePresetName.trim() || savingPreset}
                  onClick={async () => {
                    if (!savePresetName.trim()) return;
                    setSavingPreset(true);
                    const filters: Record<string, string | number> = {};
                    searchParams.forEach((v, k) => {
                      if (k !== "page") filters[k] = v;
                    });
                    try {
                      const res = await fetch("/api/filter-presets", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: savePresetName.trim(),
                          filters,
                          entityType: "leads",
                        }),
                      });
                      const json = await res.json();
                      if (res.ok && json?.id) {
                        setPresets((prev) => [
                          {
                            id: json.id,
                            name: json.name,
                            filters: json.filters ?? {},
                            entity_type: "leads",
                            created_at: json.created_at ?? null,
                          },
                          ...prev,
                        ]);
                        setSavePresetName("");
                      }
                    } finally {
                      setSavingPreset(false);
                    }
                  }}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
              {presets.length > 0 && (
                <Select
                  value=""
                  onValueChange={async (presetId) => {
                    if (!presetId) return;
                    if (!confirm("Delete this preset?")) return;
                    try {
                      const res = await fetch(
                        `/api/filter-presets/${presetId}`,
                        {
                          method: "DELETE",
                        },
                      );
                      if (res.ok)
                        setPresets((prev) =>
                          prev.filter((p) => p.id !== presetId),
                        );
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder="Delete preset…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {presets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="name" label="Customer Name" />
                <TableHead>Office</TableHead>
                <TableHead>Lead Source</TableHead>
                <TableHead>City / State</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Lead Status</TableHead>
                <SortHeader field="nextAppointment" label="Next Appointment" />
                <SortHeader field="owner" label="Lead Owner" />
                <TableHead>Setter</TableHead>
                <SortHeader field="created_at" label="Date Added" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialData.map((contact) => {
                const name =
                  `${contact.first_name} ${contact.last_name}`.trim();
                const ownerName = contact.owner
                  ? `${contact.owner.first_name} ${contact.owner.last_name}`.trim()
                  : "";
                const setterName = contact.setter
                  ? `${contact.setter.first_name} ${contact.setter.last_name}`.trim()
                  : "";
                const apptColor = getAppointmentColor(
                  contact.nextAppointment?.date,
                );
                return (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/leads/${contact.id}`)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.office?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.contact_source ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[contact.city, contact.state]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {contact.phone ?? "—"}
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate text-muted-foreground">
                      {contact.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          LEAD_STATUS_COLORS[contact.leadStatus],
                        )}
                      >
                        {contact.leadStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.nextAppointment?.date ? (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            apptColor === "green" && "text-emerald-600",
                            apptColor === "yellow" && "text-amber-600",
                            apptColor === "red" && "text-red-600",
                            apptColor === "gray" && "text-muted-foreground",
                          )}
                        >
                          {contact.nextAppointment.time
                            ? new Date(
                                contact.nextAppointment.date,
                              ).toLocaleDateString() +
                              " " +
                              contact.nextAppointment.time
                            : new Date(
                                contact.nextAppointment.date,
                              ).toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ownerName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {setterName || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {contact.created_at
                        ? new Date(contact.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {initialData.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No leads found.
            </div>
          )}
        </div>

        {initialTotal > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select
                value={String(initialFilters.perPage)}
                onValueChange={(v) =>
                  applyFilters({ perPage: parseInt(v, 10) })
                }
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({initialTotal} total)
            </div>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentPage <= 1}
                onClick={() => applyFilters({ page: currentPage - 1 })}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters({ page: currentPage + 1 })}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateLeadDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        ownerOptions={ownerOptions}
      />
      <ImportLeadsDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
