# Schema Updates Required (from Enerflo Payload Analysis)

## DEALS TABLE — Add columns:
- active_proposal_id UUID REFERENCES proposals(id)
- install_address TEXT
- install_address2 TEXT  
- install_city TEXT
- install_state TEXT
- install_zip TEXT
- install_lat DECIMAL(10,7)
- install_lng DECIMAL(10,7)
- is_battery_only BOOLEAN DEFAULT false
- is_commercial BOOLEAN DEFAULT false
- mounting_type TEXT DEFAULT 'roof' CHECK (mounting_type IN ('roof', 'ground', 'carport', 'mixed'))
- enerflo_short_code TEXT (for legacy migration reference)

## CONTACTS TABLE — Add columns:
- building_sqft INTEGER
- monthly_consumption_kwh JSONB  -- [jan, feb, mar, ..., dec] kWh values
- utility_rate_kwh DECIMAL(8,5)  -- $/kWh
- utility_tariff_code TEXT
- utility_tariff_name TEXT

## PROPOSALS TABLE — Add columns:
- down_payment DECIMAL(10,2) DEFAULT 0
- finance_cost DECIMAL(12,2)  -- Total financed amount (after down payment)
- utility_rate_kwh DECIMAL(8,5)  -- Rate used for this proposal's savings calc
- post_solar_rate_kwh DECIMAL(8,5)
- federal_rebate_base DECIMAL(12,2)  -- ITC calculation base
- federal_rebate_amount DECIMAL(12,2) DEFAULT 0  -- ITC dollar amount
- monthly_consumption_kwh JSONB  -- Snapshot of consumption at proposal time
- weighted_tsrf DECIMAL(8,6)  -- Weighted total solar resource fraction

## NEW TABLE: proposal_arrays
- id UUID PK
- proposal_id UUID FK → proposals
- array_index INTEGER
- module_id UUID FK → equipment (nullable)
- module_name TEXT
- module_model TEXT
- module_manufacturer TEXT
- module_wattage INTEGER
- module_count INTEGER
- pitch DECIMAL(5,2)
- azimuth DECIMAL(6,2)
- tof DECIMAL(6,4)  -- Temperature operating factor
- tsrf DECIMAL(8,6)  -- Total solar resource fraction
- solar_access DECIMAL(6,4)
- solar_access_by_month JSONB  -- [12 decimal values]
- roof_plane_index INTEGER
- panel_orientation TEXT
- inverter_index INTEGER

## PROPOSAL_ADDERS TABLE — Add column:
- dynamic_inputs JSONB DEFAULT '{}'  -- User-entered values (e.g., {"linear_feet": 45})

## ATTACHMENTS TABLE — Add column:
- category TEXT  -- 'utility_bill', 'photo_id', 'signed_contract', 'site_survey', 'permit', etc.

## LENDER_PRODUCTS TABLE — Add columns:
- tpo_available_rates JSONB  -- Array of rate options [0.09, 0.095, ...]
- tpo_payment_input_mode TEXT CHECK (... IN ('rate_only', 'payment_only', 'both'))
- allowed_adder_categories JSONB DEFAULT '[]'  -- e.g., ["backupBattery", "electricalUpgrade"]
- equipment_pricing_mode TEXT DEFAULT 'standard' CHECK (... IN ('standard', 'zero_cost', 'custom'))

## EQUIPMENT TABLE — Consider:
- lender-specific pricing overrides (TPO = $0, loan = full price)
- Could be a separate equipment_lender_pricing table or handled in lender_products settings
