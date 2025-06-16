
import React from "react";
import { Phone, Mail, MapPin, Clock, CalendarRange, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranch } from "@/data/hooks/branches";
import { format } from "date-fns";

interface BranchInfoHeaderProps {
  branchId: string;
  onNewBooking?: () => void;
  showNewBookingButton?: boolean;
}

export const BranchInfoHeader = ({ 
  branchId, 
  onNewBooking, 
  showNewBookingButton = true 
}: BranchInfoHeaderProps) => {
  const { data: branchData, isLoading, error } = useBranch(branchId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            
            <div className="flex flex-row items-center gap-3 mt-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          </div>
          
          {showNewBookingButton && (
            <Skeleton className="h-9 w-32" />
          )}
        </div>
      </div>
    );
  }

  if (error || !branchData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-400">Branch Information</h1>
              <Badge variant="destructive" className="text-xs">
                Error Loading
              </Badge>
            </div>
            <p className="text-sm text-gray-500">Unable to load branch information</p>
          </div>
          
          {showNewBookingButton && (
            <Button 
              onClick={onNewBooking} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!onNewBooking}
            >
              New Booking
            </Button>
          )}
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatEstablishedDate = (date: string | null) => {
    if (!date) return "Est. 2020";
    try {
      return `Est. ${format(new Date(date), 'yyyy')}`;
    } catch {
      return "Est. 2020";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl md:text-2xl font-bold">{branchData.name}</h1>
            <Badge variant={getStatusVariant(branchData.status)} className="text-xs">
              {branchData.status || 'Active'}
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600">
            {branchData.address && (
              <>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-gray-500" />
                  <span>{branchData.address}</span>
                </div>
                <div className="hidden md:flex items-center text-gray-300">|</div>
              </>
            )}
            {branchData.phone && (
              <>
                <div className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-gray-500" />
                  <span>{branchData.phone}</span>
                </div>
                <div className="hidden md:flex items-center text-gray-300">|</div>
              </>
            )}
            {branchData.email && (
              <div className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-gray-500" />
                <span>{branchData.email}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-row items-center gap-3 mt-2 text-xs text-gray-500">
            {branchData.operating_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{branchData.operating_hours}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5" />
              <span>{formatEstablishedDate(branchData.established_date)}</span>
            </div>
          </div>
          
          {(branchData.branch_type || branchData.country || branchData.regulatory) && (
            <div className="mt-2 text-xs text-gray-500">
              {[branchData.branch_type, branchData.country, branchData.regulatory]
                .filter(Boolean)
                .join(' | ')}
            </div>
          )}
        </div>
        
        {showNewBookingButton && (
          <div className="flex justify-start md:justify-end">
            <Button 
              onClick={onNewBooking} 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!onNewBooking}
            >
              New Booking
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
