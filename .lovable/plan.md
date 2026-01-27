
# Plan: Download Blank Care Plan Feature

## Overview
Add functionality to download a blank care plan PDF template that includes only the client's name with all other care plan fields empty. This allows staff to print blank forms for manual completion or use as a paper-based assessment template.

## Current State
- The `generateCarePlanDetailPDF` function in `src/services/enhancedPdfGenerator.ts` generates a fully populated care plan PDF
- It conditionally renders sections only if data exists (using `if (clientData.medicalInfo)` etc.)
- There is no existing feature to download a blank template

## Proposed Solution
Create a new function `generateBlankCarePlanPDF` that generates all care plan sections with empty field values, showing the client name but leaving all other fields as blank placeholders for manual completion.

---

## Implementation Steps

### Step 1: Add New PDF Generation Method

**File:** `src/services/enhancedPdfGenerator.ts`

Add a new method `generateBlankCarePlanPDF` to the `EnhancedPdfGenerator` class that:
- Renders all care plan sections unconditionally
- Shows client name from the provided data
- Uses empty string placeholders (`"_________________"`) for all other fields
- Includes all standard sections: Patient Information, Care Plan Details, Key Contacts, Medical Information, Personal Care, Dietary Requirements, Medications, Risk Assessments, Equipment, Goals, Activities, Consent

### Step 2: Add Export Convenience Function

**File:** `src/services/enhancedPdfGenerator.ts`

Add a new async export function:
```typescript
export const generateBlankCarePlanPDF = async (
  clientName: string,
  clientId: string,
  branchName: string,
  branchId?: string
) => { ... }
```

### Step 3: Add "Download Blank" Button to CarePlansTab

**File:** `src/components/clients/tabs/CarePlansTab.tsx`

Add a new button in the header section alongside the "Create Plan" button:
- Icon: `FileDown` (or `Download`)
- Label: "Download Blank"
- onClick: Calls the new `generateBlankCarePlanPDF` function with client data

### Step 4: Add Client Data Fetching (if needed)

The `CarePlansTab` already has access to `clientId` and `clientName` props. We'll use the existing `useParams` hook for `branchId`.

---

## Technical Details

### New Method Structure in EnhancedPdfGenerator

```typescript
generateBlankCarePlanPDF(clientName: string, options: PdfOptions): void {
  this.currentY = this.addHeader(options);

  // Patient Information Section - with client name, rest blank
  this.addSection("Patient Information", [
    ["Full Name", clientName],
    ["Date of Birth", "_________________"],
    ["Age Group", "_________________"],
    ["Address", "_________________"],
    ["Phone", "_________________"],
    ["Email", "_________________"],
    ["NHS Number", "_________________"]
  ], SECTION_COLORS.patientInfo);

  // Care Plan Details Section - all blank
  this.addSection("Care Plan Details", [
    ["Plan ID", "_________________"],
    ["Plan Title", "_________________"],
    ["Assigned Staff", "_________________"],
    ...
  ], SECTION_COLORS.carePlanDetails);

  // Continue with all other sections using blank placeholders...
}
```

### Sections to Include in Blank Template

| Section | Fields |
|---------|--------|
| Patient Information | Full Name (populated), DOB, Age Group, Address, Phone, Email, NHS Number |
| Care Plan Details | Plan ID, Title, Assigned Staff, Provider Type, Status, Start Date, Review Date |
| Key Contacts | Empty table with headers: Name, Relationship, Phone, Email, Emergency |
| Medical Information | Allergies, Conditions, Medications, Mobility, Communication, Vision, Hearing, Mental Health |
| Personal Care | Hygiene, Bathing, Dressing, Toileting, Continence, Sleep, Skin Care |
| Dietary Requirements | Restrictions, Allergies, Preferences, Texture, Nutrition, Fluids, Supplements, Feeding |
| Medications | Empty table with headers: Medication, Dosage, Frequency, Time of Day, Instructions, Status |
| Risk Assessments | Empty table with headers: Risk Type, Level, Factors, Assessed By, Date |
| Equipment | Empty table with headers: Name, Type, Manufacturer, Status, Location |
| Goals | Empty table with headers: Goal, Target Date, Status, Priority |
| Activities | Empty table with headers: Activity, Frequency, Duration, Notes |
| Consent | Capacity Assessment, Given By, Date, Notes |
| Additional Notes | Large blank area for handwritten notes |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/services/enhancedPdfGenerator.ts` | Add `generateBlankCarePlanPDF` method and export function |
| `src/components/clients/tabs/CarePlansTab.tsx` | Add "Download Blank" button with click handler |

---

## UI Placement

```text
┌─────────────────────────────────────────────────────────────┐
│ Care Plans                                                   │
│ Care plans and treatment programs for [Client Name]          │
│                                                              │
│                    [📥 Download Blank]  [+ Create Plan]      │
└─────────────────────────────────────────────────────────────┘
```

The "Download Blank" button will:
- Use `FileDown` icon from lucide-react
- Use `variant="outline"` to differentiate from the primary "Create Plan" button
- Be positioned to the left of the "Create Plan" button

---

## Data Flow

```text
User clicks "Download Blank"
         │
         v
CarePlansTab.handleDownloadBlank()
         │
         ├── clientName (from props)
         ├── branchId (from useParams)
         │
         v
generateBlankCarePlanPDF(clientName, clientId, branchName, branchId)
         │
         v
EnhancedPdfGenerator.generateBlankCarePlanPDF()
         │
         v
PDF downloads with filename:
"Blank_Care_Plan_[ClientName]_[Date].pdf"
```

---

## Impact Assessment

**Low Risk:**
- No database changes required
- No changes to existing PDF generation logic
- New standalone function that doesn't affect current exports
- UI change is additive (new button alongside existing)

**Benefits:**
- Provides paper-based assessment option
- Useful for initial client assessments
- Can be completed manually and then digitized
- Professional branded template with all required sections
