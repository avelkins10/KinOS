// ============================================
// KinOS Solar CRM — Mock Data
// ============================================

export type DealStage =
  | "new_lead"
  | "design_requested"
  | "design_complete"
  | "proposal"
  | "financing"
  | "contracting"
  | "pre_intake"
  | "submitted"
  | "intake_approved"

export const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: "New Lead",
  design_requested: "Design Requested",
  design_complete: "Design Complete",
  proposal: "Proposal",
  financing: "Financing",
  contracting: "Contracting",
  pre_intake: "Pre-Intake",
  submitted: "Submitted",
  intake_approved: "Intake Approved",
}

export const STAGE_COLORS: Record<DealStage, string> = {
  new_lead: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  design_requested: "bg-primary/15 text-primary border-primary/25",
  design_complete: "bg-chart-2/15 text-chart-2 border-chart-2/25",
  proposal: "bg-accent/15 text-accent border-accent/25",
  financing: "bg-warning/15 text-warning border-warning/25",
  contracting: "bg-chart-1/15 text-chart-1 border-chart-1/25",
  pre_intake: "bg-chart-4/15 text-chart-4 border-chart-4/25",
  submitted: "bg-primary/15 text-primary border-primary/25",
  intake_approved: "bg-success/15 text-success border-success/25",
}

export interface Rep {
  id: string
  name: string
  avatar: string
  role: "closer" | "setter" | "manager" | "admin"
  office: string
  email: string
  dealsThisMonth: number
  revenue: number
  closeRate: number
  avgDaysToClose: number
}

export interface Deal {
  id: string
  customerName: string
  address: string
  city: string
  state: string
  stage: DealStage
  closer: Rep
  setter: Rep
  systemSize: number | null
  panelBrand: string | null
  inverterBrand: string | null
  lender: string | null
  lenderProduct: string | null
  dealValue: number
  monthlyPayment: number | null
  createdAt: string
  daysInStage: number
  daysInPipeline: number
  source: string
  utilityAccount: string
  phone: string
  email: string
  annualProduction: number | null
  offset: number | null
  panelCount: number | null
}

export interface Appointment {
  id: string
  customerName: string
  address: string
  time: string
  setter: string
  dealId: string
  type: "in-home" | "virtual"
}

export interface ActivityItem {
  id: string
  type: "stage_change" | "note" | "document" | "proposal" | "financing" | "system"
  description: string
  detail?: string
  timestamp: string
  user: string
  dealId?: string
}

// Reps
export const REPS: Rep[] = [
  { id: "r1", name: "Austin E.", avatar: "AE", role: "closer", office: "Arizona Office", email: "austin@kinhome.com", dealsThisMonth: 8, revenue: 287400, closeRate: 42, avgDaysToClose: 18 },
  { id: "r2", name: "Tyler R.", avatar: "TR", role: "closer", office: "Florida Gulf", email: "tyler@kinhome.com", dealsThisMonth: 6, revenue: 214800, closeRate: 38, avgDaysToClose: 22 },
  { id: "r3", name: "Jake B.", avatar: "JB", role: "closer", office: "Florida Atlantic", email: "jake@kinhome.com", dealsThisMonth: 10, revenue: 342000, closeRate: 48, avgDaysToClose: 15 },
  { id: "r4", name: "Mike T.", avatar: "MT", role: "setter", office: "Arizona Office", email: "mike@kinhome.com", dealsThisMonth: 14, revenue: 0, closeRate: 0, avgDaysToClose: 0 },
  { id: "r5", name: "Sarah L.", avatar: "SL", role: "manager", office: "Utah HQ", email: "sarah@kinhome.com", dealsThisMonth: 0, revenue: 0, closeRate: 0, avgDaysToClose: 0 },
  { id: "r6", name: "Chris W.", avatar: "CW", role: "closer", office: "Arizona Office", email: "chris@kinhome.com", dealsThisMonth: 5, revenue: 178500, closeRate: 35, avgDaysToClose: 24 },
  { id: "r7", name: "Anna K.", avatar: "AK", role: "setter", office: "Florida Gulf", email: "anna@kinhome.com", dealsThisMonth: 12, revenue: 0, closeRate: 0, avgDaysToClose: 0 },
]

