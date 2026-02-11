"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Handshake,
  Users,
  CalendarDays,
  PenTool,
  BarChart3,
  Building2,
  CreditCard,
  DollarSign,
  Cpu,
  ShieldCheck,
  Plug,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mainNav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Deals", href: "/deals", icon: Handshake },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Design Requests", href: "/design-requests", icon: PenTool },
  { label: "Reports", href: "/reports", icon: BarChart3 },
]

const adminNav = [
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Offices", href: "/admin/offices", icon: Building2 },
  { label: "Lenders", href: "/admin/lenders", icon: CreditCard },
  { label: "Pricing", href: "/admin/pricing", icon: DollarSign },
  { label: "Equipment", href: "/admin/equipment", icon: Cpu },
  { label: "Gates", href: "/admin/gates", icon: ShieldCheck },
  { label: "Integrations", href: "/admin/integrations", icon: Plug },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <span className="text-sm font-bold text-sidebar-primary-foreground">K</span>
        </div>
        {!collapsed && (
          <div className="animate-slide-in">
            <span className="text-lg font-semibold tracking-tight text-sidebar-accent-foreground">
              KinOS
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
            <kbd className="ml-auto rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-[10px] text-sidebar-foreground/40">
              {"⌘K"}
            </kbd>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pt-4 pb-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-inset ring-sidebar-primary/20"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                  )}
                />
                {!collapsed && (
                  <span className="animate-slide-in">{item.label}</span>
                )}
                {active && !collapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary animate-pulse-glow" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Admin Section */}
        <div className="mt-6">
          {!collapsed ? (
            <button
              type="button"
              onClick={() => setAdminOpen(!adminOpen)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground/60"
            >
              <span>Admin</span>
              <ChevronDown
                className={cn(
                  "ml-auto h-3 w-3 transition-transform duration-200",
                  adminOpen && "rotate-180"
                )}
              />
            </button>
          ) : (
            <div className="mx-auto mb-2 h-px w-8 bg-sidebar-border" />
          )}

          {(adminOpen || collapsed) && (
            <div className="mt-1 space-y-1">
              {adminNav.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-sidebar-primary/15 text-sidebar-primary ring-1 ring-inset ring-sidebar-primary/20"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                      )}
                    />
                    {!collapsed && (
                      <span className="animate-slide-in">{item.label}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-3">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            AE
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 animate-slide-in">
              <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                Austin E.
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">Closer</p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              className="rounded-md p-1 text-sidebar-foreground/40 transition-colors hover:text-sidebar-foreground"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="mt-2 flex w-full items-center justify-center rounded-lg py-1.5 text-sidebar-foreground/30 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground/60"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}
