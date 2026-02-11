"use client";

import React from "react";
import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Handshake,
  Users,
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
  Zap,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { signOut } from "@/lib/actions/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users, badge: "3" },
  { label: "Deals", href: "/deals", icon: Handshake },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

const adminNav: NavItem[] = [
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Offices", href: "/admin/offices", icon: Building2 },
  { label: "Lenders", href: "/admin/lenders", icon: CreditCard },
  { label: "Pricing", href: "/admin/pricing", icon: DollarSign },
  { label: "Equipment", href: "/admin/equipment", icon: Cpu },
  { label: "Gates", href: "/admin/gates", icon: ShieldCheck },
  { label: "Integrations", href: "/admin/integrations", icon: Plug },
];

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: "Administrator",
  regional_manager: "Regional Manager",
  office_manager: "Office Manager",
  closer: "Closer",
  setter: "Setter",
  viewer: "Viewer",
};

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
        active ? "text-white" : "text-slate-400 hover:text-slate-200",
      )}
    >
      {/* Active background glow */}
      {active && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background:
              "linear-gradient(135deg, rgba(14,165,233,0.15) 0%, rgba(14,165,233,0.08) 100%)",
            boxShadow:
              "inset 0 0 0 1px rgba(14,165,233,0.2), 0 0 20px -4px rgba(14,165,233,0.15)",
          }}
        />
      )}
      {/* Active left accent bar */}
      {active && (
        <div
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
          style={{ background: "linear-gradient(180deg, #0ea5e9, #06b6d4)" }}
        />
      )}
      {/* Hover background */}
      {!active && (
        <div className="absolute inset-0 rounded-lg bg-white/[0.03] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      )}
      <Icon
        className={cn(
          "relative h-[18px] w-[18px] shrink-0 transition-colors duration-200",
          active ? "text-sky-400" : "text-slate-500 group-hover:text-slate-300",
        )}
      />
      {!collapsed && <span className="relative">{item.label}</span>}
      {!collapsed && item.badge && (
        <span
          className="relative ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
          style={{
            background: active
              ? "rgba(14,165,233,0.25)"
              : "rgba(148,163,184,0.12)",
            color: active ? "#38bdf8" : "#94a3b8",
          }}
        >
          {item.badge}
        </span>
      )}
    </a>
  );
}

const ADMIN_ROLES = ["admin", "office_manager", "regional_manager"];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [collapsed, setCollapsed] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const showAdmin = user?.role && ADMIN_ROLES.includes(user.role);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]",
      )}
      style={{
        backgroundColor: "#0c111c",
        borderRight: "1px solid rgba(148,163,184,0.08)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center gap-3 px-5"
        style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
            boxShadow: "0 2px 8px rgba(14,165,233,0.3)",
          }}
        >
          <Zap className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold tracking-tight text-white">
              KinOS
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-400/60">
              CRM
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-200"
            style={{
              backgroundColor: "rgba(148,163,184,0.05)",
              border: "1px solid rgba(148,163,184,0.08)",
              color: "rgba(148,163,184,0.4)",
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd
              className="ml-auto rounded px-1.5 py-0.5 font-mono text-[10px]"
              style={{
                backgroundColor: "rgba(148,163,184,0.06)",
                border: "1px solid rgba(148,163,184,0.1)",
                color: "rgba(148,163,184,0.35)",
              }}
            >
              {"⌘K"}
            </kbd>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center pt-4 pb-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-400"
            style={{ backgroundColor: "rgba(148,163,184,0.05)" }}
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav
        className="flex-1 overflow-y-auto px-3 py-3"
        aria-label="Main navigation"
      >
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </div>

        {/* Admin Section - visible only for admin/office_manager/regional_manager */}
        {showAdmin && (
          <div className="mt-8">
            {!collapsed ? (
              <button
                type="button"
                onClick={() => setAdminOpen(!adminOpen)}
                className="flex w-full items-center gap-2 px-3 py-1.5 transition-colors hover:text-slate-400"
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(148,163,184,0.35)",
                }}
              >
                <span>Admin</span>
                <ChevronDown
                  className={cn(
                    "ml-auto h-3 w-3 transition-transform duration-200",
                    adminOpen && "rotate-180",
                  )}
                />
              </button>
            ) : (
              <div
                className="mx-auto mb-2 h-px w-6 rounded-full"
                style={{ backgroundColor: "rgba(148,163,184,0.1)" }}
              />
            )}

            {(adminOpen || collapsed) && (
              <div className="mt-1 space-y-0.5">
                {adminNav.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* User Section */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid rgba(148,163,184,0.08)" }}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5",
            collapsed && "justify-center px-0",
          )}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #1e293b, #334155)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-200">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {user?.role ? (ROLE_DISPLAY_NAMES[user.role] ?? user.role) : ""}
              </p>
            </div>
          )}
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-slate-600 transition-colors hover:text-slate-400"
                  aria-label="User menu"
                >
                  <Settings className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => startTransition(() => signOut())}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isPending ? "Signing out..." : "Sign Out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="mt-1 flex w-full items-center justify-center rounded-lg py-1.5 text-slate-700 transition-colors hover:text-slate-500"
          style={{ backgroundColor: "transparent" }}
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
  );
}