const lenders = ["LightReach", "GoodLeap", "Mosaic", "Climate First Bank", "Dividend", "EnFin", "Sunlight"]
const sources = ["Referral", "Door Knock", "Web Lead", "Partner", "Event"]
const panels = ["REC", "Qcells", "Silfab"]
const inverters = ["Enphase", "SolarEdge"]

export const DEALS: Deal[] = [
  { id: "d1", customerName: "Robert Martinez", address: "4521 E Cactus Rd", city: "Phoenix", state: "AZ", stage: "design_requested", closer: REPS[0], setter: REPS[3], systemSize: 10.66, panelBrand: "REC", inverterBrand: "Enphase", lender: "LightReach", lenderProduct: "25yr PPA", dealValue: 31980, monthlyPayment: 162.5, createdAt: "2026-01-15", daysInStage: 3, daysInPipeline: 26, source: "Referral", utilityAccount: "APS-9928374", phone: "(480) 555-0142", email: "rmartinez@email.com", annualProduction: 17200, offset: 98, panelCount: 26 },
  { id: "d2", customerName: "Jennifer & Tom Walsh", address: "8832 N 19th Ave", city: "Phoenix", state: "AZ", stage: "proposal", closer: REPS[0], setter: REPS[3], systemSize: 12.4, panelBrand: "Qcells", inverterBrand: "Enphase", lender: "GoodLeap", lenderProduct: "25yr Loan", dealValue: 38920, monthlyPayment: 198.0, createdAt: "2026-01-08", daysInStage: 5, daysInPipeline: 33, source: "Door Knock", utilityAccount: "SRP-4412889", phone: "(480) 555-0271", email: "walshfamily@email.com", annualProduction: 20100, offset: 105, panelCount: 31 },
  { id: "d3", customerName: "David Chen", address: "2209 W Baseline Rd", city: "Tempe", state: "AZ", stage: "financing", closer: REPS[0], setter: REPS[3], systemSize: 8.54, panelBrand: "Silfab", inverterBrand: "SolarEdge", lender: "Mosaic", lenderProduct: "20yr Loan", dealValue: 27850, monthlyPayment: 145.0, createdAt: "2026-01-20", daysInStage: 2, daysInPipeline: 21, source: "Web Lead", utilityAccount: "APS-7761045", phone: "(480) 555-0398", email: "dchen@email.com", annualProduction: 13800, offset: 92, panelCount: 21 },
  { id: "d4", customerName: "Maria Rodriguez", address: "15670 N Frank Lloyd Wright Blvd", city: "Scottsdale", state: "AZ", stage: "new_lead", closer: REPS[0], setter: REPS[3], systemSize: null, panelBrand: null, inverterBrand: null, lender: null, lenderProduct: null, dealValue: 0, monthlyPayment: null, createdAt: "2026-02-08", daysInStage: 2, daysInPipeline: 2, source: "Referral", utilityAccount: "", phone: "(480) 555-0524", email: "maria.r@email.com", annualProduction: null, offset: null, panelCount: null },
  { id: "d5", customerName: "James & Linda Thompson", address: "3847 Gulf Shore Blvd N", city: "Naples", state: "FL", stage: "contracting", closer: REPS[1], setter: REPS[6], systemSize: 14.2, panelBrand: "REC", inverterBrand: "Enphase", lender: "Climate First Bank", lenderProduct: "HELOC", dealValue: 45800, monthlyPayment: 225.0, createdAt: "2025-12-28", daysInStage: 4, daysInPipeline: 44, source: "Partner", utilityAccount: "FPL-3389210", phone: "(239) 555-0183", email: "thompson.jl@email.com", annualProduction: 22100, offset: 110, panelCount: 35 },
  { id: "d6", customerName: "Patricia Nguyen", address: "9912 Tamiami Trail", city: "Fort Myers", state: "FL", stage: "pre_intake", closer: REPS[1], setter: REPS[6], systemSize: 11.8, panelBrand: "Qcells", inverterBrand: "Enphase", lender: "LightReach", lenderProduct: "25yr PPA", dealValue: 35400, monthlyPayment: 178.0, createdAt: "2025-12-15", daysInStage: 1, daysInPipeline: 57, source: "Door Knock", utilityAccount: "LCEC-9927148", phone: "(239) 555-0412", email: "pnguyen@email.com", annualProduction: 18900, offset: 100, panelCount: 29 },
  { id: "d7", customerName: "Steven Brooks", address: "5521 Atlantic Ave", city: "Delray Beach", state: "FL", stage: "new_lead", closer: REPS[2], setter: REPS[6], systemSize: null, panelBrand: null, inverterBrand: null, lender: null, lenderProduct: null, dealValue: 0, monthlyPayment: null, createdAt: "2026-02-05", daysInStage: 5, daysInPipeline: 5, source: "Web Lead", utilityAccount: "", phone: "(561) 555-0298", email: "sbrooks@email.com", annualProduction: null, offset: null, panelCount: null },
  { id: "d8", customerName: "Karen & Bill Foster", address: "7714 S Dixie Hwy", city: "West Palm Beach", state: "FL", stage: "design_complete", closer: REPS[2], setter: REPS[6], systemSize: 15.8, panelBrand: "REC", inverterBrand: "SolarEdge", lender: null, lenderProduct: null, dealValue: 49900, monthlyPayment: null, createdAt: "2026-01-22", daysInStage: 7, daysInPipeline: 19, source: "Event", utilityAccount: "FPL-8847215", phone: "(561) 555-0167", email: "fosters@email.com", annualProduction: 25200, offset: 115, panelCount: 39 },
  { id: "d9", customerName: "Michael Scott", address: "12450 W Indian School Rd", city: "Avondale", state: "AZ", stage: "design_requested", closer: REPS[5], setter: REPS[3], systemSize: null, panelBrand: null, inverterBrand: null, lender: null, lenderProduct: null, dealValue: 0, monthlyPayment: null, createdAt: "2026-02-03", daysInStage: 3, daysInPipeline: 7, source: "Door Knock", utilityAccount: "APS-1128744", phone: "(623) 555-0441", email: "mscott@email.com", annualProduction: null, offset: null, panelCount: null },
  { id: "d10", customerName: "Angela Davis", address: "6639 E Camelback Rd", city: "Scottsdale", state: "AZ", stage: "submitted", closer: REPS[0], setter: REPS[3], systemSize: 9.88, panelBrand: "Silfab", inverterBrand: "Enphase", lender: "Dividend", lenderProduct: "20yr Loan", dealValue: 32150, monthlyPayment: 155.0, createdAt: "2025-12-01", daysInStage: 0, daysInPipeline: 71, source: "Referral", utilityAccount: "SRP-5573920", phone: "(480) 555-0633", email: "adavis@email.com", annualProduction: 15900, offset: 96, panelCount: 24 },
  { id: "d11", customerName: "William Harris", address: "1890 Estero Blvd", city: "Fort Myers Beach", state: "FL", stage: "proposal", closer: REPS[1], setter: REPS[6], systemSize: 13.5, panelBrand: "REC", inverterBrand: "Enphase", lender: "EnFin", lenderProduct: "25yr Loan", dealValue: 42750, monthlyPayment: 212.0, createdAt: "2026-01-10", daysInStage: 8, daysInPipeline: 31, source: "Referral", utilityAccount: "FPL-6628114", phone: "(239) 555-0572", email: "wharris@email.com", annualProduction: 21600, offset: 108, panelCount: 33 },
  { id: "d12", customerName: "Elizabeth Taylor", address: "3320 N Central Ave", city: "Phoenix", state: "AZ", stage: "design_requested", closer: REPS[5], setter: REPS[3], systemSize: 11.2, panelBrand: "Qcells", inverterBrand: "SolarEdge", lender: null, lenderProduct: null, dealValue: 34560, monthlyPayment: null, createdAt: "2026-01-25", daysInStage: 5, daysInPipeline: 16, source: "Web Lead", utilityAccount: "APS-3345817", phone: "(602) 555-0189", email: "etaylor@email.com", annualProduction: 18100, offset: 94, panelCount: 28 },
  { id: "d13", customerName: "Richard & Sue Kim", address: "8901 Bonita Beach Rd", city: "Bonita Springs", state: "FL", stage: "financing", closer: REPS[2], setter: REPS[6], systemSize: 10.2, panelBrand: "Silfab", inverterBrand: "Enphase", lender: "Sunlight", lenderProduct: "20yr Loan", dealValue: 33400, monthlyPayment: 170.0, createdAt: "2026-01-18", daysInStage: 4, daysInPipeline: 23, source: "Partner", utilityAccount: "FPL-2218903", phone: "(239) 555-0741", email: "kimfamily@email.com", annualProduction: 16500, offset: 97, panelCount: 25 },
  { id: "d14", customerName: "Nancy Wilson", address: "4455 E McDowell Rd", city: "Mesa", state: "AZ", stage: "new_lead", closer: REPS[0], setter: REPS[3], systemSize: null, panelBrand: null, inverterBrand: null, lender: null, lenderProduct: null, dealValue: 0, monthlyPayment: null, createdAt: "2026-02-06", daysInStage: 4, daysInPipeline: 4, source: "Door Knock", utilityAccount: "", phone: "(480) 555-0856", email: "nwilson@email.com", annualProduction: null, offset: null, panelCount: null },
  { id: "d15", customerName: "George Patel", address: "2100 Palm Beach Lakes Blvd", city: "West Palm Beach", state: "FL", stage: "intake_approved", closer: REPS[2], setter: REPS[6], systemSize: 16.0, panelBrand: "REC", inverterBrand: "Enphase", lender: "GoodLeap", lenderProduct: "25yr Loan", dealValue: 52800, monthlyPayment: 265.0, createdAt: "2025-12-10", daysInStage: 2, daysInPipeline: 62, source: "Referral", utilityAccount: "FPL-7752091", phone: "(561) 555-0923", email: "gpatel@email.com", annualProduction: 25800, offset: 120, panelCount: 40 },
]

