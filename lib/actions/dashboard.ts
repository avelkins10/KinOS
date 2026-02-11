"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/actions/auth";

export interface DashboardFilters {
  officeId?: string;
  closerId?: string;
}

export interface DashboardStats {
  dealsThisMonth: number;
  closeRate: number;
  avgDealSize: number;
  monthlyRevenue: number;
  pipelineByStage: { stage: string; count: number; totalValue: number }[];
  financingAlerts: {
    dealId: string;
    customerName: string;
    lender: string;
    status: string;
    urgency: string;
  }[];
  recentActivity: {
    id: string;
    description: string;
    timestamp: string;
    dealId?: string;
  }[];
}

export async function getDashboardStats(
  filters: DashboardFilters = {},
): Promise<{ data: DashboardStats | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { data: null, error: "Unauthorized" };
    }

    let dealsQuery = supabase
      .from("deals")
      .select("id, stage, gross_price, created_at")
      .eq("company_id", user.companyId)
      .is("deleted_at", null);

    if (user.role === "closer" && user.userId) {
      dealsQuery = dealsQuery.eq("closer_id", user.userId);
    } else if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId
    ) {
      dealsQuery = dealsQuery.eq("office_id", user.officeId);
    }
    if (filters.officeId)
      dealsQuery = dealsQuery.eq("office_id", filters.officeId);
    if (filters.closerId)
      dealsQuery = dealsQuery.eq("closer_id", filters.closerId);

    const { data: deals, error: dealsError } = await dealsQuery;

    if (dealsError) {
      return { data: null, error: dealsError.message };
    }

    const list = deals ?? [];
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).toISOString();
    const dealsThisMonth = list.filter(
      (d) => (d.created_at ?? "") >= startOfMonth,
    );
    const ptoDeals = list.filter((d) => d.stage === "pto");
    const totalValue = list.reduce(
      (s, d) => s + (Number(d.gross_price) || 0),
      0,
    );
    const monthlyRevenue = ptoDeals
      .filter((d) => (d.created_at ?? "") >= startOfMonth)
      .reduce((s, d) => s + (Number(d.gross_price) || 0), 0);

    const byStage: Record<string, { count: number; totalValue: number }> = {};
    for (const d of list) {
      const stage = d.stage ?? "new_lead";
      if (!byStage[stage]) byStage[stage] = { count: 0, totalValue: 0 };
      byStage[stage].count += 1;
      byStage[stage].totalValue += Number(d.gross_price) || 0;
    }
    const pipelineByStage = Object.entries(byStage).map(([stage, v]) => ({
      stage,
      count: v.count,
      totalValue: v.totalValue,
    }));

    const { data: financing } = await supabase
      .from("financing_applications")
      .select("id, deal_id, status")
      .in("status", ["stips_pending", "pending", "approved"])
      .is("deleted_at", null);
    const dealIds = [...new Set((financing ?? []).map((f) => f.deal_id))];
    const financingAlerts: DashboardStats["financingAlerts"] = [];
    if (dealIds.length > 0) {
      const { data: dealRows } = await supabase
        .from("deals")
        .select("id, contact_id")
        .in("id", dealIds)
        .eq("company_id", user.companyId);
      for (const fa of financing ?? []) {
        const deal = (dealRows ?? []).find((d) => d.id === fa.deal_id);
        if (deal) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("first_name, last_name")
            .eq("id", deal.contact_id)
            .single();
          const name = contact
            ? [contact.first_name, contact.last_name].filter(Boolean).join(" ")
            : "Unknown";
          financingAlerts.push({
            dealId: fa.deal_id,
            customerName: name,
            lender: "—",
            status: fa.status,
            urgency: fa.status === "stips_pending" ? "high" : "medium",
          });
        }
      }
    }

    const { data: history } = await supabase
      .from("deal_stage_history")
      .select("id, deal_id, to_stage, created_at")
      .in(
        "deal_id",
        list.slice(0, 50).map((d) => d.id),
      )
      .order("created_at", { ascending: false })
      .limit(20);
    const recentActivity: DashboardStats["recentActivity"] = (
      history ?? []
    ).map((h) => ({
      id: h.id,
      description: `Stage: ${h.to_stage}`,
      timestamp: h.created_at ?? "",
      dealId: h.deal_id,
    }));

    const stats: DashboardStats = {
      dealsThisMonth: dealsThisMonth.length,
      closeRate:
        list.length > 0 ? Math.round((ptoDeals.length / list.length) * 100) : 0,
      avgDealSize: list.length > 0 ? Math.round(totalValue / list.length) : 0,
      monthlyRevenue,
      pipelineByStage,
      financingAlerts,
      recentActivity,
    };

    return { data: stats, error: null };
  } catch (e) {
    return {
      data: null,
      error: e instanceof Error ? e.message : "Failed to fetch dashboard stats",
    };
  }
}

export async function getDealCounts(): Promise<{
  newLeadCount: number;
  activeCount: number;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    if (!user?.companyId) {
      return { newLeadCount: 0, activeCount: 0, error: "Unauthorized" };
    }

    let query = supabase
      .from("deals")
      .select("id, stage", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .is("deleted_at", null);

    if (user.role === "closer" && user.userId) {
      query = query.eq("closer_id", user.userId);
    } else if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId
    ) {
      query = query.eq("office_id", user.officeId);
    }

    const { count: activeCount } = await query;
    let newLeadQuery = supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("company_id", user.companyId)
      .eq("stage", "new_lead")
      .is("deleted_at", null);
    if (user.role === "closer" && user.userId) {
      newLeadQuery = newLeadQuery.eq("closer_id", user.userId);
    } else if (
      (user.role === "office_manager" || user.role === "regional_manager") &&
      user.officeId
    ) {
      newLeadQuery = newLeadQuery.eq("office_id", user.officeId);
    }
    const { count: newLeadCount } = await newLeadQuery;

    return {
      newLeadCount: newLeadCount ?? 0,
      activeCount: activeCount ?? 0,
      error: null,
    };
  } catch (e) {
    return {
      newLeadCount: 0,
      activeCount: 0,
      error: e instanceof Error ? e.message : "Failed to fetch counts",
    };
  }
}
