# KinOS Database Audit — What's Missing?

## WHAT WE HAVE ✅
1. deal_stage_history — tracks stage changes with from/to/who/when
2. activities — timeline feed of events
3. webhook_events — inbound webhook log (raw payloads)
4. integration_sync_log — outbound API call log
5. aurora_pricing_syncs — equipment sync audit trail
6. proposals snapshot design data at creation time
7. Soft deletes (deleted_at) on contacts
8. updated_at on major tables

## WHAT'S MISSING ❌

### 1. GENERAL AUDIT LOG (field-level change tracking)
We track stage changes, but NOT when someone changes:
- Contact phone number
- Deal closer (reassignment)
- Proposal pricing after creation
- User role changes
- Lender product settings
- Admin config changes

Need: A generic audit table that captures WHO changed WHAT field FROM what TO what, WHEN.
This is critical for disputes ("who changed this deal's closer?"), compliance, and debugging.

### 2. DEAL SNAPSHOTS (point-in-time state)
When a deal gets submitted to Quickbase, we need a frozen snapshot of the ENTIRE deal state
at submission time. If someone later edits the deal, the submitted version is preserved.
Same for: proposal finalization, contract generation, financing application.

Why: "What did the deal look like when we submitted it?" is a question that WILL come up.

### 3. PROPOSAL VERSIONING
Current proposals have statuses (draft → ready → finalized → superseded) but no versioning.
If a closer edits a draft proposal, the previous values are gone.
Need: Either version numbers with full snapshots, or field-level tracking on proposals.

### 4. CONTACT CHANGE HISTORY
If contact info changes (phone, email, address), we lose the old values.
The RepCard webhook could send updated info that overwrites.
Need: Track previous values, especially address (affects design, permitting, utility).

### 5. DEAL ASSIGNMENT HISTORY
Who was assigned as closer/setter, when, and who made the change.
Critical for commission disputes and accountability.

### 6. SOFT DELETES EVERYWHERE
Only contacts have deleted_at. Need it on:
- deals (cancelled/lost should be soft-deleted, not hard-deleted)
- proposals (should never hard delete)
- attachments
- notes
- users (deactivation, not deletion)

### 7. updated_by TRACKING
updated_at exists but updated_by does NOT. We know WHEN something changed but not WHO.
Need updated_by UUID on all major tables.

### 8. NOTES TABLE
Activities log has notes as a type, but there's no dedicated notes table.
Sales notes, manager notes, internal comments on deals — these need:
- Visibility controls (private to author, visible to team, visible to all)
- Pinnable notes
- Edit history

### 9. DATA RETENTION / ARCHIVAL
No strategy for old data. After 2+ years, the deals table will have thousands of
submitted/completed deals. Need:
- Archive strategy (move to archive tables? partition by year?)
- Retention policy for webhook_events and integration_sync_log (these grow FAST)

### 10. COMMISSION SNAPSHOTS
Commission base is calculated on the deal, but if pricing changes after,
the number that went to Quickbase/CaptiveIQ is lost.
Need: Snapshot the commission-relevant numbers at submission time.

### 11. FINANCING APPLICATION HISTORY  
financing_applications table exists but doesn't handle:
- Multiple applications to same lender (resubmit after denial)
- Stip clear/upload tracking over time
- Approval conditions changes

### 12. DATABASE TRIGGERS / FUNCTIONS
No Postgres triggers defined for:
- Auto-updating updated_at
- Auto-creating deal_stage_history when stage changes
- Auto-creating activity entries for key events
- Auto-calculating deal_number sequence
- Enforcing business rules at DB level

### 13. ROW-LEVEL SECURITY POLICIES
Referenced in architecture but not defined as SQL.
Need full RLS policy definitions for every table.

### 14. INDEXES FOR REPORTING
Current indexes cover CRUD operations but not reporting queries:
- Deals by date range + office (pipeline reports)
- Deals by closer + date range (rep performance)  
- Proposals by lender + date range (financing reports)
- Revenue aggregation by month + office
