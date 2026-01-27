
# Plan: Care Plan Review Alert System for Carers

## Problem Statement
Currently, when a care plan's review date is approaching or has passed, only **branch admins** receive notifications. Carers who are assigned to these care plans are not alerted when the care plans of their clients need updating, which can lead to outdated care being delivered.

## Solution Overview
Implement a multi-layered alert system that notifies carers when care plans assigned to them are due for review. This includes:
1. A **scheduled cron job** that checks daily for care plans approaching or past their review dates
2. **Database function** to generate notifications for assigned carers
3. **UI alerts** in the carer dashboard and care plans page
4. **Enhanced CarePlanStatusWidget** showing review-due care plans

---

## Implementation Steps

### Step 1: Create Database Function for Carer Review Notifications

Create a new PostgreSQL function that:
- Finds all care plans with review dates within 7 days or overdue
- Identifies carers assigned via both `staff_id` and `care_plan_staff_assignments` table
- Generates notifications for each assigned carer
- Prevents duplicate notifications using a deduplication check

**New File:** SQL Migration

```sql
CREATE OR REPLACE FUNCTION public.process_care_plan_review_alerts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_count INTEGER := 0;
  care_plan_record RECORD;
  staff_record RECORD;
  days_until_review INTEGER;
  notification_priority TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Find care plans with review dates within 7 days or overdue
  FOR care_plan_record IN
    SELECT 
      cp.id,
      cp.display_id,
      cp.title,
      cp.review_date,
      cp.staff_id,
      cp.client_id,
      c.first_name AS client_first_name,
      c.last_name AS client_last_name,
      c.branch_id
    FROM client_care_plans cp
    JOIN clients c ON c.id = cp.client_id
    WHERE cp.review_date IS NOT NULL
      AND cp.status = 'active'
      AND cp.review_date <= CURRENT_DATE + INTERVAL '7 days'
  LOOP
    days_until_review := (care_plan_record.review_date::date - CURRENT_DATE);
    
    -- Set priority based on urgency
    IF days_until_review < 0 THEN
      notification_priority := 'urgent';
      notification_title := 'Care Plan OVERDUE for Review';
      notification_message := 'Care plan ' || care_plan_record.display_id || 
        ' for ' || care_plan_record.client_first_name || ' ' || 
        care_plan_record.client_last_name || ' is ' || 
        ABS(days_until_review) || ' days overdue for review';
    ELSIF days_until_review <= 3 THEN
      notification_priority := 'high';
      notification_title := 'Care Plan Review Due Soon';
      notification_message := 'Care plan ' || care_plan_record.display_id || 
        ' for ' || care_plan_record.client_first_name || ' ' || 
        care_plan_record.client_last_name || ' is due for review in ' || 
        days_until_review || ' days';
    ELSE
      notification_priority := 'medium';
      notification_title := 'Upcoming Care Plan Review';
      notification_message := 'Care plan ' || care_plan_record.display_id || 
        ' for ' || care_plan_record.client_first_name || ' ' || 
        care_plan_record.client_last_name || ' is due for review on ' || 
        to_char(care_plan_record.review_date::date, 'DD Mon YYYY');
    END IF;
    
    -- Notify carers from junction table
    FOR staff_record IN
      SELECT DISTINCT s.auth_user_id
      FROM care_plan_staff_assignments cpsa
      JOIN staff s ON s.id = cpsa.staff_id
      WHERE cpsa.care_plan_id = care_plan_record.id
        AND s.auth_user_id IS NOT NULL
    LOOP
      -- Check for existing recent notification (within 24 hours)
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = staff_record.auth_user_id
          AND type = 'care_plan'
          AND (data->>'care_plan_id')::uuid = care_plan_record.id
          AND (data->>'action') = 'review_due'
          AND created_at > NOW() - INTERVAL '24 hours'
      ) THEN
        INSERT INTO notifications (
          user_id, branch_id, type, category, priority,
          title, message, data
        ) VALUES (
          staff_record.auth_user_id,
          care_plan_record.branch_id,
          'care_plan',
          'warning',
          notification_priority,
          notification_title,
          notification_message,
          jsonb_build_object(
            'care_plan_id', care_plan_record.id,
            'display_id', care_plan_record.display_id,
            'client_id', care_plan_record.client_id,
            'client_name', care_plan_record.client_first_name || ' ' || care_plan_record.client_last_name,
            'review_date', care_plan_record.review_date,
            'days_until_review', days_until_review,
            'action', 'review_due'
          )
        );
        notification_count := notification_count + 1;
      END IF;
    END LOOP;
    
    -- Also notify legacy staff_id assignment
    IF care_plan_record.staff_id IS NOT NULL THEN
      SELECT s.auth_user_id INTO staff_record
      FROM staff s WHERE s.id = care_plan_record.staff_id;
      
      IF staff_record.auth_user_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE user_id = staff_record.auth_user_id
          AND type = 'care_plan'
          AND (data->>'care_plan_id')::uuid = care_plan_record.id
          AND (data->>'action') = 'review_due'
          AND created_at > NOW() - INTERVAL '24 hours'
      ) THEN
        INSERT INTO notifications (
          user_id, branch_id, type, category, priority,
          title, message, data
        ) VALUES (
          staff_record.auth_user_id,
          care_plan_record.branch_id,
          'care_plan',
          'warning',
          notification_priority,
          notification_title,
          notification_message,
          jsonb_build_object(
            'care_plan_id', care_plan_record.id,
            'display_id', care_plan_record.display_id,
            'client_id', care_plan_record.client_id,
            'client_name', care_plan_record.client_first_name || ' ' || care_plan_record.client_last_name,
            'review_date', care_plan_record.review_date,
            'days_until_review', days_until_review,
            'action', 'review_due'
          )
        );
        notification_count := notification_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'notifications_created', notification_count,
    'processed_at', NOW()
  );
END;
$$;
```

