
import React from 'react';
import { BankHolidayNotification } from './BankHolidayNotification';

interface BankHolidayCheckerProps {
  selectedDate: string;
  className?: string;
}

export const BankHolidayChecker: React.FC<BankHolidayCheckerProps> = ({
  selectedDate,
  className = '',
}) => {
  return <BankHolidayNotification date={selectedDate} className={className} variant="warning" />;
};
