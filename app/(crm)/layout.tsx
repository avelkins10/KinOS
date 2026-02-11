import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"

export default function CRMLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