### Step 2: Update Edge Function to Process Care Plan Review Alerts

**File to Modify:** `supabase/functions/process-system-notifications/index.ts`

Add a call to the new `process_care_plan_review_alerts` function alongside existing system notification processing.

### Step 3: Create Hook for Care Plans Needing Review

**New File:** `src/hooks/useCarePlansNeedingReview.ts`

Create a React hook that fetches care plans assigned to the carer that have:
- Review date within 7 days (upcoming)
- Review date in the past (overdue)

```typescript
export const useCarePlansNeedingReview = (staffId: string) => {
  return useQuery({
    queryKey: ['care-plans-needing-review', staffId],
    queryFn: async () => {
      // Query via junction table
      const { data: assignments } = await supabase
        .from('care_plan_staff_assignments')
        .select(`
          care_plan:client_care_plans(
            id, display_id, title, review_date, status,
            client:clients(id, first_name, last_name)
          )
        `)
        .eq('staff_id', staffId);
      
      // Filter for upcoming/overdue reviews
      const now = new Date();
      const sevenDaysFromNow = addDays(now, 7);
      
      return assignments?.filter(a => {
        const reviewDate = a.care_plan?.review_date;
        return reviewDate && 
          a.care_plan?.status === 'active' &&
          new Date(reviewDate) <= sevenDaysFromNow;
      }).map(a => ({
        ...a.care_plan,
        daysUntilReview: differenceInDays(new Date(a.care_plan.review_date), now),
        isOverdue: new Date(a.care_plan.review_date) < now
      }));
    },
    enabled: !!staffId
  });
};
```

### Step 4: Create Care Plan Review Alert Component

**New File:** `src/components/carer/CarePlanReviewAlerts.tsx`

A visual alert card/banner for the carer dashboard showing care plans needing review.

| Element | Description |
|---------|-------------|
| Header | "Care Plans Needing Review" with AlertTriangle icon |
| Overdue Section | Red-highlighted list of overdue care plans |
| Upcoming Section | Orange/yellow list of care plans due within 7 days |
| Action Button | "View Care Plan" navigates to the specific care plan |

