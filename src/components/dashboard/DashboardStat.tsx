
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DashboardStatProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  positive: boolean;
}

export const DashboardStat = ({ title, value, change, icon, positive }: DashboardStatProps) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
        <div className={`flex items-center text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? (
            <ArrowUp className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDown className="h-3 w-3 mr-1" />
          )}
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500">{title}</div>
    </div>
  );
};

export default DashboardStat;
