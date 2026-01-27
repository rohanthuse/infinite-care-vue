
# Plan: Fix Medication Recording Inaccuracies

## Problem Analysis

After thorough investigation, I've identified **four interconnected issues** causing medication recording inaccuracies in the Admin/Staff Portal:

### Root Cause: Data Fragmentation
The system has two separate tables for medication records that **do not synchronize**:

| Table | Purpose | Updated By | Shows In |
|-------|---------|------------|----------|
| `visit_medications` | Records medications during carer visits | Carers via visit workflow | Service Reports, Visit Details |
| `medication_administration_records` | Historical MAR chart data | Admin portal only | MAR Charts, Trend Analytics |

**Result:** Carers record medications during visits, but this data **never flows** to the MAR chart in the Admin Portal.

---

## Issues to Fix

### Issue 1: Missing in MAR Chart
**Cause:** The `useVisitMedications.administerMedication` mutation only updates `visit_medications`. There is no code to also insert into `medication_administration_records`.

**Location:** `src/hooks/useVisitMedications.ts` lines 74-114

### Issue 2: Missing Medications During Visits
**Cause:** Medications are filtered by `time_of_day` when loading into visits. If the care plan medication doesn't have a matching time slot OR has incorrect `time_of_day` data, the medication won't appear.

**Location:** `src/hooks/useVisitMedications.ts` lines 194-197

### Issue 3: Wrong Timestamps
**Cause:** Timestamps are generated client-side using `new Date().toISOString()`. If the device clock is incorrect or timezone handling varies, timestamps will be inaccurate.

**Location:** `src/hooks/useVisitMedications.ts` line 102

### Issue 4: Duplicate Records
**Cause:** When syncing draft medications (`handleDraftMedicationToggle`), there's no deduplication check. A carer could add the same medication multiple times if they click rapidly or if the UI doesn't properly track synced meds.

**Location:** `src/pages/carer/CarerVisitWorkflow.tsx` lines 1617-1637

---

## Solution Overview

### 1. Create MAR Sync Function
Add logic to automatically create a `medication_administration_records` entry whenever a medication is administered during a visit.

### 2. Improve Time-of-Day Filtering
Make the time-of-day filter more lenient and add fallback logic to show all medications if none match.

### 3. Use Server-Side Timestamps
Replace client-side timestamps with database `NOW()` for accuracy.

### 4. Add Deduplication Logic
Check for existing visit medications before inserting and prevent duplicate MAR entries.

---

## Implementation Steps

### Step 1: Sync Visit Medications to MAR Table

**File:** `src/hooks/useVisitMedications.ts`

Modify the `administerMedication` mutation to also create a MAR entry when a medication is marked as administered.

```typescript
// In administerMedication mutation, after updating visit_medications
if (isAdministered && medication.medication_id) {
  // Create corresponding MAR entry
  await supabase.from('medication_administration_records').insert({
    medication_id: medication.medication_id,
    administered_at: new Date().toISOString(),
    administered_by: administeredBy || 'Unknown',
    status: 'given',
    notes: notes,
    visit_record_id: visitRecordId // Link to visit for traceability
  });
}
```

### Step 2: Create Database Trigger (Alternative Approach)

Create a database trigger that automatically syncs `visit_medications` to `medication_administration_records` whenever a medication is marked as administered.

```sql
CREATE OR REPLACE FUNCTION sync_visit_medication_to_mar()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync when medication is marked as administered
  IF NEW.is_administered = true AND OLD.is_administered = false 
     AND NEW.medication_id IS NOT NULL THEN
    
    -- Check for existing MAR entry to prevent duplicates
    IF NOT EXISTS (
      SELECT 1 FROM medication_administration_records 
      WHERE medication_id = NEW.medication_id 
        AND visit_record_id = NEW.visit_record_id
    ) THEN
      INSERT INTO medication_administration_records (
        medication_id,
        administered_at,
        administered_by,
        status,
        notes,
        visit_record_id
      ) VALUES (
        NEW.medication_id,
        COALESCE(NEW.administration_time, NOW()),
        COALESCE(NEW.administered_by, 'Unknown'),
        'given',
        NEW.administration_notes,
        NEW.visit_record_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_visit_medication_to_mar
AFTER UPDATE ON visit_medications
FOR EACH ROW
EXECUTE FUNCTION sync_visit_medication_to_mar();
```

