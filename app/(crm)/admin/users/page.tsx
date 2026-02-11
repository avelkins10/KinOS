"use client"

import { useState } from "react"
import { REPS } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import {
  Search,
  Plus,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  Filter,
} from "lucide-react"

const roleLabels: Record<string, string> = {
  closer: "Closer",
  setter: "Setter",
  manager: "Manager",
  admin: "Admin",
}

const roleBadgeColors: Record<string, string> = {
  closer: "bg-primary/15 text-primary border-primary/25",
  setter: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  manager: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  admin: "bg-destructive/15 text-destructive border-destructive/25",
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const filtered = REPS.filter((rep) => {
    const matchesSearch =
      rep.name.toLowerCase().includes(search.toLowerCase()) ||
      rep.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || rep.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Users
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage team members, roles, and access levels.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {["all", "closer", "setter", "manager", "admin"].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-all",
                roleFilter === role
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {role === "all" ? "All" : roleLabels[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Office
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                Deals
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                Revenue
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((rep) => (
              <tr
                key={rep.id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                      {rep.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {rep.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rep.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      roleBadgeColors[rep.role]
                    )}
                  >
                    {rep.role === "admin" ? (
                      <ShieldCheck className="h-3 w-3" />
                    ) : rep.role === "manager" ? (
                      <Shield className="h-3 w-3" />
                    ) : (
                      <User className="h-3 w-3" />
                    )}
                    {roleLabels[rep.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {rep.office}
                </td>
                <td className="hidden px-4 py-3 text-sm font-medium text-foreground lg:table-cell">
                  {rep.dealsThisMonth}
                </td>
                <td className="hidden px-4 py-3 text-sm font-medium text-foreground lg:table-cell">
                  {rep.revenue > 0
                    ? `$${(rep.revenue / 1000).toFixed(1)}k`
                    : "--"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Actions for ${rep.name}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">No users found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
