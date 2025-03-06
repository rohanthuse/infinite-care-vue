
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, MapPin, Phone, Mail, Plus } from "lucide-react";

interface BranchHeaderProps {
  id?: string;
  branchName?: string;
  onNewBooking?: () => void;
}

export const BranchHeader: React.FC<BranchHeaderProps> = ({ 
  id, 
  branchName,
  onNewBooking 
}) => {
  const location = useLocation();
  
  return (
    <div className="mb-6">
      <Breadcrumb className="mb-2">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/branch">
              <Home className="h-4 w-4 mr-1" />
              Branches
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink>
            {branchName || "Branch"}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-800">{branchName || "Branch"}</h1>
            <Badge className="bg-green-100 text-green-800 border border-green-200">Active</Badge>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2 text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Milton Keynes, UK</span>
            </div>
            <div className="hidden sm:block h-4 w-0.5 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              <span>+44 20 7946 0958</span>
            </div>
            <div className="hidden sm:block h-4 w-0.5 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>milton@med-infinite.com</span>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={onNewBooking}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking</span>
        </Button>
      </div>
      
      <div className="flex overflow-x-auto pb-2 hide-scrollbar">
        <div className="flex space-x-2 border-b border-gray-200 w-full">
          <Link 
            to={`/branch-dashboard/${id}/${branchName}`} 
            className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap"
          >
            <span>Dashboard</span>
          </Link>
          <Link 
            to={`/branch-dashboard/${id}/${branchName}/bookings`} 
            className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap"
          >
            <span>Bookings</span>
          </Link>
          <Link 
            to={`/branch-dashboard/${id}/${branchName}/clients`} 
            className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap"
          >
            <span>Clients</span>
          </Link>
          <Link 
            to={`/branch-dashboard/${id}/${branchName}/carers`} 
            className="px-4 py-2 text-gray-600 hover:text-blue-600 flex items-center gap-1 whitespace-nowrap"
          >
            <span>Carers</span>
          </Link>
          <Link 
            to={`/branch-dashboard/${id}/${branchName}/task-matrix`} 
            className={`px-4 py-2 flex items-center gap-1 whitespace-nowrap ${
              location.pathname.includes('task-matrix') 
                ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <span>Task Matrix</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
