// lib/utils/merge-fields.ts
// Merge field assembly for document templates (blueprint §8.2)

import type { DealDetail } from "@/lib/actions/deals";

/**
 * Assemble merge fields from deal detail data for contract templates.
 * Maps deal + contact + proposal + financing data into a flat key-value map.
 */
export function assembleMergeFields(
  dealDetail: DealDetail,
): Record<string, string> {
  const contact = dealDetail.contact;
  const closer = dealDetail.closer;
  const setter = dealDetail.setter;
  const proposal = dealDetail.proposals?.[0]; // most recent
  const financing = dealDetail.financingApplications?.[0]; // most recent

  const fmt = (v: unknown): string => {
    if (v == null || v === "") return "";
    return String(v);
  };

  const fmtCurrency = (v: unknown): string => {
    const n = Number(v);
    if (isNaN(n) || v == null) return "";
    return n.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    // Homeowner
    homeowner_first_name: fmt(contact?.first_name),
    homeowner_last_name: fmt(contact?.last_name),
    homeowner_full_name: contact
      ? [contact.first_name, contact.last_name].filter(Boolean).join(" ")
      : "",
    homeowner_email: fmt(contact?.email),
    homeowner_phone: fmt(contact?.phone),
    homeowner_address: fmt(contact?.address ?? dealDetail.install_address),
    homeowner_city: fmt(contact?.city ?? dealDetail.install_city),
    homeowner_state: fmt(contact?.state ?? dealDetail.install_state),
    homeowner_zip: fmt(contact?.zip ?? dealDetail.install_zip),
    homeowner_full_address: [
      contact?.address ?? dealDetail.install_address,
      contact?.city ?? dealDetail.install_city,
      contact?.state ?? dealDetail.install_state,
      contact?.zip ?? dealDetail.install_zip,
    ]
      .filter(Boolean)
      .join(", "),

    // System
    system_size_kw: fmt(dealDetail.system_size_kw),
    panel_count: fmt(dealDetail.panel_count),
    panel_model: fmt(dealDetail.panel_model),
    inverter_model: fmt(dealDetail.inverter_model),
    battery_model: fmt(dealDetail.battery_model),
    battery_count: fmt(dealDetail.battery_count),
    annual_production_kwh: fmt(dealDetail.annual_production_kwh),
    offset_percentage: fmt(dealDetail.offset_percentage),

    // Pricing
    gross_price: fmtCurrency(dealDetail.gross_price),
    net_price: fmtCurrency(dealDetail.net_price),
    gross_ppw: fmt(dealDetail.gross_ppw),
    monthly_payment: fmtCurrency(dealDetail.monthly_payment),
    down_payment: fmtCurrency(proposal?.down_payment),
    federal_tax_credit: fmtCurrency(proposal?.federal_rebate_amount),

    // Financing
    lender_name: fmt(financing?.lender?.name),
    loan_product: fmt(financing?.lender_product?.name),
    loan_term_months: fmt(financing?.lender_product?.term_months),
    interest_rate: fmt(financing?.lender_product?.interest_rate),

    // Rep
    closer_name: closer
      ? `${closer.first_name} ${closer.last_name}`.trim()
      : "",
    closer_email: fmt(closer?.email),
    setter_name: setter
      ? `${setter.first_name} ${setter.last_name}`.trim()
      : "",

    // Dates
    date_today: today,
    deal_number: fmt(dealDetail.deal_number),
  };
}
