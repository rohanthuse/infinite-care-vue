
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useBankHolidays } from '@/hooks/useKeyParameters';

interface BankHolidayCheckerProps {
  selectedDate: string;
  className?: string;
}

export const BankHolidayChecker: React.FC<BankHolidayCheckerProps> = ({
  selectedDate,
  className = '',
}) => {
  const { data: bankHolidays, isLoading } = useBankHolidays();

  if (isLoading) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Checking bank holidays...
      </div>
    );
  }

  const selectedDateObj = new Date(selectedDate);
  const isBankHoliday = bankHolidays?.find(holiday => {
    const holidayDate = new Date(holiday.registered_on);
    return holidayDate.toDateString() === selectedDateObj.toDateString() && 
           holiday.status === 'Active';
  });

  if (!isBankHoliday) {
    return null;
  }

  return (
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-700">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>
            <strong>{isBankHoliday.title}</strong> - This is a bank holiday. 
            Consider any special scheduling requirements.
          </span>
        </div>
      </AlertDescription>
    </Alert>
  );
};
