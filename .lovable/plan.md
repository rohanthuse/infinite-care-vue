
# Plan: Fix Repeated Risk Columns in Risk Assessments

## Problem Statement
When adding multiple risk assessments (Risk 1, Risk 2, etc.), the following sections are repeated for each assessment:
- **Risk Section**: RAG Status, Has Pets, Fall Risk, Risk to Staff, Adverse Weather Plan
- **Personal Risk Section**: Lives Alone, Rural Area, Cared in Bed, Smoker, etc.

These are **client-level** risk factors that should only appear **once** on the page, not duplicated per risk assessment.

## Current Structure (Problematic)
```
Risk Assessment 1
├── Risk Type, Level, Factors, Mitigation
├── Risk Section (RAG, Pets, Fall Risk, Weather)     ← DUPLICATE
└── Personal Risk Section                              ← DUPLICATE

Risk Assessment 2
├── Risk Type, Level, Factors, Mitigation
├── Risk Section (RAG, Pets, Fall Risk, Weather)     ← DUPLICATE
└── Personal Risk Section                              ← DUPLICATE
```

## Proposed Structure (Fixed)
```
┌─────────────────────────────────────────────────────┐
│ General Client Risk                                  │
│ (RAG Status, Has Pets, Fall Risk, Adverse Weather)  │
│ Appears ONCE at top                                  │
└─────────────────────────────────────────────────────┘

Risk Assessment 1
├── Risk Type, Level, Factors, Mitigation

Risk Assessment 2  
├── Risk Type, Level, Factors, Mitigation

┌─────────────────────────────────────────────────────┐
│ Personal Risk Factors                                │
│ (Lives Alone, Rural Area, Smoker, etc.)             │
│ Appears ONCE at bottom                               │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Update Form Data Structure

Change how the Risk and Personal Risk fields are stored - move them from per-assessment to top-level form fields.

**File:** `src/components/clients/dialogs/wizard/steps/WizardStep9RiskAssessments.tsx`

| Change | Description |
|--------|-------------|
| Move Risk fields to form root | Use `form.setValue("client_risk_info.rag_status", ...)` instead of per-assessment |
| Move Personal Risk fields to form root | Use `form.setValue("client_personal_risk.lives_alone", ...)` |
| Remove from addRiskAssessment() | Remove Risk/Personal Risk fields from the new assessment template |

### Step 2: Restructure the Component Layout

**File:** `src/components/clients/dialogs/wizard/steps/WizardStep9RiskAssessments.tsx`

| Section | Location | Contains |
|---------|----------|----------|
| General Client Risk | Top of page (outside loop) | RAG Status, Has Pets, Fall Risk, Risk to Staff, Adverse Weather Plan |
| Risk Assessments Loop | Middle | Risk Type, Level, Assessed By, Review Date, Risk Factors, Mitigation Strategies |
| Personal Risk Factors | Bottom of page (outside loop) | Lives Alone, Rural Area, Cared in Bed, Smoker, etc. |

### Step 3: Update Display Components

**Files to update:**
- `src/components/care/tabs/RiskAssessmentsTab.tsx`
- `src/components/care/tabs/RiskTab.tsx`

Move the "General Risk" and "Personal Risk" display sections outside the assessment loop so they only appear once.

### Step 4: Update Form Schema/Defaults

**File:** Care plan wizard schema/defaults

Ensure the wizard schema includes the new top-level fields:
```typescript
client_risk_info: {
  rag_status: "",
  has_pets: false,
  fall_risk: "",
  risk_to_staff: [],
  adverse_weather_plan: ""
},
client_personal_risk: {
  lives_alone: false,
  rural_area: false,
  cared_in_bed: false,
  smoker: false,
  can_call_for_assistance: false,
  communication_needs: "",
  social_support: "",
  fallen_past_six_months: false,
  has_assistance_device: false,
  arrange_assistance_device: false
}
```

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/clients/dialogs/wizard/steps/WizardStep9RiskAssessments.tsx` | Move Risk & Personal Risk sections outside the assessment loop |
| `src/components/care/tabs/RiskAssessmentsTab.tsx` | Display General Risk and Personal Risk once, not per-assessment |
| `src/components/care/tabs/RiskTab.tsx` | Same change - display once at client level |
| Care plan wizard schema | Add top-level client_risk_info and client_personal_risk objects |

### Data Migration Consideration
Existing risk assessments may have these fields stored per-assessment. The fix should:
1. Read from the **first** risk assessment for backwards compatibility
2. Save to the new top-level structure going forward
3. Display view components should check both locations

---

## Visual Summary

**Before (Repeating):**
| Risk 1 | Risk 2 |
|--------|--------|
| Fall Risk: ... | Fall Risk: ... |
| Weather Plan: ... | Weather Plan: ... |
| Lives Alone: Yes | Lives Alone: Yes |

**After (Single Entry):**
| General Risk (Top) |
|-------------------|
| Fall Risk: ... |
| Weather Plan: ... |

| Risk Assessment 1 | Risk Assessment 2 |
|-------------------|-------------------|
| Type: Falls | Type: Medication |
| Level: High | Level: Low |

| Personal Risk (Bottom) |
|------------------------|
| Lives Alone: Yes |
| Smoker: No |

---

## Impact Assessment

**Low Risk:**
- UI restructuring only
- No database schema changes required
- Backwards compatible with existing data
- Per your instructions, no visual styling changes

**Benefits:**
- Eliminates confusing duplicate fields
- Client-level risk info appears only once
- Each risk assessment focuses on specific risk type/level/factors
