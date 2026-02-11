// Map DealWithRelations to UI-friendly shape for Kanban/List and DealCard

import type { DealWithRelations } from "@/lib/actions/deals";
import type { DealStage } from "@/lib/constants/pipeline";

export interface DealForUI {
  id: string;
  stage: DealStage;
  customerName: string;
  address: string;
  city: string;
  state: string;
  dealValue: number;
  systemSize: number | null;
  lender: string | null;
  lenderProduct?: string | null;
  monthlyPayment?: number | null;
  closer: { id: string; name: string; avatar: string };
  setter: { id: string; name: string; avatar: string } | null;
  daysInStage: number;
  daysInPipeline: number;
  createdAt: string;
  source: string;
  phone: string;
  email: string;
  dealNumber: string;
  /** Optional for step/tab UIs */
  utilityAccount?: string | null;
  annualProduction?: number | null;
  panelCount?: number | null;
  panelBrand?: string | null;
  inverterBrand?: string | null;
  offset?: number | null;
}

function initials(first: string, last: string): string {
  return (
    [first, last]
      .map((s) => (s ?? "").charAt(0))
      .join("")
      .toUpperCase() || "?"
  );
}

export function mapDealForUI(d: DealWithRelations): DealForUI {
  const contact = d.contact;
  const contactName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(" ") ||
      "Unknown"
    : "Unknown";
  const address = contact?.address ?? d.install_address ?? "";
  const city = contact?.city ?? d.install_city ?? "";
  const state = contact?.state ?? d.install_state ?? "";
  const closer = d.closer;
  const setter = d.setter;
  const stageChanged = d.stage_changed_at ? new Date(d.stage_changed_at) : null;
  const created = d.created_at ? new Date(d.created_at) : new Date();
  const now = new Date();
  const daysInStage = stageChanged
    ? Math.max(
        0,
        Math.floor(
          (now.getTime() - stageChanged.getTime()) / (24 * 60 * 60 * 1000),
        ),
      )
    : 0;
  const daysInPipeline = Math.max(
    0,
    Math.floor((now.getTime() - created.getTime()) / (24 * 60 * 60 * 1000)),
  );

  return {
    id: d.id,
    stage: (d.stage ?? "new_lead") as DealStage,
    customerName: contactName,
    address,
    city,
    state,
    dealValue: Number(d.gross_price) || 0,
    systemSize: d.system_size_kw != null ? Number(d.system_size_kw) : null,
    lender: null, // join lenders table in getDealsByStage if needed
    closer: {
      id: closer?.id ?? "",
      name: closer
        ? `${closer.first_name} ${closer.last_name}`.trim()
        : "Unassigned",
      avatar: closer ? initials(closer.first_name, closer.last_name) : "?",
    },
    setter: setter
      ? {
          id: setter.id,
          name: `${setter.first_name} ${setter.last_name}`.trim(),
          avatar: initials(setter.first_name, setter.last_name),
        }
      : null,
    daysInStage,
    daysInPipeline,
    createdAt: d.created_at ?? "",
    source: d.source ?? "Manual",
    phone: contact?.phone ?? "",
    email: contact?.email ?? "",
    dealNumber: d.deal_number ?? "",
    monthlyPayment:
      d.monthly_payment != null ? Number(d.monthly_payment) : null,
    lenderProduct: d.loan_product ?? null,
    utilityAccount:
      (contact as { utility_company?: string })?.utility_company ?? null,
    annualProduction:
      d.annual_production_kwh != null ? Number(d.annual_production_kwh) : null,
    panelCount: d.panel_count != null ? Number(d.panel_count) : null,
    panelBrand: d.panel_model ?? null,
    inverterBrand: d.inverter_model ?? null,
    offset: d.offset_percentage != null ? Number(d.offset_percentage) : null,
  };
}

export function mapDealsForUI(deals: DealWithRelations[]): DealForUI[] {
  return deals.map(mapDealForUI);
}