export const TODAYS_APPOINTMENTS: Appointment[] = [
  { id: "a1", customerName: "Nancy Wilson", address: "4455 E McDowell Rd, Mesa, AZ", time: "10:00 AM", setter: "Mike T.", dealId: "d14", type: "in-home" },
  { id: "a2", customerName: "Maria Rodriguez", address: "15670 N Frank Lloyd Wright Blvd, Scottsdale, AZ", time: "1:00 PM", setter: "Mike T.", dealId: "d4", type: "in-home" },
  { id: "a3", customerName: "Steven Brooks", address: "5521 Atlantic Ave, Delray Beach, FL", time: "3:30 PM", setter: "Anna K.", dealId: "d7", type: "virtual" },
]

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: "act1", type: "stage_change", description: "Deal moved to Design In Progress", detail: "Appointment Completed -> Design In Progress", timestamp: "2 hours ago", user: "Austin E.", dealId: "d1" },
  { id: "act2", type: "financing", description: "Financing application submitted", detail: "Mosaic - 20yr Loan", timestamp: "3 hours ago", user: "Austin E.", dealId: "d3" },
  { id: "act3", type: "proposal", description: "Proposal finalized", detail: "LightReach 25yr PPA - $178/mo", timestamp: "5 hours ago", user: "Tyler R.", dealId: "d6" },
  { id: "act4", type: "document", description: "Contract packet sent for signature", timestamp: "6 hours ago", user: "Tyler R.", dealId: "d6" },
  { id: "act5", type: "note", description: "Customer confirmed they want to proceed with REC panels", timestamp: "Yesterday", user: "Jake B.", dealId: "d8" },
  { id: "act6", type: "stage_change", description: "Deal moved to Submitted", detail: "Contract Signed -> Submitted", timestamp: "Yesterday", user: "Austin E.", dealId: "d10" },
  { id: "act7", type: "financing", description: "Financing approved - stips pending", detail: "Climate First Bank HELOC", timestamp: "Yesterday", user: "Tyler R.", dealId: "d5" },
  { id: "act8", type: "system", description: "Aurora design completed", detail: "15.8 kW - 39 panels", timestamp: "2 days ago", user: "System", dealId: "d8" },
]

export const FINANCING_ALERTS = [
  { id: "fa1", dealId: "d3", customerName: "David Chen", lender: "Mosaic", status: "Stips Pending", detail: "Utility bill required", urgency: "high" as const },
  { id: "fa2", dealId: "d5", customerName: "James & Linda Thompson", lender: "Climate First Bank", status: "Approved", detail: "Ready to proceed", urgency: "low" as const },
  { id: "fa3", dealId: "d13", customerName: "Richard & Sue Kim", lender: "Sunlight", status: "Under Review", detail: "Submitted 4 days ago", urgency: "medium" as const },
]

export const OFFICES = ["Arizona Office", "Florida Gulf", "Florida Atlantic", "Utah HQ"]
export const LENDERS = lenders
export const SOURCES = sources
export const PANELS = panels
export const INVERTERS = inverters
