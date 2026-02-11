import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";

export default async function CRMLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return (
    <div className="flex h-screen bg-background">
      <AuthProvider initialUser={user}>
        <AppSidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </AuthProvider>
    </div>
  );
}
