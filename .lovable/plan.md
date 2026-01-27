
# Plan: Add Follow-Up Assignment to Communication Messages

## Problem Statement
When composing a message and ticking "Action Required", there is no way to specify:
- **Who** should take the action (assigned staff member)
- **When** the action is due (follow-up date)
- **What** specific notes describe the required action

The Events/Logs module already has this functionality, but the Communications module only has the basic checkbox without the follow-up fields.

---

## Current State vs Desired State

| Current (Communication) | Desired (Like Events/Logs) |
|------------------------|---------------------------|
| Action Required checkbox only | Action Required checkbox |
| No assignee selection | + Assigned To (staff dropdown) |
| No date field | + Follow-up Date |
| No notes field | + Follow-up Notes |

---

## Solution Overview

### 1. Database Changes
Add three new columns to the `messages` table to store follow-up information.

### 2. UI Changes
When "Action Required" is ticked in the MessageComposer, reveal additional fields for:
- Assigned To (staff member dropdown)
- Follow-up Date (date picker)
- Follow-up Notes (text area)

### 3. Display Changes
Update MessageView and MessageList to show follow-up assignment details when viewing messages.

---

## Implementation Steps

### Step 1: Database Migration
Add the follow-up columns to the `messages` table.

```sql
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS follow_up_assigned_to UUID REFERENCES staff(id),
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
```

### Step 2: Update MessageComposer.tsx
Add the follow-up fields that appear when "Action Required" is checked.

**New state variables:**
- `followUpAssignedTo` (string)
- `followUpDate` (string)
- `followUpNotes` (string)

**New UI section (after the Action Required checkbox):**
When `actionRequired` is true, show:
- Staff member dropdown using the available contacts or a dedicated staff hook
- Date input for follow-up date
- Textarea for follow-up notes

### Step 3: Update Message Sending Logic
Modify `useUnifiedMessaging.ts` to include the new fields when sending messages.

**Files to modify:**
- `useUnifiedCreateThread` mutation - add follow-up parameters
- `useUnifiedSendMessage` mutation - add follow-up parameters

### Step 4: Update Message Display
Modify `MessageView.tsx` to display follow-up information when viewing a message.

**Display format (similar to EventFollowUpView):**
- Yellow/amber highlighted section showing:
  - Assigned To: [Staff Name]
  - Due Date: [Date]
  - Notes: [Text]

### Step 5: Update Message Types
Update the `UnifiedMessage` interface in `useUnifiedMessaging.ts` to include the new fields.

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| SQL Migration | Add `follow_up_assigned_to`, `follow_up_date`, `follow_up_notes` columns to messages table |
| `src/components/communications/MessageComposer.tsx` | Add follow-up fields UI when action required is checked |
| `src/hooks/useUnifiedMessaging.ts` | Add follow-up fields to message mutations and interfaces |
| `src/components/communications/MessageView.tsx` | Display follow-up assignment details |
| `src/integrations/supabase/types.ts` | Will auto-update after migration |

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/communications/MessageFollowUpSection.tsx` | Reusable follow-up fields component for message composer |
| `src/components/communications/MessageFollowUpView.tsx` | Display component for follow-up info in message view |

---

## UI Layout in MessageComposer

```text
┌─────────────────────────────────────────┐
│ [x] Action Required?                    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Assigned To: [Select staff member ▼]│ │
│ │ Follow-up Date: [Date picker      ] │ │
│ │ Notes: [Describe the required       │ │
│ │        actions...]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [ ] Admin Eyes Only                     │
└─────────────────────────────────────────┘
```

---

## Data Flow

```text
MessageComposer
    │
    ├── actionRequired: true
    ├── followUpAssignedTo: "staff-uuid"
    ├── followUpDate: "2026-02-15"
    └── followUpNotes: "Follow up with client..."
         │
         v
useUnifiedSendMessage / useUnifiedCreateThread
         │
         v
messages table (with new columns)
         │
         v
MessageView displays follow-up info
```

---

## Staff List Source
The component will use `useStaffList` from `src/hooks/useAccountingData.ts` to populate the staff dropdown, filtered by the current branch context. This provides a consistent staff list already used elsewhere in the application.

---

## Impact Assessment

**Low-Medium Risk:**
- Database migration adds nullable columns (non-breaking)
- UI changes are additive (existing checkbox behavior unchanged)
- Follows existing pattern from Events/Logs module
- No changes to existing data

**Benefits:**
- Clear accountability for who needs to take action
- Deadline tracking for follow-ups
- Detailed notes for context
- Consistent with Events/Logs follow-up system
