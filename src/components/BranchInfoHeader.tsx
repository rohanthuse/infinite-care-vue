
import React from "react";
import { Phone, Mail, MapPin, Clock, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BranchInfoHeaderProps {
  branchName: string;
  branchId: string;
  onNewBooking: () => void;
}

export const BranchInfoHeader = ({ branchName, branchId, onNewBooking }: BranchInfoHeaderProps) => {
  // These would typically come from an API call based on branchId
  // For now, we'll use static mock data
  const branchInfo = {
    status: "Active",
    address: "Milton Keynes, MK9 3NZ",
    phone: "+44 20 7946 0587",
    email: "milton@med-infinite.com",
    operatingHours: "Mon-Fri: 8:00 - 18:00",
    establishedDate: "Est. 2020"
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl md:text-2xl font-bold">{branchName}</h1>
            <Badge variant="success" className="text-xs">
              {branchInfo.status}
            </Badge>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-500" />
              <span>{branchInfo.address}</span>
            </div>
            <div className="hidden md:flex items-center text-gray-300">|</div>
            <div className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5 text-gray-500" />
              <span>{branchInfo.phone}</span>
            </div>
            <div className="hidden md:flex items-center text-gray-300">|</div>
            <div className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <span>{branchInfo.email}</span>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-3 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{branchInfo.operatingHours}</span>
            </div>
            <div className="flex items-center gap-1">
              <CalendarRange className="h-3.5 w-3.5" />
              <span>{branchInfo.establishedDate}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-start md:justify-end">
          <Button onClick={onNewBooking} className="bg-blue-600 hover:bg-blue-700">
            New Booking
          </Button>
        </div>
      </div>
    </div>
  );
};