### Step 3: Add `visit_record_id` Column to MAR Table

Add a nullable column to link MAR entries back to their source visit.

```sql
ALTER TABLE medication_administration_records 
ADD COLUMN IF NOT EXISTS visit_record_id UUID REFERENCES visit_records(id);

CREATE INDEX idx_mar_visit_record ON medication_administration_records(visit_record_id);
```

### Step 4: Fix Time-of-Day Filter Logic

**File:** `src/hooks/useVisitMedications.ts`

Make the filter more flexible:

```typescript
// Current behavior: strict filter
const filteredMedications = clientMedications.filter(med => 
  doesMedicationMatchTimeOfDay(med.time_of_day as string[] | null, visitTimeOfDay)
);

// New behavior: show all if none match time slot
let filteredMedications = clientMedications.filter(med => 
  doesMedicationMatchTimeOfDay(med.time_of_day as string[] | null, visitTimeOfDay)
);

// Fallback: if no medications match time_of_day, show all active medications
if (filteredMedications.length === 0 && clientMedications.length > 0) {
  console.log('[useVisitMedications] No medications matched time_of_day filter, showing all');
  filteredMedications = clientMedications;
}
```

### Step 5: Add Deduplication Check

**File:** `src/pages/carer/CarerVisitWorkflow.tsx`

Before adding a draft medication, check if it already exists:

```typescript
// Check if this medication already exists in visit_medications
const { data: existingMed } = await supabase
  .from('visit_medications')
  .select('id')
  .eq('visit_record_id', visitRecord.id)
  .eq('medication_name', med.name)
  .maybeSingle();

if (existingMed) {
  toast.info(`${med.name} is already in the medication tracker`);
  return;
}
```

### Step 6: Update MAR Chart Query to Include Visit Data

**File:** `src/hooks/useMedicationChartData.ts`

Optionally, update the trend chart to also query `visit_medications` as a supplementary data source until all historical data is synced.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useVisitMedications.ts` | Add MAR sync on administration, fix time filter fallback, use server timestamp |
| `src/pages/carer/CarerVisitWorkflow.tsx` | Add deduplication check for draft medications |
| SQL Migration | Add trigger for automatic sync, add `visit_record_id` column to MAR table |
| `src/hooks/useMedicationChartData.ts` | (Optional) Add visit_medications as secondary data source |

## Files to Create

| File | Purpose |
|------|---------|
| SQL Migration | Database trigger and schema changes |

---

## Data Flow After Fix

```text
Carer Visit Workflow
        |
        v
visit_medications (UPDATE)
        |
        v
[Database Trigger]
        |
        v
medication_administration_records (INSERT)
        |
        v
MAR Chart & Admin Portal
        (Shows all data from both sources)
```

---

## Testing Checklist

- [ ] Record a medication during a carer visit
- [ ] Verify the medication appears in `visit_medications` table
- [ ] Verify a corresponding entry is created in `medication_administration_records`
- [ ] Check the MAR chart in Admin portal shows the administered medication
- [ ] Test with medications that have no `time_of_day` set (should still appear)
- [ ] Test rapid clicking on medication toggle (should not create duplicates)
- [ ] Verify timestamps are accurate across different timezones
- [ ] Test that unadministering a medication does NOT remove the MAR entry (historical record)

---

## Impact Assessment

**Medium Risk:**
- Adds database trigger which could impact performance (mitigated by targeted WHERE clause)
- Changes to medication flow require careful testing
- No data loss - only adds new records

**Benefits:**
- MAR chart will accurately reflect all carer-administered medications
- Single source of truth for medication administration history
- Eliminates data fragmentation between portals
