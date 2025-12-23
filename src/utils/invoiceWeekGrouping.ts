import { format, startOfWeek, endOfWeek, isValid, parseISO } from 'date-fns';

export interface InvoiceLineItem {
  id: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
  discount_amount?: number;
  visit_date?: string | null;
}

export interface WeekGroup {
  weekNumber: number;
  weekLabel: string;
  startDate: Date;
  endDate: Date;
  items: InvoiceLineItem[];
  visitCount: number;
  weekSubtotal: number;
}

/**
 * Groups invoice line items by calendar week (Monday-Sunday)
 * @param lineItems - Array of line items to group
 * @returns Array of WeekGroup objects sorted by week
 */
export function groupLineItemsByWeek(lineItems: InvoiceLineItem[]): WeekGroup[] {
  if (!lineItems || lineItems.length === 0) {
    return [];
  }

  // Separate items with valid dates from those without
  const itemsWithDates: { item: InvoiceLineItem; date: Date }[] = [];
  const itemsWithoutDates: InvoiceLineItem[] = [];

  lineItems.forEach(item => {
    if (item.visit_date) {
      try {
        const date = typeof item.visit_date === 'string' 
          ? parseISO(item.visit_date) 
          : new Date(item.visit_date);
        
        if (isValid(date)) {
          itemsWithDates.push({ item, date });
        } else {
          itemsWithoutDates.push(item);
        }
      } catch {
        itemsWithoutDates.push(item);
      }
    } else {
      itemsWithoutDates.push(item);
    }
  });

  // Sort items by date
  itemsWithDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by week (Monday-Sunday)
  const weekMap = new Map<string, {
    startDate: Date;
    endDate: Date;
    items: InvoiceLineItem[];
  }>();

  itemsWithDates.forEach(({ item, date }) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
    const weekKey = weekStart.toISOString();

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        startDate: weekStart,
        endDate: weekEnd,
        items: []
      });
    }
    weekMap.get(weekKey)!.items.push(item);
  });

  // Convert map to array and sort by date
  const sortedWeeks = Array.from(weekMap.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

  // Build WeekGroup array
  const weekGroups: WeekGroup[] = sortedWeeks.map((entry, index) => {
    const [, weekData] = entry;
    const weekSubtotal = weekData.items.reduce(
      (sum, item) => sum + (item.line_total || 0),
      0
    );

    return {
      weekNumber: index + 1,
      weekLabel: `Week ${index + 1}: ${format(weekData.startDate, 'dd MMM yyyy')} – ${format(weekData.endDate, 'dd MMM yyyy')}`,
      startDate: weekData.startDate,
      endDate: weekData.endDate,
      items: weekData.items,
      visitCount: weekData.items.length,
      weekSubtotal
    };
  });

  // Add items without dates as "Other Services" if any exist
  if (itemsWithoutDates.length > 0) {
    const otherSubtotal = itemsWithoutDates.reduce(
      (sum, item) => sum + (item.line_total || 0),
      0
    );

    weekGroups.push({
      weekNumber: weekGroups.length + 1,
      weekLabel: 'Other Services',
      startDate: new Date(),
      endDate: new Date(),
      items: itemsWithoutDates,
      visitCount: itemsWithoutDates.length,
      weekSubtotal: otherSubtotal
    });
  }

  return weekGroups;
}

/**
 * Format a date for display in line items (e.g., "Mon 01 Dec")
 */
export function formatVisitDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '-';
  
  try {
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    if (!isValid(date)) return '-';
    return format(date, 'EEE dd MMM');
  } catch {
    return '-';
  }
}
