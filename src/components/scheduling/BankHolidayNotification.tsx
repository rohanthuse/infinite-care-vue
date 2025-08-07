import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useBankHolidays } from '@/hooks/useKeyParameters';

interface BankHolidayNotificationProps {
  date: Date | string;
  className?: string;
  showIcon?: boolean;
  variant?: 'warning' | 'info';
}

export const BankHolidayNotification: React.FC<BankHolidayNotificationProps> = ({
  date,
  className = '',
  showIcon = true,
  variant = 'warning'
}) => {
  const { data: bankHolidays, isLoading } = useBankHolidays();

  if (isLoading) return null;

  const selectedDate = new Date(date);
  const bankHoliday = bankHolidays?.find(holiday => {
    const holidayDate = new Date(holiday.registered_on);
    return holidayDate.toDateString() === selectedDate.toDateString() && 
           holiday.status === 'Active';
  });

  if (!bankHoliday) return null;

  const isWarning = variant === 'warning';
  const alertClass = isWarning 
    ? 'border-orange-200 bg-orange-50' 
    : 'border-blue-200 bg-blue-50';
  const iconClass = isWarning ? 'text-orange-600' : 'text-blue-600';
  const textClass = isWarning ? 'text-orange-700' : 'text-blue-700';

  return (
    <Alert className={`${alertClass} ${className}`}>
      {showIcon && (
        isWarning ? (
          <AlertTriangle className={`h-4 w-4 ${iconClass}`} />
        ) : (
          <Calendar className={`h-4 w-4 ${iconClass}`} />
        )
      )}
      <AlertDescription className={textClass}>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            <strong>{bankHoliday.title}</strong> - Bank Holiday
            {isWarning && (
              <span className="block text-sm mt-1">
                Consider staffing requirements and holiday pay rates.
              </span>
            )}
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Enhanced checker for booking forms
export const BankHolidayBookingChecker: React.FC<{
  selectedDate: string;
  onHolidayDetected?: (holiday: any) => void;
}> = ({ selectedDate, onHolidayDetected }) => {
  const { data: bankHolidays } = useBankHolidays();

  React.useEffect(() => {
    if (bankHolidays && selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      const holiday = bankHolidays.find(holiday => {
        const holidayDate = new Date(holiday.registered_on);
        return holidayDate.toDateString() === selectedDateObj.toDateString() && 
               holiday.status === 'Active';
      });
      
      if (holiday && onHolidayDetected) {
        onHolidayDetected(holiday);
      }
    }
  }, [bankHolidays, selectedDate, onHolidayDetected]);

  return <BankHolidayNotification date={selectedDate} variant="warning" />;
};