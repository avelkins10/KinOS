# Enerflo Project Submission Payload Analysis

## TOP-LEVEL STRUCTURE
- event: "deal.projectSubmitted"
- payload.targetOrg (UUID)
- payload.initiatedBy (UUID — the sales rep)
- payload.deal
- payload.customer
- payload.proposal
- payload.design

## FIELDS ENERFLO TRACKS — COMPARISON TO OUR SCHEMA

### DEAL STATE (deal.state) — Checklist/Gate System
These are Enerflo's "substages" — essentially our gate_definitions system.

| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| hasDesign | gate_completions | ✅ Covered |
| hasCreatedProposal | gate_completions | ✅ Covered |
| selectedProposal | deals.active_proposal_id? | ⚠️ MISSING — no active proposal reference |
| financingStatus: "approved" | deals.financing_status | ✅ Covered |
| hasSignedContract | deals.install_agreement_status | ✅ Covered |
| hasSubmittedProject | deals.submission_status | ✅ Covered |
| hasGeneratedContract | gate_completions | ✅ Covered |
| hasSignedFinancingDocs | gate_completions | ✅ Covered |
| hasSubmittedFinancingApplication | gate_completions | ✅ Covered |
| hasApprovedContract | gate_completions | ✅ Covered |
| contractApprovalEnabled | company settings | ✅ Covered in settings JSONB |

### DEAL STATE — Substage Forms (KinOS gates with dynamic fields)
| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| site-survey.schedule-site-survey | ❌ MISSING — no site survey tracking |
| site-survey.site-survey-selection | ❌ MISSING |
| utility-bill.full-utility-bill (file) | attachments | ✅ Covered |
| system-offset.new-move-in | ❌ MISSING — "is this a new move-in" |
| system-offset.layout-preferences | ❌ MISSING |
| system-offset.are-there-any-shading-concerns | ❌ MISSING |
| system-offset.is-the-system-offset-below-100 | ❌ MISSING |
| customers-photo-id (files) | attachments | ✅ Covered |
| lender-welcome-call.lender-dropdown | ❌ MISSING — lender-specific welcome call |
| lender-welcome-call.additional-steps-lightreach | ❌ MISSING |
| is-this-a-battery-only | deals.is_battery_only? | ❌ MISSING |
| is-this-a-commercial-deal | deals.is_commercial? | ❌ MISSING |
| sales-rep-confirmation.ready-to-submit | gate_completions | ✅ Covered |
| additional-work-substage.* (hvac, roof, tree) | ❌ MISSING — no additional work tracking |
| complete-call-pilot-welcome-call | ❌ MISSING |
| have-you-requested-a-review-from-the-home-owner | ❌ MISSING |

### FILES (deal.files)
| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| files[].source: "full-utility-bill" | attachments.category | ⚠️ Need file categorization |
| files[].source: "customers-photo-id" | attachments.category | ⚠️ Need file categorization |
| files[].source: "signedContractFiles" | document_envelopes | ✅ Covered |

### CUSTOMER
| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| customer.firstName | contacts.first_name | ✅ |
| customer.lastName | contacts.last_name | ✅ |
| (No email/phone in submission) | — | OK, already on contact |

### DESIGN (design + proposal.pricingOutputs.design)
| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| arrays[].module.name/model/manufacturer | proposals.panel_model | ✅ |
| arrays[].module.capacity (410W) | proposals.panel_wattage | ✅ |
| arrays[].module.efficiency (0.209) | ❌ MISSING |
| arrays[].module.degradation (0.005) | ❌ MISSING |
| arrays[].moduleCount per array | ❌ MISSING — we only store total panel_count |
| arrays[].azimuth | ❌ MISSING — per-array azimuth |
| arrays[].pitch | ❌ MISSING — per-array pitch |
| arrays[].tof (temperature coefficient) | ❌ MISSING |
| arrays[].tsrf | ❌ MISSING |
| arrays[].solarAccess | ❌ MISSING |
| arrays[].roofPlaneIndex | ❌ MISSING |
| arrays[].solarAccessByMonth[] | ❌ MISSING |
| inverters[].name/model/manufacturer | proposals.inverter_model | ✅ |
| inverters[].acOutput (11400W) | ❌ MISSING |
| inverters[].isMicro | ❌ MISSING |
| batteries[] | proposals.battery columns | ✅ |
| mountingType: "ROOF" | ❌ MISSING |
| roofMaterial: "ASPHALT_SHINGLES" | ❌ MISSING — contacts.roof_type only |
| weightedTsrf | ❌ MISSING |
| totalSystemSizeWatts | proposals.system_size_kw (convert) | ✅ |
| firstYearProduction | proposals.annual_production_kwh | ✅ |
| consumptionProfile.annualConsumption | proposals.annual_consumption_kwh | ✅ |
| consumptionProfile.consumption[] (monthly) | ❌ MISSING — monthly consumption |
| consumptionProfile.utility.name | contacts.utility_company | ✅ |
| consumptionProfile.tariff.* | ❌ MISSING — tariff details |
| consumptionProfile.rate | ❌ MISSING — utility rate $/kWh |
| consumptionProfile.averageMonthlyBill | contacts.monthly_electric_bill | ✅ |
| consumptionProfile.buildingArea | ❌ MISSING — sq footage |
| offset (1.056 = 105.6%) | proposals.offset_percentage | ✅ |

