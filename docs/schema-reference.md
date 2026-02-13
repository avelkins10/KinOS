# KinOS Schema Reference

> **Single source of truth for the KinOS database schema.**
> Auto-generated from live Supabase (`tmfbggewmqcwryhzgrct`) on 2026-02-12.
> **53 objects** (51 tables + 2 views) / **956 columns**
>
> Check this file before writing any SQL. If it drifts from live, re-run the generation query.

---

## Table of Contents

**Org Hierarchy**

- [companies](#companies) (8)
- [offices](#offices) (12)
- [teams](#teams) (8)
- [roles](#roles) (8)

**Users**

- [users](#users) (34)
- [user_lender_credentials](#user-lender-credentials) (14)
- [user_integration_settings](#user-integration-settings) (7)

**CRM Core**

- [contacts](#contacts) (44)
- [deals](#deals) (95)
- [proposals](#proposals) (72)
- [proposal_arrays](#proposal-arrays) (20)
- [proposal_adders](#proposal-adders) (17)
- [proposal_discounts](#proposal-discounts) (9)
- [deal_adders](#deal-adders) (11)

**Tags**

- [tags](#tags) (5)
- [deal_tags](#deal-tags) (4)

**Appointments**

- [appointments](#appointments) (24)

**Equipment**

- [equipment](#equipment) (20)
- [equipment_market_availability](#equipment-market-availability) (8)

**Financing**

- [financing_applications](#financing-applications) (23)
- [financing_status_history](#financing-status-history) (8)

**Lenders**

- [lenders](#lenders) (14)
- [lender_products](#lender-products) (28)

**Pricing**

- [installer_markets](#installer-markets) (9)
- [pricing_configs](#pricing-configs) (22)
- [adder_templates](#adder-templates) (23)
- [adder_scope_rules](#adder-scope-rules) (6)

**Documents**

- [document_templates](#document-templates) (14)
- [document_envelopes](#document-envelopes) (19)

**Gates & Workflow**

- [gate_definitions](#gate-definitions) (13)
- [gate_completions](#gate-completions) (12)
- [workflow_step_definitions](#workflow-step-definitions) (14)
- [deal_workflow_progress](#deal-workflow-progress) (9)

**Files**

- [attachments](#attachments) (15)

**Notes**

- [notes](#notes) (14)
- [note_edits](#note-edits) (5)

**Communications**

- [communication_log](#communication-log) (19)

**History & Audit**

- [deal_stage_history](#deal-stage-history) (8)
- [deal_assignment_history](#deal-assignment-history) (10)
- [contact_change_history](#contact-change-history) (8)
- [deal_snapshots](#deal-snapshots) (8)
- [audit_log](#audit-log) (9)

**Integrations**

- [webhook_events](#webhook-events) (12)
- [integration_sync_log](#integration-sync-log) (11)
- [aurora_pricing_syncs](#aurora-pricing-syncs) (9)
- [repcard_sync_state](#repcard-sync-state) (8)

**Activity & Notifications**

- [activities](#activities) (9)
- [notifications](#notifications) (10)

**Commissions**

- [commission_structures](#commission-structures) (13)
- [deal_commissions](#deal-commissions) (16)

**UI**

- [filter_presets](#filter-presets) (10)

**Views**

- [v_deal_detail](#v-deal-detail) (108)
- [v_deal_pipeline](#v-deal-pipeline) (20)

---

## Org Hierarchy

### companies (8 cols)

| Column     | Type          | Nullable | Default           | FK  |
| ---------- | ------------- | -------- | ----------------- | --- |
| id         | `uuid`        | NO       | gen_random_uuid() |     |
| name       | `text`        | NO       |                   |     |
| slug       | `text`        | NO       |                   |     |
| logo_url   | `text`        | YES      |                   |     |
| settings   | `jsonb`       | YES      | '{}'              |     |
| created_at | `timestamptz` | YES      | now()             |     |
| updated_at | `timestamptz` | YES      | now()             |     |
| updated_by | `uuid`        | YES      |                   |     |

### offices (12 cols)

| Column              | Type          | Nullable | Default            | FK          |
| ------------------- | ------------- | -------- | ------------------ | ----------- |
| id                  | `uuid`        | NO       | gen_random_uuid()  |             |
| company_id          | `uuid`        | NO       |                    | → companies |
| parent_office_id    | `uuid`        | YES      |                    | → offices   |
| name                | `text`        | NO       |                    |             |
| office_type         | `text`        | YES      | 'office'           |             |
| repcard_office_name | `text`        | YES      |                    |             |
| state               | `text`        | YES      |                    |             |
| timezone            | `text`        | YES      | 'America/New_York' |             |
| is_active           | `boolean`     | YES      | true               |             |
| created_at          | `timestamptz` | YES      | now()              |             |
| updated_at          | `timestamptz` | YES      | now()              |             |
| updated_by          | `uuid`        | YES      |                    |             |

### teams (8 cols)

| Column            | Type          | Nullable | Default           | FK        |
| ----------------- | ------------- | -------- | ----------------- | --------- |
| id                | `uuid`        | NO       | gen_random_uuid() |           |
| office_id         | `uuid`        | NO       |                   | → offices |
| name              | `text`        | NO       |                   |           |
| repcard_team_name | `text`        | YES      |                   |           |
| is_active         | `boolean`     | YES      | true              |           |
| created_at        | `timestamptz` | YES      | now()             |           |
| updated_at        | `timestamptz` | YES      | now()             |           |
| updated_by        | `uuid`        | YES      |                   |           |

### roles (8 cols)

| Column         | Type          | Nullable | Default           | FK          |
| -------------- | ------------- | -------- | ----------------- | ----------- |
| id             | `uuid`        | NO       | gen_random_uuid() |             |
| company_id     | `uuid`        | NO       |                   | → companies |
| name           | `text`        | NO       |                   |             |
| display_name   | `text`        | NO       |                   |             |
| category       | `text`        | NO       |                   |             |
| permissions    | `jsonb`       | YES      | '{}'              |             |
| is_system_role | `boolean`     | YES      | false             |             |
| created_at     | `timestamptz` | YES      | now()             |             |

## Users

### users (34 cols)

| Column                   | Type          | Nullable | Default            | FK          |
| ------------------------ | ------------- | -------- | ------------------ | ----------- |
| id                       | `uuid`        | NO       | gen_random_uuid()  |             |
| auth_id                  | `uuid`        | YES      |                    |             |
| company_id               | `uuid`        | NO       |                    | → companies |
| role_id                  | `uuid`        | NO       |                    | → roles     |
| office_id                | `uuid`        | YES      |                    | → offices   |
| team_id                  | `uuid`        | YES      |                    | → teams     |
| first_name               | `text`        | NO       |                    |             |
| last_name                | `text`        | NO       |                    |             |
| email                    | `text`        | NO       |                    |             |
| phone                    | `text`        | YES      |                    |             |
| country_code             | `text`        | YES      | '+1'               |             |
| image_url                | `text`        | YES      |                    |             |
| bio                      | `text`        | YES      |                    |             |
| timezone                 | `text`        | YES      | 'America/New_York' |             |
| repcard_user_id          | `integer`     | YES      |                    |             |
| repcard_badge_id         | `text`        | YES      |                    |             |
| external_id              | `text`        | YES      |                    |             |
| can_create_leads         | `boolean`     | YES      | true               |             |
| is_view_only             | `boolean`     | YES      | false              |             |
| allow_design_requests    | `boolean`     | YES      | true               |             |
| allow_manual_installs    | `boolean`     | YES      | true               |             |
| can_create_change_orders | `boolean`     | YES      | true               |             |
| can_reassign_leads       | `boolean`     | YES      | false              |             |
| sales_rep_license_number | `text`        | YES      |                    |             |
| license_state            | `text`        | YES      |                    |             |
| license_expiry           | `date`        | YES      |                    |             |
| status                   | `text`        | YES      | 'invited'          |             |
| last_login_at            | `timestamptz` | YES      |                    |             |
| invited_at               | `timestamptz` | YES      | now()              |             |
| activated_at             | `timestamptz` | YES      |                    |             |
| deactivated_at           | `timestamptz` | YES      |                    |             |
| created_at               | `timestamptz` | YES      | now()              |             |
| updated_at               | `timestamptz` | YES      | now()              |             |
| updated_by               | `uuid`        | YES      |                    |             |

### user_lender_credentials (14 cols)

| Column            | Type          | Nullable | Default           | FK        |
| ----------------- | ------------- | -------- | ----------------- | --------- |
| id                | `uuid`        | NO       | gen_random_uuid() |           |
| user_id           | `uuid`        | NO       |                   | → users   |
| lender_id         | `uuid`        | NO       |                   | → lenders |
| lender_username   | `text`        | YES      |                   |           |
| lender_email      | `text`        | YES      |                   |           |
| lender_rep_id     | `text`        | YES      |                   |           |
| is_verified       | `boolean`     | YES      | false             |           |
| verified_at       | `timestamptz` | YES      |                   |           |
| verified_by       | `uuid`        | YES      |                   | → users   |
| expires_at        | `timestamptz` | YES      |                   |           |
| extra_credentials | `jsonb`       | YES      | '{}'              |           |
| created_at        | `timestamptz` | YES      | now()             |           |
| updated_at        | `timestamptz` | YES      | now()             |           |
| updated_by        | `uuid`        | YES      |                   |           |

### user_integration_settings (7 cols)

| Column           | Type          | Nullable | Default           | FK      |
| ---------------- | ------------- | -------- | ----------------- | ------- |
| id               | `uuid`        | NO       | gen_random_uuid() |         |
| user_id          | `uuid`        | NO       |                   | → users |
| integration_type | `text`        | NO       |                   |         |
| settings         | `jsonb`       | NO       | '{}'              |         |
| created_at       | `timestamptz` | YES      | now()             |         |
| updated_at       | `timestamptz` | YES      | now()             |         |
| updated_by       | `uuid`        | YES      |                   |         |

## CRM Core

### contacts (44 cols)

| Column                 | Type          | Nullable | Default           | FK          |
| ---------------------- | ------------- | -------- | ----------------- | ----------- |
| id                     | `uuid`        | NO       | gen_random_uuid() |             |
| company_id             | `uuid`        | NO       |                   | → companies |
| first_name             | `text`        | NO       |                   |             |
| last_name              | `text`        | NO       |                   |             |
| email                  | `text`        | YES      |                   |             |
| phone                  | `text`        | YES      |                   |             |
| country_code           | `text`        | YES      | '+1'              |             |
| secondary_phone        | `text`        | YES      |                   |             |
| secondary_email        | `text`        | YES      |                   |             |
| address                | `text`        | YES      |                   |             |
| address2               | `text`        | YES      |                   |             |
| city                   | `text`        | YES      |                   |             |
| state                  | `text`        | YES      |                   |             |
| zip                    | `text`        | YES      |                   |             |
| latitude               | `numeric`     | YES      |                   |             |
| longitude              | `numeric`     | YES      |                   |             |
| building_sqft          | `integer`     | YES      |                   |             |
| roof_type              | `text`        | YES      |                   |             |
| roof_age               | `integer`     | YES      |                   |             |
| has_hoa                | `boolean`     | YES      | false             |             |
| hoa_name               | `text`        | YES      |                   |             |
| hoa_contact            | `text`        | YES      |                   |             |
| utility_company        | `text`        | YES      |                   |             |
| utility_account_number | `text`        | YES      |                   |             |
| monthly_electric_bill  | `numeric`     | YES      |                   |             |
| annual_usage_kwh       | `numeric`     | YES      |                   |             |
| monthly_usage_kwh      | `jsonb`       | YES      |                   |             |
| utility_rate_kwh       | `numeric`     | YES      |                   |             |
| utility_tariff_code    | `text`        | YES      |                   |             |
| utility_tariff_name    | `text`        | YES      |                   |             |
| genability_utility_id  | `integer`     | YES      |                   |             |
| genability_tariff_id   | `integer`     | YES      |                   |             |
| owner_id               | `uuid`        | YES      |                   | → users     |
| repcard_customer_id    | `integer`     | YES      |                   |             |
| repcard_status_id      | `integer`     | YES      |                   |             |
| external_id            | `text`        | YES      |                   |             |
| contact_type           | `text`        | YES      | 'lead'            |             |
| contact_source         | `text`        | YES      | 'repcard'         |             |
| deleted_at             | `timestamptz` | YES      |                   |             |
| deleted_by             | `uuid`        | YES      |                   | → users     |
| created_at             | `timestamptz` | YES      | now()             |             |
| updated_at             | `timestamptz` | YES      | now()             |             |
| updated_by             | `uuid`        | YES      |                   |             |
| repcard_status         | `text`        | YES      |                   |             |

### deals (95 cols)

| Column                      | Type          | Nullable | Default           | FK             |
| --------------------------- | ------------- | -------- | ----------------- | -------------- |
| id                          | `uuid`        | NO       | gen_random_uuid() |                |
| company_id                  | `uuid`        | NO       |                   | → companies    |
| contact_id                  | `uuid`        | NO       |                   | → contacts     |
| deal_number                 | `text`        | NO       |                   |                |
| setter_id                   | `uuid`        | YES      |                   | → users        |
| closer_id                   | `uuid`        | YES      |                   | → users        |
| office_id                   | `uuid`        | YES      |                   | → offices      |
| team_id                     | `uuid`        | YES      |                   | → teams        |
| stage                       | `text`        | NO       | 'new_lead'        |                |
| stage_changed_at            | `timestamptz` | YES      | now()             |                |
| active_proposal_id          | `uuid`        | YES      |                   | → proposals    |
| install_address             | `text`        | YES      |                   |                |
| install_address2            | `text`        | YES      |                   |                |
| install_city                | `text`        | YES      |                   |                |
| install_state               | `text`        | YES      |                   |                |
| install_zip                 | `text`        | YES      |                   |                |
| install_lat                 | `numeric`     | YES      |                   |                |
| install_lng                 | `numeric`     | YES      |                   |                |
| repcard_appointment_id      | `integer`     | YES      |                   |                |
| appointment_date            | `timestamptz` | YES      |                   |                |
| appointment_end             | `timestamptz` | YES      |                   |                |
| appointment_timezone        | `text`        | YES      |                   |                |
| appointment_location        | `text`        | YES      |                   |                |
| appointment_notes           | `text`        | YES      |                   |                |
| appointment_outcome         | `text`        | YES      |                   |                |
| appointment_outcome_id      | `integer`     | YES      |                   |                |
| system_size_kw              | `numeric`     | YES      |                   |                |
| panel_count                 | `integer`     | YES      |                   |                |
| panel_model                 | `text`        | YES      |                   |                |
| inverter_model              | `text`        | YES      |                   |                |
| battery_model               | `text`        | YES      |                   |                |
| battery_count               | `integer`     | YES      | 0                 |                |
| offset_percentage           | `numeric`     | YES      |                   |                |
| annual_production_kwh       | `numeric`     | YES      |                   |                |
| annual_usage_kwh            | `numeric`     | YES      |                   |                |
| mounting_type               | `text`        | YES      | 'roof'            |                |
| gross_price                 | `numeric`     | YES      |                   |                |
| adders_total                | `numeric`     | YES      | 0                 |                |
| net_price                   | `numeric`     | YES      |                   |                |
| gross_ppw                   | `numeric`     | YES      |                   |                |
| net_ppw                     | `numeric`     | YES      |                   |                |
| dealer_fee                  | `numeric`     | YES      |                   |                |
| dealer_fee_percentage       | `numeric`     | YES      |                   |                |
| commission_base             | `numeric`     | YES      |                   |                |
| lender_id                   | `uuid`        | YES      |                   | → lenders      |
| loan_product                | `text`        | YES      |                   |                |
| loan_amount                 | `numeric`     | YES      |                   |                |
| loan_term_months            | `integer`     | YES      |                   |                |
| interest_rate               | `numeric`     | YES      |                   |                |
| monthly_payment             | `numeric`     | YES      |                   |                |
| financing_status            | `text`        | YES      |                   |                |
| financing_application_id    | `text`        | YES      |                   |                |
| financing_approved_at       | `timestamptz` | YES      |                   |                |
| install_agreement_status    | `text`        | YES      | 'not_sent'        |                |
| install_agreement_signed_at | `timestamptz` | YES      |                   |                |
| submission_status           | `text`        | YES      | 'not_ready'       |                |
| submitted_at                | `timestamptz` | YES      |                   |                |
| submitted_by                | `uuid`        | YES      |                   | → users        |
| intake_reviewed_at          | `timestamptz` | YES      |                   |                |
| intake_reviewed_by          | `text`        | YES      |                   |                |
| rejection_reason            | `text`        | YES      |                   |                |
| aurora_project_id           | `text`        | YES      |                   |                |
| aurora_design_id            | `text`        | YES      |                   |                |
| quickbase_deal_id           | `text`        | YES      |                   |                |
| enerflo_deal_id             | `text`        | YES      |                   |                |
| enerflo_short_code          | `text`        | YES      |                   |                |
| source                      | `text`        | YES      | 'repcard'         |                |
| both_spouses_present        | `boolean`     | YES      |                   |                |
| is_new_construction         | `boolean`     | YES      | false             |                |
| is_battery_only             | `boolean`     | YES      | false             |                |
| is_commercial               | `boolean`     | YES      | false             |                |
| has_hoa                     | `boolean`     | YES      | false             |                |
| deleted_at                  | `timestamptz` | YES      |                   |                |
| deleted_by                  | `uuid`        | YES      |                   | → users        |
| created_at                  | `timestamptz` | YES      | now()             |                |
| updated_at                  | `timestamptz` | YES      | now()             |                |
| updated_by                  | `uuid`        | YES      |                   |                |
| active_appointment_id       | `uuid`        | YES      |                   | → appointments |
| aurora_design_request_id    | `text`        | YES      |                   |                |
| design_status               | `text`        | YES      | 'not_started'     |                |
| monthly_kwh                 | `jsonb`       | YES      |                   |                |
| annual_kwh                  | `numeric`     | YES      |                   |                |
| utility_company             | `text`        | YES      |                   |                |
| utility_tariff              | `text`        | YES      |                   |                |
| monthly_bill                | `numeric`     | YES      |                   |                |
| design_request_type         | `text`        | YES      |                   |                |
| design_requested_at         | `timestamptz` | YES      |                   |                |
| design_completed_at         | `timestamptz` | YES      |                   |                |
| design_request_notes        | `text`        | YES      |                   |                |
| target_offset               | `numeric`     | YES      | 105               |                |
| roof_material               | `text`        | YES      |                   |                |
| aurora_sales_mode_url       | `text`        | YES      |                   |                |
| aurora_proposal_id          | `text`        | YES      |                   |                |
| quickbase_record_id         | `text`        | YES      |                   |                |
| rejection_reasons           | `jsonb`       | YES      |                   |                |

### proposals (72 cols)

| Column                   | Type          | Nullable | Default           | FK                |
| ------------------------ | ------------- | -------- | ----------------- | ----------------- |
| id                       | `uuid`        | NO       | gen_random_uuid() |                   |
| deal_id                  | `uuid`        | NO       |                   | → deals           |
| name                     | `text`        | NO       |                   |                   |
| display_order            | `integer`     | YES      | 0                 |                   |
| aurora_design_id         | `text`        | YES      |                   |                   |
| design_name              | `text`        | YES      |                   |                   |
| system_size_kw           | `numeric`     | YES      |                   |                   |
| panel_count              | `integer`     | YES      |                   |                   |
| panel_model              | `text`        | YES      |                   |                   |
| panel_wattage            | `integer`     | YES      |                   |                   |
| inverter_model           | `text`        | YES      |                   |                   |
| annual_production_kwh    | `numeric`     | YES      |                   |                   |
| annual_consumption_kwh   | `numeric`     | YES      |                   |                   |
| offset_percentage        | `numeric`     | YES      |                   |                   |
| weighted_tsrf            | `numeric`     | YES      |                   |                   |
| mounting_type            | `text`        | YES      | 'roof'            |                   |
| monthly_consumption_kwh  | `jsonb`       | YES      |                   |                   |
| utility_name             | `text`        | YES      |                   |                   |
| utility_rate_kwh         | `numeric`     | YES      |                   |                   |
| post_solar_rate_kwh      | `numeric`     | YES      |                   |                   |
| base_price               | `numeric`     | YES      |                   |                   |
| base_ppw                 | `numeric`     | YES      |                   |                   |
| adder_total              | `numeric`     | YES      | 0                 |                   |
| adder_ppw                | `numeric`     | YES      | 0                 |                   |
| discount_total           | `numeric`     | YES      | 0                 |                   |
| equipment_cost           | `numeric`     | YES      | 0                 |                   |
| base_system_cost         | `numeric`     | YES      |                   |                   |
| base_system_ppw          | `numeric`     | YES      |                   |                   |
| dealer_fee_amount        | `numeric`     | YES      | 0                 |                   |
| dealer_fee_ppw           | `numeric`     | YES      | 0                 |                   |
| gross_cost               | `numeric`     | YES      |                   |                   |
| gross_ppw                | `numeric`     | YES      |                   |                   |
| rebate_total             | `numeric`     | YES      | 0                 |                   |
| net_cost                 | `numeric`     | YES      |                   |                   |
| net_ppw                  | `numeric`     | YES      |                   |                   |
| down_payment             | `numeric`     | YES      | 0                 |                   |
| finance_cost             | `numeric`     | YES      |                   |                   |
| tax_amount               | `numeric`     | YES      | 0                 |                   |
| federal_rebate_base      | `numeric`     | YES      |                   |                   |
| federal_rebate_amount    | `numeric`     | YES      | 0                 |                   |
| is_cost_override         | `boolean`     | YES      | false             |                   |
| original_base_ppw        | `numeric`     | YES      |                   |                   |
| override_gross_cost      | `numeric`     | YES      |                   |                   |
| lender_id                | `uuid`        | YES      |                   | → lenders         |
| lender_product_id        | `uuid`        | YES      |                   | → lender_products |
| financing_method         | `text`        | YES      |                   |                   |
| financing_product_name   | `text`        | YES      |                   |                   |
| monthly_payment          | `numeric`     | YES      |                   |                   |
| escalator_percent        | `numeric`     | YES      |                   |                   |
| rate_per_kwh             | `numeric`     | YES      |                   |                   |
| epc_rate                 | `numeric`     | YES      |                   |                   |
| epc_total                | `numeric`     | YES      |                   |                   |
| lender_actual_dealer_fee | `numeric`     | YES      |                   |                   |
| sales_facing_dealer_fee  | `numeric`     | YES      |                   |                   |
| kin_margin_on_fee        | `numeric`     | YES      |                   |                   |
| rep_lender_verified      | `boolean`     | YES      | false             |                   |
| commission_base          | `numeric`     | YES      |                   |                   |
| commission_ppw           | `numeric`     | YES      |                   |                   |
| status                   | `text`        | NO       | 'draft'           |                   |
| finalized_at             | `timestamptz` | YES      |                   |                   |
| finalized_by             | `uuid`        | YES      |                   | → users           |
| unfinalized_at           | `timestamptz` | YES      |                   |                   |
| unfinalized_by           | `uuid`        | YES      |                   | → users           |
| aurora_proposal_id       | `text`        | YES      |                   |                   |
| aurora_web_proposal_url  | `text`        | YES      |                   |                   |
| deleted_at               | `timestamptz` | YES      |                   |                   |
| deleted_by               | `uuid`        | YES      |                   | → users           |
| created_at               | `timestamptz` | YES      | now()             |                   |
| updated_at               | `timestamptz` | YES      | now()             |                   |
| updated_by               | `uuid`        | YES      |                   |                   |
| is_goal_seek             | `boolean`     | YES      | false             |                   |
| goal_seek_target_gross   | `numeric`     | YES      |                   |                   |

### proposal_arrays (20 cols)

| Column                | Type          | Nullable | Default           | FK          |
| --------------------- | ------------- | -------- | ----------------- | ----------- |
| id                    | `uuid`        | NO       | gen_random_uuid() |             |
| proposal_id           | `uuid`        | NO       |                   | → proposals |
| array_index           | `integer`     | NO       |                   |             |
| module_name           | `text`        | YES      |                   |             |
| module_model          | `text`        | YES      |                   |             |
| module_manufacturer   | `text`        | YES      |                   |             |
| module_wattage        | `integer`     | YES      |                   |             |
| module_count          | `integer`     | NO       |                   |             |
| pitch                 | `numeric`     | YES      |                   |             |
| azimuth               | `numeric`     | YES      |                   |             |
| roof_plane_index      | `integer`     | YES      |                   |             |
| panel_orientation     | `text`        | YES      |                   |             |
| inverter_index        | `integer`     | YES      |                   |             |
| tof                   | `numeric`     | YES      |                   |             |
| tsrf                  | `numeric`     | YES      |                   |             |
| solar_access          | `numeric`     | YES      |                   |             |
| solar_access_by_month | `jsonb`       | YES      |                   |             |
| aurora_module_id      | `text`        | YES      |                   |             |
| aurora_inverter_id    | `text`        | YES      |                   |             |
| created_at            | `timestamptz` | YES      | now()             |             |

### proposal_adders (17 cols)

| Column             | Type          | Nullable | Default           | FK                |
| ------------------ | ------------- | -------- | ----------------- | ----------------- |
| id                 | `uuid`        | NO       | gen_random_uuid() |                   |
| proposal_id        | `uuid`        | NO       |                   | → proposals       |
| adder_template_id  | `uuid`        | YES      |                   | → adder_templates |
| name               | `text`        | NO       |                   |                   |
| pricing_type       | `text`        | NO       |                   |                   |
| amount             | `numeric`     | NO       |                   |                   |
| quantity           | `integer`     | YES      | 1                 |                   |
| total              | `numeric`     | NO       |                   |                   |
| ppw                | `numeric`     | YES      |                   |                   |
| is_auto_applied    | `boolean`     | YES      | false             |                   |
| is_customer_facing | `boolean`     | YES      | true              |                   |
| eligible_for_itc   | `boolean`     | YES      | false             |                   |
| dynamic_inputs     | `jsonb`       | YES      | '{}'              |                   |
| aurora_adder_id    | `text`        | YES      |                   |                   |
| created_at         | `timestamptz` | YES      | now()             |                   |
| tier_selection     | `text`        | YES      |                   |                   |
| custom_amount      | `numeric`     | YES      |                   |                   |

### proposal_discounts (9 cols)

| Column             | Type          | Nullable | Default           | FK          |
| ------------------ | ------------- | -------- | ----------------- | ----------- |
| id                 | `uuid`        | NO       | gen_random_uuid() |             |
| proposal_id        | `uuid`        | NO       |                   | → proposals |
| name               | `text`        | NO       |                   |             |
| discount_type      | `text`        | NO       |                   |             |
| amount             | `numeric`     | NO       |                   |             |
| total              | `numeric`     | NO       |                   |             |
| ppw                | `numeric`     | YES      |                   |             |
| is_customer_facing | `boolean`     | YES      | true              |             |
| created_at         | `timestamptz` | YES      | now()             |             |

### deal_adders (11 cols)

| Column            | Type          | Nullable | Default           | FK                |
| ----------------- | ------------- | -------- | ----------------- | ----------------- |
| id                | `uuid`        | NO       | gen_random_uuid() |                   |
| deal_id           | `uuid`        | NO       |                   | → deals           |
| adder_template_id | `uuid`        | YES      |                   | → adder_templates |
| name              | `text`        | NO       |                   |                   |
| amount            | `numeric`     | NO       |                   |                   |
| pricing_type      | `text`        | NO       | 'fixed_amount'    |                   |
| quantity          | `integer`     | YES      | 1                 |                   |
| total             | `numeric`     | NO       |                   |                   |
| notes             | `text`        | YES      |                   |                   |
| added_by          | `uuid`        | YES      |                   | → users           |
| created_at        | `timestamptz` | YES      | now()             |                   |

## Tags

### tags (5 cols)

| Column     | Type          | Nullable | Default           | FK          |
| ---------- | ------------- | -------- | ----------------- | ----------- |
| id         | `uuid`        | NO       | gen_random_uuid() |             |
| company_id | `uuid`        | NO       |                   | → companies |
| name       | `text`        | NO       |                   |             |
| color      | `text`        | YES      | '#6B7280'         |             |
| created_at | `timestamptz` | YES      | now()             |             |

### deal_tags (4 cols)

| Column     | Type          | Nullable | Default | FK      |
| ---------- | ------------- | -------- | ------- | ------- |
| deal_id    | `uuid`        | NO       |         | → deals |
| tag_id     | `uuid`        | NO       |         | → tags  |
| added_by   | `uuid`        | YES      |         | → users |
| created_at | `timestamptz` | YES      | now()   |         |

## Appointments

### appointments (24 cols)

| Column                 | Type          | Nullable | Default            | FK          |
| ---------------------- | ------------- | -------- | ------------------ | ----------- |
| id                     | `uuid`        | NO       | gen_random_uuid()  |             |
| company_id             | `uuid`        | NO       |                    | → companies |
| contact_id             | `uuid`        | NO       |                    | → contacts  |
| deal_id                | `uuid`        | YES      |                    | → deals     |
| repcard_appointment_id | `integer`     | YES      |                    |             |
| closer_id              | `uuid`        | YES      |                    | → users     |
| setter_id              | `uuid`        | YES      |                    | → users     |
| scheduled_start        | `timestamptz` | NO       |                    |             |
| scheduled_end          | `timestamptz` | YES      |                    |             |
| timezone               | `text`        | YES      | 'America/New_York' |             |
| duration_minutes       | `integer`     | YES      | 60                 |             |
| location               | `text`        | YES      |                    |             |
| status                 | `text`        | NO       | 'scheduled'        |             |
| outcome                | `text`        | YES      |                    |             |
| outcome_id             | `integer`     | YES      |                    |             |
| outcome_notes          | `text`        | YES      |                    |             |
| notes                  | `text`        | YES      |                    |             |
| repcard_attachments    | `jsonb`       | YES      | '[]'               |             |
| appointment_type       | `text`        | YES      | 'in_home'          |             |
| is_active              | `boolean`     | YES      | true               |             |
| created_at             | `timestamptz` | YES      | now()              |             |
| updated_at             | `timestamptz` | YES      | now()              |             |
| created_by             | `uuid`        | YES      |                    | → users     |
| updated_by             | `uuid`        | YES      |                    | → users     |

## Equipment

### equipment (20 cols)

| Column                | Type          | Nullable | Default           | FK          |
| --------------------- | ------------- | -------- | ----------------- | ----------- |
| id                    | `uuid`        | NO       | gen_random_uuid() |             |
| company_id            | `uuid`        | NO       |                   | → companies |
| category              | `text`        | NO       |                   |             |
| name                  | `text`        | NO       |                   |             |
| manufacturer          | `text`        | NO       |                   |             |
| model                 | `text`        | NO       |                   |             |
| wattage               | `integer`     | YES      |                   |             |
| efficiency            | `numeric`     | YES      |                   |             |
| degradation_rate      | `numeric`     | YES      |                   |             |
| specifications        | `jsonb`       | YES      | '{}'              |             |
| cost_per_unit         | `numeric`     | YES      |                   |             |
| cost_per_watt         | `numeric`     | YES      |                   |             |
| msrp                  | `numeric`     | YES      |                   |             |
| aurora_component_id   | `text`        | YES      |                   |             |
| aurora_component_name | `text`        | YES      |                   |             |
| status                | `text`        | YES      | 'active'          |             |
| archived_at           | `timestamptz` | YES      |                   |             |
| created_at            | `timestamptz` | YES      | now()             |             |
| updated_at            | `timestamptz` | YES      | now()             |             |
| updated_by            | `uuid`        | YES      |                   |             |

### equipment_market_availability (8 cols)

| Column                 | Type          | Nullable | Default           | FK                  |
| ---------------------- | ------------- | -------- | ----------------- | ------------------- |
| id                     | `uuid`        | NO       | gen_random_uuid() |                     |
| equipment_id           | `uuid`        | NO       |                   | → equipment         |
| installer_market_id    | `uuid`        | NO       |                   | → installer_markets |
| is_default             | `boolean`     | YES      | false             |                     |
| is_available           | `boolean`     | YES      | true              |                     |
| override_cost_per_unit | `numeric`     | YES      |                   |                     |
| override_cost_per_watt | `numeric`     | YES      |                   |                     |
| created_at             | `timestamptz` | YES      | now()             |                     |

## Financing

### financing_applications (23 cols)

| Column                  | Type          | Nullable | Default           | FK                |
| ----------------------- | ------------- | -------- | ----------------- | ----------------- |
| id                      | `uuid`        | NO       | gen_random_uuid() |                   |
| deal_id                 | `uuid`        | NO       |                   | → deals           |
| proposal_id             | `uuid`        | YES      |                   | → proposals       |
| lender_id               | `uuid`        | NO       |                   | → lenders         |
| lender_product_id       | `uuid`        | YES      |                   | → lender_products |
| external_application_id | `text`        | YES      |                   |                   |
| application_url         | `text`        | YES      |                   |                   |
| loan_amount             | `numeric`     | YES      |                   |                   |
| status                  | `text`        | NO       | 'draft'           |                   |
| status_changed_at       | `timestamptz` | YES      | now()             |                   |
| approved_amount         | `numeric`     | YES      |                   |                   |
| approved_rate           | `numeric`     | YES      |                   |                   |
| approved_term_months    | `integer`     | YES      |                   |                   |
| denial_reason           | `text`        | YES      |                   |                   |
| conditions              | `text`        | YES      |                   |                   |
| stips                   | `jsonb`       | YES      | '[]'              |                   |
| submitted_at            | `timestamptz` | YES      |                   |                   |
| submitted_by            | `uuid`        | YES      |                   | → users           |
| decision_at             | `timestamptz` | YES      |                   |                   |
| deleted_at              | `timestamptz` | YES      |                   |                   |
| created_at              | `timestamptz` | YES      | now()             |                   |
| updated_at              | `timestamptz` | YES      | now()             |                   |
| updated_by              | `uuid`        | YES      |                   |                   |

### financing_status_history (8 cols)

| Column                   | Type          | Nullable | Default           | FK                       |
| ------------------------ | ------------- | -------- | ----------------- | ------------------------ |
| id                       | `uuid`        | NO       | gen_random_uuid() |                          |
| financing_application_id | `uuid`        | NO       |                   | → financing_applications |
| from_status              | `text`        | YES      |                   |                          |
| to_status                | `text`        | NO       |                   |                          |
| changed_by               | `uuid`        | YES      |                   | → users                  |
| notes                    | `text`        | YES      |                   |                          |
| metadata                 | `jsonb`       | YES      | '{}'              |                          |
| created_at               | `timestamptz` | YES      | now()             |                          |

## Lenders

### lenders (14 cols)

| Column          | Type          | Nullable | Default           | FK          |
| --------------- | ------------- | -------- | ----------------- | ----------- |
| id              | `uuid`        | NO       | gen_random_uuid() |             |
| company_id      | `uuid`        | NO       |                   | → companies |
| name            | `text`        | NO       |                   |             |
| slug            | `text`        | NO       |                   |             |
| lender_type     | `text`        | NO       |                   |             |
| logo_url        | `text`        | YES      |                   |             |
| api_endpoint    | `text`        | YES      |                   |             |
| api_credentials | `jsonb`       | YES      | '{}'              |             |
| settings        | `jsonb`       | YES      | '{}'              |             |
| display_order   | `integer`     | YES      | 0                 |             |
| is_active       | `boolean`     | YES      | true              |             |
| created_at      | `timestamptz` | YES      | now()             |             |
| updated_at      | `timestamptz` | YES      | now()             |             |
| updated_by      | `uuid`        | YES      |                   |             |

### lender_products (28 cols)

| Column                   | Type          | Nullable | Default           | FK        |
| ------------------------ | ------------- | -------- | ----------------- | --------- |
| id                       | `uuid`        | NO       | gen_random_uuid() |           |
| lender_id                | `uuid`        | NO       |                   | → lenders |
| name                     | `text`        | NO       |                   |           |
| product_code             | `text`        | YES      |                   |           |
| term_months              | `integer`     | YES      |                   |           |
| interest_rate            | `numeric`     | YES      |                   |           |
| apr                      | `numeric`     | YES      |                   |           |
| escalator_percent        | `numeric`     | YES      |                   |           |
| dealer_fee_percent       | `numeric`     | YES      |                   |           |
| dealer_fee_min           | `numeric`     | YES      |                   |           |
| dealer_fee_max           | `numeric`     | YES      |                   |           |
| sales_facing_fee_percent | `numeric`     | YES      |                   |           |
| kin_margin_percent       | `numeric`     | YES      |                   |           |
| tpo_available_rates      | `jsonb`       | YES      |                   |           |
| tpo_payment_input_mode   | `text`        | YES      |                   |           |
| allowed_adder_categories | `jsonb`       | YES      | '[]'              |           |
| equipment_pricing_mode   | `text`        | YES      | 'standard'        |           |
| available_states         | `ARRAY`       | YES      |                   |           |
| min_fico                 | `integer`     | YES      |                   |           |
| min_system_size_kw       | `numeric`     | YES      |                   |           |
| max_system_size_kw       | `numeric`     | YES      |                   |           |
| min_loan_amount          | `numeric`     | YES      |                   |           |
| max_loan_amount          | `numeric`     | YES      |                   |           |
| display_order            | `integer`     | YES      | 0                 |           |
| is_active                | `boolean`     | YES      | true              |           |
| created_at               | `timestamptz` | YES      | now()             |           |
| updated_at               | `timestamptz` | YES      | now()             |           |
| updated_by               | `uuid`        | YES      |                   |           |

## Pricing

### installer_markets (9 cols)

| Column     | Type          | Nullable | Default           | FK          |
| ---------- | ------------- | -------- | ----------------- | ----------- |
| id         | `uuid`        | NO       | gen_random_uuid() |             |
| company_id | `uuid`        | NO       |                   | → companies |
| name       | `text`        | NO       |                   |             |
| state      | `text`        | NO       |                   |             |
| region     | `text`        | YES      |                   |             |
| is_active  | `boolean`     | YES      | true              |             |
| created_at | `timestamptz` | YES      | now()             |             |
| updated_at | `timestamptz` | YES      | now()             |             |
| updated_by | `uuid`        | YES      |                   |             |

### pricing_configs (22 cols)

| Column              | Type          | Nullable | Default           | FK                  |
| ------------------- | ------------- | -------- | ----------------- | ------------------- |
| id                  | `uuid`        | NO       | gen_random_uuid() |                     |
| company_id          | `uuid`        | NO       |                   | → companies         |
| installer_market_id | `uuid`        | YES      |                   | → installer_markets |
| name                | `text`        | NO       |                   |                     |
| base_ppw            | `numeric`     | YES      |                   |                     |
| min_ppw             | `numeric`     | YES      |                   |                     |
| max_ppw             | `numeric`     | YES      |                   |                     |
| buffer_amount       | `numeric`     | YES      | 0                 |                     |
| buffer_ppw          | `numeric`     | YES      | 0                 |                     |
| state_tax_rate      | `numeric`     | YES      | 0                 |                     |
| allow_cost_override | `boolean`     | YES      | false             |                     |
| override_min_ppw    | `numeric`     | YES      |                   |                     |
| override_max_ppw    | `numeric`     | YES      |                   |                     |
| ppw_adjustments     | `jsonb`       | YES      | '[]'              |                     |
| rounding_scale      | `integer`     | YES      | 2                 |                     |
| rounding_mode       | `text`        | YES      | 'ROUND_HALF_UP'   |                     |
| min_panel_count     | `integer`     | YES      | 7                 |                     |
| is_active           | `boolean`     | YES      | true              |                     |
| created_at          | `timestamptz` | YES      | now()             |                     |
| updated_at          | `timestamptz` | YES      | now()             |                     |
| updated_by          | `uuid`        | YES      |                   |                     |
| office_id           | `uuid`        | YES      |                   | → offices           |

### adder_templates (23 cols)

| Column                    | Type          | Nullable | Default           | FK          |
| ------------------------- | ------------- | -------- | ----------------- | ----------- |
| id                        | `uuid`        | NO       | gen_random_uuid() |             |
| company_id                | `uuid`        | NO       |                   | → companies |
| name                      | `text`        | NO       |                   |             |
| description               | `text`        | YES      |                   |             |
| category                  | `text`        | YES      |                   |             |
| pricing_type              | `text`        | NO       |                   |             |
| default_amount            | `numeric`     | YES      |                   |             |
| min_amount                | `numeric`     | YES      |                   |             |
| max_amount                | `numeric`     | YES      |                   |             |
| is_customer_facing        | `boolean`     | YES      | true              |             |
| eligible_for_itc          | `boolean`     | YES      | false             |             |
| requires_approval         | `boolean`     | YES      | false             |             |
| dynamic_input_definitions | `jsonb`       | YES      | '[]'              |             |
| pricing_model             | `jsonb`       | YES      | '{}'              |             |
| auto_apply_conditions     | `jsonb`       | YES      | '{}'              |             |
| display_order             | `integer`     | YES      | 0                 |             |
| is_active                 | `boolean`     | YES      | true              |             |
| created_at                | `timestamptz` | YES      | now()             |             |
| updated_at                | `timestamptz` | YES      | now()             |             |
| updated_by                | `uuid`        | YES      |                   |             |
| pricing_tiers             | `jsonb`       | YES      |                   |             |
| is_manual_toggle          | `boolean`     | YES      | true              |             |
| is_auto_apply             | `boolean`     | YES      | false             |             |

### adder_scope_rules (6 cols)

| Column            | Type          | Nullable | Default           | FK                |
| ----------------- | ------------- | -------- | ----------------- | ----------------- |
| id                | `uuid`        | NO       | gen_random_uuid() |                   |
| adder_template_id | `uuid`        | NO       |                   | → adder_templates |
| rule_type         | `text`        | NO       |                   |                   |
| rule_value        | `text`        | NO       |                   |                   |
| is_inclusion      | `boolean`     | YES      | true              |                   |
| created_at        | `timestamptz` | YES      | now()             |                   |

## Documents

### document_templates (14 cols)

| Column               | Type          | Nullable | Default           | FK          |
| -------------------- | ------------- | -------- | ----------------- | ----------- |
| id                   | `uuid`        | NO       | gen_random_uuid() |             |
| company_id           | `uuid`        | NO       |                   | → companies |
| name                 | `text`        | NO       |                   |             |
| description          | `text`        | YES      |                   |             |
| provider             | `text`        | YES      | 'pandadoc'        |             |
| provider_template_id | `text`        | NO       |                   |             |
| merge_field_mapping  | `jsonb`       | YES      | '{}'              |             |
| document_type        | `text`        | NO       |                   |             |
| required_for_stages  | `ARRAY`       | YES      | '{}'[]            |             |
| display_order        | `integer`     | YES      | 0                 |             |
| is_active            | `boolean`     | YES      | true              |             |
| created_at           | `timestamptz` | YES      | now()             |             |
| updated_at           | `timestamptz` | YES      | now()             |             |
| updated_by           | `uuid`        | YES      |                   |             |

### document_envelopes (19 cols)

| Column               | Type          | Nullable | Default           | FK                   |
| -------------------- | ------------- | -------- | ----------------- | -------------------- |
| id                   | `uuid`        | NO       | gen_random_uuid() |                      |
| deal_id              | `uuid`        | NO       |                   | → deals              |
| template_id          | `uuid`        | YES      |                   | → document_templates |
| provider             | `text`        | NO       |                   |                      |
| provider_document_id | `text`        | YES      |                   |                      |
| provider_envelope_id | `text`        | YES      |                   |                      |
| title                | `text`        | NO       |                   |                      |
| status               | `text`        | NO       | 'created'         |                      |
| status_changed_at    | `timestamptz` | YES      | now()             |                      |
| sent_at              | `timestamptz` | YES      |                   |                      |
| viewed_at            | `timestamptz` | YES      |                   |                      |
| signed_at            | `timestamptz` | YES      |                   |                      |
| signed_document_url  | `text`        | YES      |                   |                      |
| signers              | `jsonb`       | YES      | '[]'              |                      |
| merge_data           | `jsonb`       | YES      | '{}'              |                      |
| deleted_at           | `timestamptz` | YES      |                   |                      |
| created_at           | `timestamptz` | YES      | now()             |                      |
| updated_at           | `timestamptz` | YES      | now()             |                      |
| updated_by           | `uuid`        | YES      |                   |                      |

## Gates & Workflow

### gate_definitions (13 cols)

| Column             | Type          | Nullable | Default           | FK          |
| ------------------ | ------------- | -------- | ----------------- | ----------- |
| id                 | `uuid`        | NO       | gen_random_uuid() |             |
| company_id         | `uuid`        | NO       |                   | → companies |
| name               | `text`        | NO       |                   |             |
| description        | `text`        | YES      |                   |             |
| gate_type          | `text`        | NO       |                   |             |
| required_for_stage | `text`        | NO       |                   |             |
| conditions         | `jsonb`       | YES      | '{}'              |             |
| display_order      | `integer`     | YES      | 0                 |             |
| is_required        | `boolean`     | YES      | true              |             |
| is_active          | `boolean`     | YES      | true              |             |
| created_at         | `timestamptz` | YES      | now()             |             |
| updated_at         | `timestamptz` | YES      | now()             |             |
| updated_by         | `uuid`        | YES      |                   |             |

### gate_completions (12 cols)

| Column             | Type          | Nullable | Default           | FK                 |
| ------------------ | ------------- | -------- | ----------------- | ------------------ |
| id                 | `uuid`        | NO       | gen_random_uuid() |                    |
| deal_id            | `uuid`        | NO       |                   | → deals            |
| gate_definition_id | `uuid`        | NO       |                   | → gate_definitions |
| is_complete        | `boolean`     | YES      | false             |                    |
| completed_at       | `timestamptz` | YES      |                   |                    |
| completed_by       | `uuid`        | YES      |                   | → users            |
| approved_by        | `uuid`        | YES      |                   | → users            |
| notes              | `text`        | YES      |                   |                    |
| metadata           | `jsonb`       | YES      | '{}'              |                    |
| value              | `text`        | YES      |                   |                    |
| created_at         | `timestamptz` | YES      | now()             |                    |
| updated_at         | `timestamptz` | YES      | now()             |                    |

### workflow_step_definitions (14 cols)

| Column                | Type          | Nullable | Default           | FK          |
| --------------------- | ------------- | -------- | ----------------- | ----------- |
| id                    | `uuid`        | NO       | gen_random_uuid() |             |
| company_id            | `uuid`        | NO       |                   | → companies |
| name                  | `text`        | NO       |                   |             |
| slug                  | `text`        | NO       |                   |             |
| description           | `text`        | YES      |                   |             |
| step_type             | `text`        | NO       |                   |             |
| config                | `jsonb`       | YES      | '{}'              |             |
| is_required           | `boolean`     | YES      | true              |             |
| is_blocking           | `boolean`     | YES      | true              |             |
| display_order         | `integer`     | NO       |                   |             |
| applies_to_deal_types | `ARRAY`       | YES      | '{}'[]            |             |
| is_active             | `boolean`     | YES      | true              |             |
| created_at            | `timestamptz` | YES      | now()             |             |
| updated_at            | `timestamptz` | YES      | now()             |             |

### deal_workflow_progress (9 cols)

| Column             | Type          | Nullable | Default           | FK                          |
| ------------------ | ------------- | -------- | ----------------- | --------------------------- |
| id                 | `uuid`        | NO       | gen_random_uuid() |                             |
| deal_id            | `uuid`        | NO       |                   | → deals                     |
| step_definition_id | `uuid`        | NO       |                   | → workflow_step_definitions |
| status             | `text`        | NO       | 'not_started'     |                             |
| completed_at       | `timestamptz` | YES      |                   |                             |
| completed_by       | `uuid`        | YES      |                   | → users                     |
| data               | `jsonb`       | YES      | '{}'              |                             |
| created_at         | `timestamptz` | YES      | now()             |                             |
| updated_at         | `timestamptz` | YES      | now()             |                             |

## Files

### attachments (15 cols)

| Column                | Type          | Nullable | Default           | FK         |
| --------------------- | ------------- | -------- | ----------------- | ---------- |
| id                    | `uuid`        | NO       | gen_random_uuid() |            |
| deal_id               | `uuid`        | YES      |                   | → deals    |
| contact_id            | `uuid`        | YES      |                   | → contacts |
| uploaded_by           | `uuid`        | YES      |                   | → users    |
| file_name             | `text`        | NO       |                   |            |
| file_url              | `text`        | NO       |                   |            |
| file_size             | `integer`     | YES      |                   |            |
| mime_type             | `text`        | YES      |                   |            |
| category              | `text`        | YES      |                   |            |
| enerflo_file_id       | `text`        | YES      |                   |            |
| repcard_attachment_id | `text`        | YES      |                   |            |
| deleted_at            | `timestamptz` | YES      |                   |            |
| deleted_by            | `uuid`        | YES      |                   | → users    |
| created_at            | `timestamptz` | YES      | now()             |            |
| updated_at            | `timestamptz` | YES      | now()             |            |

## Notes

### notes (14 cols)

| Column     | Type          | Nullable | Default           | FK         |
| ---------- | ------------- | -------- | ----------------- | ---------- |
| id         | `uuid`        | NO       | gen_random_uuid() |            |
| deal_id    | `uuid`        | YES      |                   | → deals    |
| contact_id | `uuid`        | YES      |                   | → contacts |
| author_id  | `uuid`        | NO       |                   | → users    |
| content    | `text`        | NO       |                   |            |
| is_pinned  | `boolean`     | YES      | false             |            |
| visibility | `text`        | YES      | 'team'            |            |
| edited_at  | `timestamptz` | YES      |                   |            |
| edit_count | `integer`     | YES      | 0                 |            |
| deleted_at | `timestamptz` | YES      |                   |            |
| deleted_by | `uuid`        | YES      |                   | → users    |
| created_at | `timestamptz` | YES      | now()             |            |
| updated_at | `timestamptz` | YES      | now()             |            |
| updated_by | `uuid`        | YES      |                   |            |

### note_edits (5 cols)

| Column           | Type          | Nullable | Default           | FK      |
| ---------------- | ------------- | -------- | ----------------- | ------- |
| id               | `uuid`        | NO       | gen_random_uuid() |         |
| note_id          | `uuid`        | NO       |                   | → notes |
| previous_content | `text`        | NO       |                   |         |
| edited_by        | `uuid`        | NO       |                   | → users |
| created_at       | `timestamptz` | YES      | now()             |         |

## Communications

### communication_log (19 cols)

| Column        | Type          | Nullable | Default           | FK          |
| ------------- | ------------- | -------- | ----------------- | ----------- |
| id            | `uuid`        | NO       | gen_random_uuid() |             |
| company_id    | `uuid`        | NO       |                   | → companies |
| deal_id       | `uuid`        | YES      |                   | → deals     |
| contact_id    | `uuid`        | YES      |                   | → contacts  |
| channel       | `text`        | NO       |                   |             |
| direction     | `text`        | NO       | 'outbound'        |             |
| subject       | `text`        | YES      |                   |             |
| body          | `text`        | YES      |                   |             |
| from_user_id  | `uuid`        | YES      |                   | → users     |
| to_phone      | `text`        | YES      |                   |             |
| to_email      | `text`        | YES      |                   |             |
| status        | `text`        | YES      | 'pending'         |             |
| external_id   | `text`        | YES      |                   |             |
| provider      | `text`        | YES      |                   |             |
| error_message | `text`        | YES      |                   |             |
| sent_at       | `timestamptz` | YES      |                   |             |
| delivered_at  | `timestamptz` | YES      |                   |             |
| opened_at     | `timestamptz` | YES      |                   |             |
| created_at    | `timestamptz` | YES      | now()             |             |

## History & Audit

### deal_stage_history (8 cols)

| Column     | Type          | Nullable | Default           | FK      |
| ---------- | ------------- | -------- | ----------------- | ------- |
| id         | `uuid`        | NO       | gen_random_uuid() |         |
| deal_id    | `uuid`        | NO       |                   | → deals |
| from_stage | `text`        | YES      |                   |         |
| to_stage   | `text`        | NO       |                   |         |
| changed_by | `uuid`        | YES      |                   | → users |
| notes      | `text`        | YES      |                   |         |
| metadata   | `jsonb`       | YES      | '{}'              |         |
| created_at | `timestamptz` | YES      | now()             |         |

### deal_assignment_history (10 cols)

| Column          | Type          | Nullable | Default           | FK      |
| --------------- | ------------- | -------- | ----------------- | ------- |
| id              | `uuid`        | NO       | gen_random_uuid() |         |
| deal_id         | `uuid`        | NO       |                   | → deals |
| assignment_type | `text`        | NO       |                   |         |
| from_user_id    | `uuid`        | YES      |                   | → users |
| to_user_id      | `uuid`        | YES      |                   | → users |
| from_entity_id  | `uuid`        | YES      |                   |         |
| to_entity_id    | `uuid`        | YES      |                   |         |
| changed_by      | `uuid`        | YES      |                   | → users |
| reason          | `text`        | YES      |                   |         |
| created_at      | `timestamptz` | YES      | now()             |         |

### contact_change_history (8 cols)

| Column        | Type          | Nullable | Default           | FK         |
| ------------- | ------------- | -------- | ----------------- | ---------- |
| id            | `uuid`        | NO       | gen_random_uuid() |            |
| contact_id    | `uuid`        | NO       |                   | → contacts |
| field_name    | `text`        | NO       |                   |            |
| old_value     | `text`        | YES      |                   |            |
| new_value     | `text`        | YES      |                   |            |
| changed_by    | `uuid`        | YES      |                   | → users    |
| change_source | `text`        | YES      | 'user'            |            |
| created_at    | `timestamptz` | YES      | now()             |            |

### deal_snapshots (8 cols)

| Column             | Type          | Nullable | Default           | FK          |
| ------------------ | ------------- | -------- | ----------------- | ----------- |
| id                 | `uuid`        | NO       | gen_random_uuid() |             |
| deal_id            | `uuid`        | NO       |                   | → deals     |
| snapshot_type      | `text`        | NO       |                   |             |
| snapshot_data      | `jsonb`       | NO       |                   |             |
| submission_attempt | `integer`     | NO       | 1                 |             |
| proposal_id        | `uuid`        | YES      |                   | → proposals |
| created_by         | `uuid`        | YES      |                   | → users     |
| created_at         | `timestamptz` | YES      | now()             |             |

### audit_log (9 cols)

| Column     | Type          | Nullable | Default           | FK      |
| ---------- | ------------- | -------- | ----------------- | ------- |
| id         | `uuid`        | NO       | gen_random_uuid() |         |
| table_name | `text`        | NO       |                   |         |
| record_id  | `uuid`        | NO       |                   |         |
| action     | `text`        | NO       |                   |         |
| changes    | `jsonb`       | NO       | '{}'              |         |
| changed_by | `uuid`        | YES      |                   | → users |
| ip_address | `inet`        | YES      |                   |         |
| user_agent | `text`        | YES      |                   |         |
| created_at | `timestamptz` | YES      | now()             |         |

## Integrations

### webhook_events (12 cols)

| Column             | Type          | Nullable | Default           | FK         |
| ------------------ | ------------- | -------- | ----------------- | ---------- |
| id                 | `uuid`        | NO       | gen_random_uuid() |            |
| source             | `text`        | NO       |                   |            |
| event_type         | `text`        | NO       |                   |            |
| payload            | `jsonb`       | NO       |                   |            |
| headers            | `jsonb`       | YES      | '{}'              |            |
| status             | `text`        | YES      | 'received'        |            |
| error_message      | `text`        | YES      |                   |            |
| processed_at       | `timestamptz` | YES      |                   |            |
| related_deal_id    | `uuid`        | YES      |                   | → deals    |
| related_contact_id | `uuid`        | YES      |                   | → contacts |
| retry_count        | `integer`     | YES      | 0                 |            |
| created_at         | `timestamptz` | YES      | now()             |            |

### integration_sync_log (11 cols)

| Column           | Type          | Nullable | Default           | FK  |
| ---------------- | ------------- | -------- | ----------------- | --- |
| id               | `uuid`        | NO       | gen_random_uuid() |     |
| target           | `text`        | NO       |                   |     |
| action           | `text`        | NO       |                   |     |
| entity_type      | `text`        | YES      |                   |     |
| entity_id        | `uuid`        | YES      |                   |     |
| request_payload  | `jsonb`       | YES      |                   |     |
| response_payload | `jsonb`       | YES      |                   |     |
| status           | `text`        | YES      | 'pending'         |     |
| error_message    | `text`        | YES      |                   |     |
| retry_count      | `integer`     | YES      | 0                 |     |
| created_at       | `timestamptz` | YES      | now()             |     |

### aurora_pricing_syncs (9 cols)

| Column            | Type          | Nullable | Default           | FK      |
| ----------------- | ------------- | -------- | ----------------- | ------- |
| id                | `uuid`        | NO       | gen_random_uuid() |         |
| deal_id           | `uuid`        | NO       |                   | → deals |
| aurora_project_id | `text`        | NO       |                   |         |
| sync_type         | `text`        | NO       |                   |         |
| request_data      | `jsonb`       | YES      |                   |         |
| response_data     | `jsonb`       | YES      |                   |         |
| status            | `text`        | YES      | 'pending'         |         |
| error_message     | `text`        | YES      |                   |         |
| created_at        | `timestamptz` | YES      | now()             |         |

### repcard_sync_state (8 cols)

| Column           | Type          | Nullable | Default           | FK          |
| ---------------- | ------------- | -------- | ----------------- | ----------- |
| id               | `uuid`        | NO       | gen_random_uuid() |             |
| company_id       | `uuid`        | NO       |                   | → companies |
| entity_type      | `text`        | NO       |                   |             |
| last_sync_at     | `timestamptz` | YES      |                   |             |
| last_sync_status | `text`        | YES      |                   |             |
| last_cursor      | `text`        | YES      |                   |             |
| error_count      | `integer`     | YES      | 0                 |             |
| metadata         | `jsonb`       | YES      | '{}'              |             |

## Activity & Notifications

### activities (9 cols)

| Column        | Type          | Nullable | Default           | FK         |
| ------------- | ------------- | -------- | ----------------- | ---------- |
| id            | `uuid`        | NO       | gen_random_uuid() |            |
| deal_id       | `uuid`        | YES      |                   | → deals    |
| contact_id    | `uuid`        | YES      |                   | → contacts |
| user_id       | `uuid`        | YES      |                   | → users    |
| activity_type | `text`        | NO       |                   |            |
| title         | `text`        | NO       |                   |            |
| description   | `text`        | YES      |                   |            |
| metadata      | `jsonb`       | YES      | '{}'              |            |
| created_at    | `timestamptz` | YES      | now()             |            |

### notifications (10 cols)

| Column     | Type          | Nullable | Default           | FK      |
| ---------- | ------------- | -------- | ----------------- | ------- |
| id         | `uuid`        | NO       | gen_random_uuid() |         |
| user_id    | `uuid`        | NO       |                   | → users |
| deal_id    | `uuid`        | YES      |                   | → deals |
| type       | `text`        | NO       |                   |         |
| title      | `text`        | NO       |                   |         |
| message    | `text`        | YES      |                   |         |
| is_read    | `boolean`     | YES      | false             |         |
| read_at    | `timestamptz` | YES      |                   |         |
| action_url | `text`        | YES      |                   |         |
| created_at | `timestamptz` | YES      | now()             |         |

## Commissions

### commission_structures (13 cols)

| Column         | Type          | Nullable | Default           | FK          |
| -------------- | ------------- | -------- | ----------------- | ----------- |
| id             | `uuid`        | NO       | gen_random_uuid() |             |
| company_id     | `uuid`        | NO       |                   | → companies |
| name           | `text`        | NO       |                   |             |
| structure_type | `text`        | NO       |                   |             |
| applies_to     | `text`        | NO       |                   |             |
| base_rate      | `numeric`     | YES      |                   |             |
| tiers          | `jsonb`       | YES      | '[]'              |             |
| effective_date | `date`        | NO       |                   |             |
| end_date       | `date`        | YES      |                   |             |
| is_active      | `boolean`     | YES      | true              |             |
| created_at     | `timestamptz` | YES      | now()             |             |
| updated_at     | `timestamptz` | YES      | now()             |             |
| updated_by     | `uuid`        | YES      |                   |             |

### deal_commissions (16 cols)

| Column                  | Type          | Nullable | Default           | FK                      |
| ----------------------- | ------------- | -------- | ----------------- | ----------------------- |
| id                      | `uuid`        | NO       | gen_random_uuid() |                         |
| deal_id                 | `uuid`        | NO       |                   | → deals                 |
| user_id                 | `uuid`        | NO       |                   | → users                 |
| commission_type         | `text`        | NO       |                   |                         |
| commission_structure_id | `uuid`        | YES      |                   | → commission_structures |
| base_amount             | `numeric`     | YES      |                   |                         |
| adjustments             | `jsonb`       | YES      | '[]'              |                         |
| final_amount            | `numeric`     | NO       |                   |                         |
| status                  | `text`        | YES      | 'estimated'       |                         |
| approved_by             | `uuid`        | YES      |                   | → users                 |
| approved_at             | `timestamptz` | YES      |                   |                         |
| paid_at                 | `timestamptz` | YES      |                   |                         |
| notes                   | `text`        | YES      |                   |                         |
| created_at              | `timestamptz` | YES      | now()             |                         |
| updated_at              | `timestamptz` | YES      | now()             |                         |
| updated_by              | `uuid`        | YES      |                   |                         |

## UI

### filter_presets (10 cols)

| Column      | Type          | Nullable | Default           | FK          |
| ----------- | ------------- | -------- | ----------------- | ----------- |
| id          | `uuid`        | NO       | gen_random_uuid() |             |
| company_id  | `uuid`        | NO       |                   | → companies |
| user_id     | `uuid`        | NO       |                   | → users     |
| name        | `text`        | NO       |                   |             |
| entity_type | `text`        | NO       |                   |             |
| filters     | `jsonb`       | NO       | '{}'              |             |
| is_default  | `boolean`     | YES      | false             |             |
| is_shared   | `boolean`     | YES      | false             |             |
| created_at  | `timestamptz` | YES      | now()             |             |
| updated_at  | `timestamptz` | YES      | now()             |             |

## Views

### v_deal_detail (108 cols)

| Column                      | Type          | Nullable | Default | FK  |
| --------------------------- | ------------- | -------- | ------- | --- |
| id                          | `uuid`        | YES      |         |     |
| company_id                  | `uuid`        | YES      |         |     |
| contact_id                  | `uuid`        | YES      |         |     |
| deal_number                 | `text`        | YES      |         |     |
| setter_id                   | `uuid`        | YES      |         |     |
| closer_id                   | `uuid`        | YES      |         |     |
| office_id                   | `uuid`        | YES      |         |     |
| team_id                     | `uuid`        | YES      |         |     |
| stage                       | `text`        | YES      |         |     |
| stage_changed_at            | `timestamptz` | YES      |         |     |
| active_proposal_id          | `uuid`        | YES      |         |     |
| install_address             | `text`        | YES      |         |     |
| install_address2            | `text`        | YES      |         |     |
| install_city                | `text`        | YES      |         |     |
| install_state               | `text`        | YES      |         |     |
| install_zip                 | `text`        | YES      |         |     |
| install_lat                 | `numeric`     | YES      |         |     |
| install_lng                 | `numeric`     | YES      |         |     |
| repcard_appointment_id      | `integer`     | YES      |         |     |
| appointment_date            | `timestamptz` | YES      |         |     |
| appointment_end             | `timestamptz` | YES      |         |     |
| appointment_timezone        | `text`        | YES      |         |     |
| appointment_location        | `text`        | YES      |         |     |
| appointment_notes           | `text`        | YES      |         |     |
| appointment_outcome         | `text`        | YES      |         |     |
| appointment_outcome_id      | `integer`     | YES      |         |     |
| system_size_kw              | `numeric`     | YES      |         |     |
| panel_count                 | `integer`     | YES      |         |     |
| panel_model                 | `text`        | YES      |         |     |
| inverter_model              | `text`        | YES      |         |     |
| battery_model               | `text`        | YES      |         |     |
| battery_count               | `integer`     | YES      |         |     |
| offset_percentage           | `numeric`     | YES      |         |     |
| annual_production_kwh       | `numeric`     | YES      |         |     |
| annual_usage_kwh            | `numeric`     | YES      |         |     |
| mounting_type               | `text`        | YES      |         |     |
| gross_price                 | `numeric`     | YES      |         |     |
| adders_total                | `numeric`     | YES      |         |     |
| net_price                   | `numeric`     | YES      |         |     |
| gross_ppw                   | `numeric`     | YES      |         |     |
| net_ppw                     | `numeric`     | YES      |         |     |
| dealer_fee                  | `numeric`     | YES      |         |     |
| dealer_fee_percentage       | `numeric`     | YES      |         |     |
| commission_base             | `numeric`     | YES      |         |     |
| lender_id                   | `uuid`        | YES      |         |     |
| loan_product                | `text`        | YES      |         |     |
| loan_amount                 | `numeric`     | YES      |         |     |
| loan_term_months            | `integer`     | YES      |         |     |
| interest_rate               | `numeric`     | YES      |         |     |
| monthly_payment             | `numeric`     | YES      |         |     |
| financing_status            | `text`        | YES      |         |     |
| financing_application_id    | `text`        | YES      |         |     |
| financing_approved_at       | `timestamptz` | YES      |         |     |
| install_agreement_status    | `text`        | YES      |         |     |
| install_agreement_signed_at | `timestamptz` | YES      |         |     |
| submission_status           | `text`        | YES      |         |     |
| submitted_at                | `timestamptz` | YES      |         |     |
| submitted_by                | `uuid`        | YES      |         |     |
| intake_reviewed_at          | `timestamptz` | YES      |         |     |
| intake_reviewed_by          | `text`        | YES      |         |     |
| rejection_reason            | `text`        | YES      |         |     |
| aurora_project_id           | `text`        | YES      |         |     |
| aurora_design_id            | `text`        | YES      |         |     |
| aurora_design_request_id    | `text`        | YES      |         |     |
| design_status               | `text`        | YES      |         |     |
| monthly_kwh                 | `jsonb`       | YES      |         |     |
| annual_kwh                  | `numeric`     | YES      |         |     |
| utility_company             | `text`        | YES      |         |     |
| utility_tariff              | `text`        | YES      |         |     |
| monthly_bill                | `numeric`     | YES      |         |     |
| design_request_type         | `text`        | YES      |         |     |
| design_requested_at         | `timestamptz` | YES      |         |     |
| design_completed_at         | `timestamptz` | YES      |         |     |
| design_request_notes        | `text`        | YES      |         |     |
| target_offset               | `numeric`     | YES      |         |     |
| roof_material               | `text`        | YES      |         |     |
| aurora_sales_mode_url       | `text`        | YES      |         |     |
| quickbase_deal_id           | `text`        | YES      |         |     |
| enerflo_deal_id             | `text`        | YES      |         |     |
| enerflo_short_code          | `text`        | YES      |         |     |
| source                      | `text`        | YES      |         |     |
| both_spouses_present        | `boolean`     | YES      |         |     |
| is_new_construction         | `boolean`     | YES      |         |     |
| is_battery_only             | `boolean`     | YES      |         |     |
| is_commercial               | `boolean`     | YES      |         |     |
| has_hoa                     | `boolean`     | YES      |         |     |
| deleted_at                  | `timestamptz` | YES      |         |     |
| deleted_by                  | `uuid`        | YES      |         |     |
| created_at                  | `timestamptz` | YES      |         |     |
| updated_at                  | `timestamptz` | YES      |         |     |
| updated_by                  | `uuid`        | YES      |         |     |
| contact_first_name          | `text`        | YES      |         |     |
| contact_last_name           | `text`        | YES      |         |     |
| contact_email               | `text`        | YES      |         |     |
| contact_phone               | `text`        | YES      |         |     |
| contact_address             | `text`        | YES      |         |     |
| contact_city                | `text`        | YES      |         |     |
| contact_state               | `text`        | YES      |         |     |
| contact_zip                 | `text`        | YES      |         |     |
| monthly_electric_bill       | `numeric`     | YES      |         |     |
| contact_annual_usage        | `numeric`     | YES      |         |     |
| contact_utility_company     | `text`        | YES      |         |     |
| closer_name                 | `text`        | YES      |         |     |
| closer_email                | `text`        | YES      |         |     |
| setter_name                 | `text`        | YES      |         |     |
| office_name                 | `text`        | YES      |         |     |
| team_name                   | `text`        | YES      |         |     |
| lender_name                 | `text`        | YES      |         |     |

### v_deal_pipeline (20 cols)

| Column           | Type          | Nullable | Default | FK  |
| ---------------- | ------------- | -------- | ------- | --- |
| id               | `uuid`        | YES      |         |     |
| deal_number      | `text`        | YES      |         |     |
| stage            | `text`        | YES      |         |     |
| stage_changed_at | `timestamptz` | YES      |         |     |
| created_at       | `timestamptz` | YES      |         |     |
| system_size_kw   | `numeric`     | YES      |         |     |
| gross_price      | `numeric`     | YES      |         |     |
| net_price        | `numeric`     | YES      |         |     |
| mounting_type    | `text`        | YES      |         |     |
| contact_name     | `text`        | YES      |         |     |
| contact_phone    | `text`        | YES      |         |     |
| contact_city     | `text`        | YES      |         |     |
| contact_state    | `text`        | YES      |         |     |
| install_city     | `text`        | YES      |         |     |
| install_state    | `text`        | YES      |         |     |
| closer_name      | `text`        | YES      |         |     |
| setter_name      | `text`        | YES      |         |     |
| office_name      | `text`        | YES      |         |     |
| team_name        | `text`        | YES      |         |     |
| company_id       | `uuid`        | YES      |         |     |
