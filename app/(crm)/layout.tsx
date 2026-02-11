import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/actions/auth";
import { getDealCounts } from "@/lib/actions/dashboard";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";

export default async function CRMLayout({ children }: { children: ReactNode }) {
  const [user, counts] = await Promise.all([getCurrentUser(), getDealCounts()]);
  const leadCount =
    counts.newLeadCount > 0 ? String(counts.newLeadCount) : undefined;
  const dealCount =
    counts.activeCount > 0 ? String(counts.activeCount) : undefined;

  return (
    <div className="flex h-screen bg-background">
      <AuthProvider initialUser={user}>
        <AppSidebar leadCount={leadCount} dealCount={dealCount} />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </AuthProvider>
    </div>
  );
}