### PRICING
| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| basePPW (3.1276) | proposals.base_ppw | ✅ |
| baseCost (42316.59) | proposals.base_price | ✅ |
| grossPPW (3.32) | proposals.gross_ppw | ✅ |
| grossCost (44919.60) | proposals.gross_cost | ✅ |
| netPPW (3.32) | proposals.net_ppw | ✅ |
| netCost (44919.60) | proposals.net_cost | ✅ |
| dealerFee (0) | proposals.dealer_fee_amount | ✅ |
| dealerFeePercent (0) | proposals.dealer_fee_ppw | ✅ |
| commissionBase (44919.59) | proposals.commission_base | ✅ |
| commissionBasePPW (3.32) | proposals.commission_ppw | ✅ |
| financeCost (44919.60) | ❌ MISSING — finance cost (after dealer fee) |
| downPayment (0) | ❌ MISSING |
| systemAddersTotal (2603) | proposals.adder_total | ✅ |
| valueAddersTotal (0) | ❌ MISSING — value vs system adder distinction |
| equipmentTotal (0) | proposals.equipment_cost | ✅ |
| moduleTotal (0) | ❌ MISSING |
| inverterTotal (0) | ❌ MISSING |
| batteryTotal (0) | ❌ MISSING |
| rebatesTotal (0) | proposals.rebate_total | ✅ |
| discountsTotal (0) | proposals.discount_total | ✅ |
| taxRate (0) | ❌ MISSING |
| federalRebateBase | ❌ MISSING — ITC calculation base |
| federalRebateTotal | ❌ MISSING — ITC amount |

### FINANCE PRODUCT
| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| financeProduct.name | proposals.financing_product_name | ✅ |
| financeProduct.plugin (PalmettoFinancePlugin) | lenders.api_endpoint? | ⚠️ |
| financeProduct.termMonths (300) | lender_products.term_months | ✅ |
| financeProduct.dealerFeePercent (0) | lender_products.dealer_fee_percent | ✅ |
| financeProduct.customFields.escalationRate (0.0299) | proposals.escalator_percent | ✅ |
| financeProduct.customFields.rates[] | lender_products JSONB? | ⚠️ Need TPO rate table |
| financeProduct.customFields.enabledAdderTypes | ❌ MISSING — lender-specific adder rules |

### ADDER SYSTEM (Critical detail)
| Enerflo Field | Our Schema | Gap? |
|---|---|---|
| systemAdders (auto-applied) | proposal_adders.is_auto_applied | ✅ |
| valueAdders (manually selected) | proposal_adders | ✅ |
| skippedAdders (didn't activate) | ❌ MISSING — no skip tracking |
| availableValueAdders (could be added) | adder_templates | ✅ |
| adder.dynamicInputs (user-entered fields) | ❌ MISSING — dynamic input storage |
| adder.pricingOptions.type (FIXED, PPW, CUSTOM) | adder_templates.pricing_type | ✅ |
| adder.pricingOptions.model (computation) | ❌ MISSING — no computation model |

## CRITICAL GAPS DISCOVERED

### 1. NO ARRAY-LEVEL DESIGN DATA TABLE
Enerflo stores per-array data: pitch, azimuth, module count, TSRF, solar access.
We flatten to a single panel_model + panel_count. Need a `proposal_arrays` table.

### 2. NO ACTIVE PROPOSAL REFERENCE ON DEALS
deals.selectedProposal equivalent is missing. Need `active_proposal_id` on deals.

### 3. NO DOWN PAYMENT FIELD
proposals needs `down_payment DECIMAL(10,2) DEFAULT 0`

### 4. NO SITE SURVEY TRACKING
Enerflo has a whole site-survey substage. Our gates can handle this but we need
to make sure gate_definitions supports "field site survey" vs "virtual site survey"

### 5. NO ADDITIONAL WORK TRACKING
HVAC, roof, tree work — these are tracked as substage data in Enerflo.
Our gate_completions.metadata JSONB can handle this, but need to plan for it.

### 6. ADDER DYNAMIC INPUTS NOT STORED
When an adder like "Trenching (Concrete)" asks "how many linear feet?", Enerflo
stores that answer. Our proposal_adders has no field for user-entered inputs.
Need: `dynamic_inputs JSONB DEFAULT '{}'` on proposal_adders.

### 7. FILE CATEGORIZATION
Enerflo files have `source` categories: "full-utility-bill", "customers-photo-id",
"signedContractFiles". Our attachments table needs a `category` field.

### 8. UTILITY/TARIFF DATA
Rate per kWh, tariff code, tariff name, effective date — these affect savings
calculations. Need on contacts or proposals.

### 9. ITC/FEDERAL REBATE TRACKING
federalRebateBase and federalRebateTotal are calculated and stored.

### 10. LENDER-SPECIFIC ADDER TYPE RULES
LightReach only allows certain adder types (backupBattery, electricalUpgrade).
This is a lender_product setting, not a general adder rule.