### Step 5: Update CarePlanStatusWidget

**File to Modify:** `src/components/carer/CarePlanStatusWidget.tsx`

Add a new section showing "Needs Review" count alongside Active and Pending counts. When clicked, it filters to show only care plans needing review.

### Step 6: Update CarerOverview Dashboard

**File to Modify:** `src/pages/carer/CarerOverview.tsx`

Add the `CarePlanReviewAlerts` component to the dashboard, positioned prominently near the top of the page.

### Step 7: Add Visual Indicators to CarerCarePlans Page

**File to Modify:** `src/pages/carer/CarerCarePlans.tsx`

- Add a "Needs Review" tab filter
- Show visual indicator (badge/icon) on care plan cards for those needing review
- Display review date and days until/since review

---

## Technical Details

### Files to Create

| File | Purpose |
|------|---------|
| SQL Migration | Database function `process_care_plan_review_alerts` |
| `src/hooks/useCarePlansNeedingReview.ts` | Hook to fetch care plans needing review |
| `src/components/carer/CarePlanReviewAlerts.tsx` | Alert component for dashboard |

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/process-system-notifications/index.ts` | Add RPC call to process review alerts |
| `src/components/carer/CarePlanStatusWidget.tsx` | Add "Needs Review" stat and section |
| `src/pages/carer/CarerOverview.tsx` | Add CarePlanReviewAlerts component |
| `src/pages/carer/CarerCarePlans.tsx` | Add review status indicators and filter |
| `src/utils/notificationLevels.ts` | Ensure `care_plan` type is in branch-level notifications |

### Notification Data Structure

```typescript
interface CarePlanReviewNotification {
  type: 'care_plan';
  category: 'warning';
  priority: 'urgent' | 'high' | 'medium';
  title: string;
  message: string;
  data: {
    care_plan_id: string;
    display_id: string;
    client_id: string;
    client_name: string;
    review_date: string;
    days_until_review: number;
    action: 'review_due';
  };
}
```

---

## Data Flow

```text
Daily Cron Job (6 AM)
        |
        v
process-system-notifications (Edge Function)
        |
        v
process_care_plan_review_alerts() (Database Function)
        |
        +---> Check care_plan_staff_assignments
        |           |
        |           v
        |     Get assigned staff auth_user_ids
        |           |
        +---> Check client_care_plans.staff_id (legacy)
                    |
                    v
              Insert notifications for each carer
                    |
                    v
              Carer sees alert in:
              - Notification bell
              - Dashboard widget
              - Care Plans page
```

---

## Cron Schedule

Add to existing cron job or create new one to run daily at 6 AM:

```sql
SELECT cron.schedule(
  'process-care-plan-review-alerts',
  '0 6 * * *',
  $$ SELECT net.http_post(...) $$
);
```

---

## Testing Checklist

- [ ] Create a care plan with review_date set to tomorrow
- [ ] Assign a carer to the care plan via junction table
- [ ] Manually trigger `process_care_plan_review_alerts()` function
- [ ] Verify carer receives notification
- [ ] Log in as carer and check dashboard shows alert
- [ ] Verify care plan card shows "Review Due" indicator
- [ ] Click notification and verify navigation to care plan
- [ ] Test overdue care plan (review_date in past) shows urgent priority
- [ ] Verify no duplicate notifications within 24 hours

---

## Impact Assessment

**Low-Medium Risk:**
- Builds on existing notification infrastructure
- Uses proven patterns from subscription expiry and agreement notifications
- No changes to care plan data structure
- Adds read-only queries for carer views

**Performance:**
- Cron runs once daily at low-traffic time
- Indexes already exist on `care_plan_staff_assignments.staff_id`
- Deduplication prevents notification spam

**UI Impact:**
- New alert section on carer dashboard
- New filter tab on care plans page
- Enhanced CarePlanStatusWidget with review stats
