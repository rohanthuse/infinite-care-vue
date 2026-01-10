import { useState } from "react";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BOOKING_STATUS_COLORS, BookingStatusType } from "./utils/bookingColors";

// Define which statuses to show in legend (primary booking statuses only)
const LEGEND_STATUSES: BookingStatusType[] = [
  'assigned',
  'unassigned',
  'done',
  'in-progress',
  'missed',
  'cancelled',
  'departed',
  'suspended'
];

// Color dot classes matching the solid variant
const LEGEND_DOT_COLORS: Record<BookingStatusType, string> = {
  assigned: 'bg-green-500',
  unassigned: 'bg-yellow-500',
  done: 'bg-blue-500',
  'in-progress': 'bg-purple-500',
  missed: 'bg-red-500',
  late: 'bg-orange-500',
  cancelled: 'bg-slate-500',
  departed: 'bg-teal-500',
  suspended: 'bg-gray-500',
  training: 'bg-amber-500',
  meeting: 'bg-indigo-500',
};

export function BookingStatusLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3 mb-2">
      {/* Desktop: Inline horizontal */}
      <div className="hidden md:flex items-center gap-4 flex-wrap p-2 bg-muted/30 rounded-lg border border-border/50">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          Status:
        </span>
        {LEGEND_STATUSES.map(status => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${LEGEND_DOT_COLORS[status]}`} />
            <span className="text-xs text-foreground">
              {BOOKING_STATUS_COLORS[status].label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile: Collapsible */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="md:hidden">
        <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground p-2 w-full bg-muted/30 rounded-lg border border-border/50">
          <Info className="h-3 w-3" />
          <span>Status Legend</span>
          {isOpen ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-2 bg-muted/30 rounded-b-lg border-x border-b border-border/50 -mt-1">
          <div className="grid grid-cols-2 gap-2">
            {LEGEND_STATUSES.map(status => (
              <div key={status} className="flex items-center gap-1.5">
                <span className={`w-3 h-3 rounded-full ${LEGEND_DOT_COLORS[status]}`} />
                <span className="text-xs text-foreground">
                  {BOOKING_STATUS_COLORS[status].label}
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
