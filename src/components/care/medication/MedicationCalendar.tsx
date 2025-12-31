import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isWithinInterval, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  shape?: string;
  route?: string;
  who_administers?: string;
  level?: string;
  instruction?: string;
  warning?: string;
  side_effect?: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status?: string;
}

interface MedicationCalendarProps {
  medications: Medication[];
  onAddMedication: () => void;
}

// Helper to calculate medication occurrences for a given day
const getMedicationsForDay = (medications: Medication[], date: Date): Medication[] => {
  return medications.filter(med => {
    const startDate = parseISO(med.start_date);
    const endDate = med.end_date ? parseISO(med.end_date) : null;
    
    // Check if the date is within the medication period
    if (date < startDate) return false;
    if (endDate && date > endDate) return false;
    
    // Check frequency
    switch (med.frequency) {
      case 'once_daily':
      case 'twice_daily':
      case 'three_times_daily':
        return true;
      case 'every_other_day':
        const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff % 2 === 0;
      case 'weekly':
        return date.getDay() === startDate.getDay();
      case 'monthly':
        return date.getDate() === startDate.getDate();
      case 'as_needed':
        return false; // Don't show as_needed on calendar automatically
      default:
        return true;
    }
  });
};

// Helper to get frequency display for badge
const getFrequencyDisplay = (frequency: string): string => {
  switch (frequency) {
    case 'once_daily': return '1x';
    case 'twice_daily': return '2x';
    case 'three_times_daily': return '3x';
    case 'every_other_day': return 'EOD';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'as_needed': return 'PRN';
    default: return '1x';
  }
};

export function MedicationCalendar({ medications, onAddMedication }: MedicationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday)
  const firstDayOfWeek = getDay(monthStart);
  
  // Create padding days for proper calendar grid
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => null);
  
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Medication Calendar</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToToday}
            className="text-xs"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="min-w-[140px] text-center">
              <span className="font-medium">
                {format(currentDate, 'MMMM yyyy')}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToNextMonth}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={onAddMedication} size="sm">
            <CalendarIcon className="h-4 w-4 mr-1" />
            Add Medication
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="border rounded-lg">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium bg-muted/50">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar body */}
        <div className="grid grid-cols-7">
          {/* Padding days */}
          {paddingDays.map((_, index) => (
            <div key={`padding-${index}`} className="h-20 border-r border-b bg-muted/20" />
          ))}
          
          {/* Actual days */}
          {daysInMonth.map(date => {
            const dayMedications = getMedicationsForDay(medications, date);
            const isCurrentDay = isToday(date);
            
            return (
              <div 
                key={date.toISOString()} 
                className={`h-20 border-r border-b p-1 relative overflow-hidden ${
                  isCurrentDay ? 'bg-primary/5' : 'hover:bg-muted/30'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay ? 'text-primary font-semibold' : ''
                }`}>
                  {format(date, 'd')}
                </div>
                
                {/* Medication badges */}
                <div className="space-y-0.5 overflow-hidden max-h-[52px]">
                  {dayMedications.slice(0, 2).map((medication, index) => (
                    <HoverCard key={`${medication.name}-${index}`}>
                      <HoverCardTrigger asChild>
                        <Badge 
                          variant="secondary" 
                          className="text-xs cursor-pointer block truncate"
                        >
                          {medication.name} {getFrequencyDisplay(medication.frequency)}
                        </Badge>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{medication.name}</h4>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Dosage:</span> {medication.dosage}</p>
                            {medication.shape && (
                              <p><span className="font-medium">Shape:</span> {medication.shape}</p>
                            )}
                            {medication.route && (
                              <p><span className="font-medium">Route:</span> {medication.route}</p>
                            )}
                            {medication.who_administers && (
                              <p><span className="font-medium">Who Administers:</span> {medication.who_administers}</p>
                            )}
                            {medication.level && (
                              <p><span className="font-medium">Level:</span> {medication.level}</p>
                            )}
                            <p><span className="font-medium">Frequency:</span> {medication.frequency.replace(/_/g, ' ')}</p>
                            <p><span className="font-medium">Start Date:</span> {format(parseISO(medication.start_date), 'MMM d, yyyy')}</p>
                            {medication.end_date && (
                              <p><span className="font-medium">End Date:</span> {format(parseISO(medication.end_date), 'MMM d, yyyy')}</p>
                            )}
                            {medication.instruction && (
                              <div>
                                <span className="font-medium">Instructions:</span>
                                <p className="text-xs mt-1 text-muted-foreground">{medication.instruction}</p>
                              </div>
                            )}
                            {medication.warning && (
                              <div>
                                <span className="font-medium text-amber-600">Warning:</span>
                                <p className="text-xs mt-1 text-amber-600">{medication.warning}</p>
                              </div>
                            )}
                            {medication.side_effect && (
                              <div>
                                <span className="font-medium">Side Effects:</span>
                                <p className="text-xs mt-1 text-muted-foreground">{medication.side_effect}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                  
                  {/* Show overflow indicator */}
                  {dayMedications.length > 2 && (
                    <Badge variant="outline" className="text-xs block truncate w-full text-center">
                      +{dayMedications.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}