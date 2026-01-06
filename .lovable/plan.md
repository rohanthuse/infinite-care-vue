# Plan: Fix NEWS2 Health Monitoring Completion Indicator

## Issue Summary
The NEWS2 Health Monitoring tab in Create Care Plan does not show a completion checkmark after data entry, unlike other tabs.

## Root Cause
There is a **data path mismatch** between where the wizard stores NEWS2 data and where the completion utility looks for it:

- **Wizard Form** saves fields at the root level: `news2_monitoring_enabled`, `news2_monitoring_frequency`, `news2_monitoring_notes`
- **Completion Utility** (`hasNews2Monitoring`) checks for data at: `medicalInfo.news2_monitoring` (nested object)

Since the nested path doesn't exist, `hasNews2Monitoring()` always returns `false`.

---

## Implementation

### Step 1: Update `hasNews2Monitoring` Function

**File:** `src/utils/carePlanCompletionUtils.ts`

**Change:** Modify the function to check root-level fields instead of nested path.

**Current code (lines 126-134):**
```typescript
export const hasNews2Monitoring = (medicalInfo: any): boolean => {
  if (!medicalInfo || typeof medicalInfo !== 'object') return false;
  
  const news2 = medicalInfo.news2_monitoring;
  if (!news2 || typeof news2 !== 'object') return false;
  
  // Check if any NEWS2 field has a meaningful value
  return hasAnyValue(news2);
};
```

**New code:**
```typescript
// Check if NEWS2 health monitoring has been configured
// Handles both root-level fields (wizard) and legacy nested format
export const hasNews2Monitoring = (formData: any): boolean => {
  if (!formData || typeof formData !== 'object') return false;
  
  // Check root-level fields (current wizard format)
  if (formData.news2_monitoring_enabled === true) return true;
  
  // Also check root-level fields with any meaningful value
  if (isNonEmptyString(formData.news2_monitoring_frequency) || 
      isNonEmptyString(formData.news2_monitoring_notes)) return true;
  
  // Legacy fallback: check nested path under medical_info
  const news2 = formData.medical_info?.news2_monitoring;
  if (news2 && typeof news2 === 'object') {
    return hasAnyValue(news2);
  }
  
  return false;
};
```

---

### Step 2: Update Function Call in `getCompletedStepIds`

**File:** `src/utils/carePlanCompletionUtils.ts`

**Change:** Pass the full `formData` to `hasNews2Monitoring` instead of just `medInfo`.

**Current code (line 292):**
```typescript
// Step 4 - NEWS2 Health Monitoring
if (hasNews2Monitoring(medInfo)) completedSteps.push(4);
```

**New code:**
```typescript
// Step 4 - NEWS2 Health Monitoring (checks root-level fields)
if (hasNews2Monitoring(formData)) completedSteps.push(4);
```

---

### Step 3: Update Review Step (Optional - for consistency)

**File:** `src/components/clients/dialogs/wizard/steps/WizardStep14Review.tsx`

**Change:** Update the section status check at line 89-90 to pass full `formData`.

**Current code:**
```typescript
case "news2_monitoring":
  return hasNews2Monitoring(formData.medical_info) ? "completed" : "empty";
```

**New code:**
```typescript
case "news2_monitoring":
  return hasNews2Monitoring(formData) ? "completed" : "empty";
```

---

## Summary of Changes

| File | Lines | Change |
|------|-------|--------|
| `src/utils/carePlanCompletionUtils.ts` | 126-134 | Rewrite `hasNews2Monitoring` to check root-level fields |
| `src/utils/carePlanCompletionUtils.ts` | 292 | Pass `formData` instead of `medInfo` |
| `src/components/clients/dialogs/wizard/steps/WizardStep14Review.tsx` | 89-90 | Pass `formData` instead of `formData.medical_info` |

---

## Testing Checklist

- [ ] Enable NEWS2 monitoring checkbox - checkmark appears on sidebar
- [ ] Select monitoring frequency - checkmark persists
- [ ] Add monitoring notes - checkmark persists  
- [ ] Navigate to another step and back - checkmark remains
- [ ] Review step shows NEWS2 as completed
- [ ] Existing care plans with legacy nested data still work
- [ ] No impact on other tab completion indicators

---

## Data Flow After Fix

```
Wizard Form (root level)
    |
    v
news2_monitoring_enabled = true
news2_monitoring_frequency = "daily"
news2_monitoring_notes = "..."
    |
    v
hasNews2Monitoring(formData) 
    |
    v
Checks: formData.news2_monitoring_enabled === true? 
    |
    v
Returns TRUE -> Step 4 added to completedSteps
    |
    v
Checkmark appears in sidebar
```
