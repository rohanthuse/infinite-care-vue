
# Plan: Display Staff Service Reports in Client Portal

## Problem Statement
Service reports created by carers in the staff portal are not visible to clients in the client portal. The client portal's "Service Reports" page only shows aggregated statistics from care plans and appointments, but never displays the actual detailed service reports from the `client_service_reports` table.

## Root Cause
The client portal uses a different hook (`useClientServiceReports` from `src/hooks/useClientServiceReports.ts`) that only aggregates care plan goal progress and appointment statistics. It does not query the `client_service_reports` table where carers store their visit reports.

## Solution Overview
Add a new tab or section to the client portal's Service Reports page that displays the actual service reports from carers. We will reuse the existing `ServiceReportsTab` component which is already designed for this purpose.

---

## Implementation Steps

### Step 1: Add a "Visit Reports" Tab to Client Service Reports Page

**File:** `src/pages/client/ClientServiceReports.tsx`

**Changes:**
1. Import the `ServiceReportsTab` component from `@/components/service-reports/ServiceReportsTab`
2. Add a new tab called "Visit Reports" to the existing tab structure
3. Render the `ServiceReportsTab` component in this new tab, passing the `clientId`

This will add a fourth tab alongside "Overview", "Progress", and "Service Details" that shows the actual carer-submitted reports.

### Step 2: Ensure RLS Policy Compatibility (Verification Only)

The existing RLS policy is correctly configured:
```sql
CREATE POLICY "Clients can view their approved service reports"
ON public.client_service_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.auth_user_id = auth.uid()
    AND c.id = client_service_reports.client_id
  ) AND visible_to_client = true AND status = 'approved'
);
```

The `useApprovedServiceReports` hook correctly filters by:
- `client_id` matching the logged-in client
- `status = 'approved'`
- `visible_to_client = true`

No database changes are required.

### Step 3: Rename Tab for Clarity (Optional Enhancement)

Consider renaming tabs for better user understanding:
- "Overview" → Keep as is (charts and distribution)
- "Progress" → Keep as is (care plan goal progress)
- "Service Details" → Rename to "Appointment Summary" (appointments with goal counts)
- "Visit Reports" → New tab (actual carer observations and notes)

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/client/ClientServiceReports.tsx` | Add import for `ServiceReportsTab`, add new tab with the component |

### Code Changes

**In `ClientServiceReports.tsx` (around line 159-163):**

Add import at top:
```typescript
import { ServiceReportsTab } from '@/components/service-reports/ServiceReportsTab';
```

Add new tab trigger and content:
```typescript
<TabsList className="mb-4">
  <TabsTrigger value="overview">Overview</TabsTrigger>
  <TabsTrigger value="progress">Progress</TabsTrigger>
  <TabsTrigger value="details">Service Details</TabsTrigger>
  <TabsTrigger value="visit-reports">Visit Reports</TabsTrigger>  {/* NEW */}
</TabsList>

{/* ... existing tab contents ... */}

<TabsContent value="visit-reports">
  <ServiceReportsTab clientId={clientId || ''} />
</TabsContent>
```

---

## Data Flow After Fix

```text
+------------------+     +-------------------------+     +-------------------+
|  Carer Portal    | --> | client_service_reports  | --> |  Client Portal    |
|  (Creates report)|     | (Database table)        |     | (Displays report) |
+------------------+     +-------------------------+     +-------------------+
        |                         |                              |
        v                         v                              v
 CarerVisitWorkflow       status: 'approved'              ServiceReportsTab
 CarerReportsTab          visible_to_client: true         (View Details, Share)
```

---

## Testing Checklist

- [ ] Create a service report from the carer portal (via visit workflow or reports tab)
- [ ] Log in as the client in the client portal
- [ ] Navigate to Service Reports page
- [ ] Verify the new "Visit Reports" tab appears
- [ ] Click on "Visit Reports" tab
- [ ] Verify the carer's service report appears in the list
- [ ] Click "View Details" to see full report information
- [ ] Verify carer name, date, services provided, mood, observations are visible
- [ ] Test the "Share" functionality works correctly

---

## Impact Assessment

**Low Risk:**
- Reuses existing, tested components (`ServiceReportsTab`, `useApprovedServiceReports`)
- No database schema changes required
- No changes to existing functionality or UI in other tabs
- RLS policies already correctly configured

**UI Impact:**
- Adds one new tab to the client Service Reports page
- No changes to existing tab content or layout
