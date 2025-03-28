
import React, { useState } from "react";
import { 
  Table, TableHeader, TableRow, TableHead, 
  TableBody, TableCell 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Download, Eye, Filter, Calendar,
  ChevronDown, Search
} from "lucide-react";
import { format } from "date-fns";

interface CarePlan {
  id: string;
  cpNumber: string;
  fullName: string;
  createdOn: Date;
  version: number;
  confirmedOn: Date;
  confirmedBy: string;
  clientConfirmedOn: Date | null;
}

export const CarePlansTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Mock data based on the image
  const carePlans: CarePlan[] = [
    { id: "1", cpNumber: "CP-100019", fullName: "Ahmad, Dilwar", createdOn: new Date(2025, 0, 30), version: 2, confirmedOn: new Date(2025, 0, 30), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "2", cpNumber: "CP-100018", fullName: "Fulcher, Patricia", createdOn: new Date(2025, 0, 29), version: 3, confirmedOn: new Date(2025, 0, 29), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "3", cpNumber: "CP-100017", fullName: "Richards, Barrie", createdOn: new Date(2025, 0, 21), version: 7, confirmedOn: new Date(2025, 0, 29), confirmedBy: "Ayo-Famure, Opeyemi", clientConfirmedOn: null },
    { id: "4", cpNumber: "CP-100016", fullName: "Pender, Eva", createdOn: new Date(2025, 0, 27), version: 3, confirmedOn: new Date(2025, 0, 27), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: new Date(2025, 0, 27) },
    { id: "5", cpNumber: "CP-100015", fullName: "Fulcher, Patricia", createdOn: new Date(2025, 0, 23), version: 2, confirmedOn: new Date(2025, 0, 23), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "6", cpNumber: "CP-100014", fullName: "Richards, Barrie", createdOn: new Date(2025, 0, 21), version: 6, confirmedOn: new Date(2025, 0, 21), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: new Date(2025, 0, 28) },
    { id: "7", cpNumber: "CP-100013", fullName: "Richards, Barrie", createdOn: new Date(2025, 0, 17), version: 5, confirmedOn: new Date(2025, 0, 17), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "8", cpNumber: "CP-100012", fullName: "Allsop, Christine", createdOn: new Date(2025, 0, 1), version: 1, confirmedOn: new Date(2025, 0, 1), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "9", cpNumber: "CP-100011", fullName: "Fulcher, Patricia", createdOn: new Date(2024, 11, 31), version: 1, confirmedOn: new Date(2024, 11, 31), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "10", cpNumber: "CP-100010", fullName: "Richards, Barrie", createdOn: new Date(2024, 11, 31), version: 4, confirmedOn: new Date(2024, 11, 31), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "11", cpNumber: "CP-100009", fullName: "Pender, Eva", createdOn: new Date(2024, 11, 31), version: 2, confirmedOn: new Date(2024, 11, 31), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "12", cpNumber: "CP-100008", fullName: "Pender, Eva", createdOn: new Date(2024, 11, 15), version: 1, confirmedOn: new Date(2024, 11, 31), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "13", cpNumber: "CP-100007", fullName: "Richards, Barrie", createdOn: new Date(2024, 11, 20), version: 3, confirmedOn: new Date(2024, 11, 20), confirmedBy: "Ayo-Famure, Opeyemi", clientConfirmedOn: null },
    { id: "14", cpNumber: "CP-100006", fullName: "Richards, Barrie", createdOn: new Date(2024, 11, 20), version: 2, confirmedOn: new Date(2024, 11, 20), confirmedBy: "Ayo-Famure, Opeyemi", clientConfirmedOn: null },
    { id: "15", cpNumber: "CP-100005", fullName: "Ahmad, Dilwar", createdOn: new Date(2024, 11, 20), version: 1, confirmedOn: new Date(2024, 11, 20), confirmedBy: "Ayo-Famure, Opeyemi", clientConfirmedOn: null },
    { id: "16", cpNumber: "CP-100004", fullName: "Richards, Barrie", createdOn: new Date(2024, 11, 19), version: 1, confirmedOn: new Date(2024, 11, 19), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "17", cpNumber: "CP-100003", fullName: "Moorman, Alan", createdOn: new Date(2024, 11, 17), version: 3, confirmedOn: new Date(2024, 11, 17), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "18", cpNumber: "CP-100002", fullName: "Moorman, Alan", createdOn: new Date(2024, 11, 17), version: 2, confirmedOn: new Date(2024, 11, 17), confirmedBy: "Laniyan, Aderinsola", clientConfirmedOn: null },
    { id: "19", cpNumber: "CP-100001", fullName: "Test Patient", createdOn: new Date(2024, 11, 16), version: 1, confirmedOn: new Date(2024, 11, 16), confirmedBy: "Test Admin", clientConfirmedOn: null },
  ];

  // Format date for display
  const formatDateWithIcon = (date: Date) => {
    return (
      <div className="flex items-center">
        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
        {format(date, "EEE dd/MM/yyyy")}
      </div>
    );
  };

  // Pagination
  const totalPages = Math.ceil(carePlans.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = carePlans.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center mb-6">
          <div className="flex items-center text-gray-700 font-medium text-xl">
            <div className="w-6 h-6 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            </div>
            Confirmed Care Plan's
          </div>
          <div className="ml-auto">
            <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2 rounded-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Input 
              placeholder="Full Name" 
              className="pl-3 pr-10"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <Filter className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          <div className="relative">
            <Input 
              placeholder="Created On" 
              className="pl-3 pr-10"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <Filter className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          <div className="relative">
            <Input 
              placeholder="Confirmed By" 
              className="pl-3 pr-10"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2">
              <Filter className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="font-semibold">
                Full Name
                <ChevronDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead className="font-semibold">
                Created On
                <ChevronDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead className="font-semibold">CP Number</TableHead>
              <TableHead className="font-semibold">Version</TableHead>
              <TableHead className="font-semibold">
                Confirmed On
                <ChevronDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead className="font-semibold">
                Confirmed By
                <ChevronDown className="inline h-4 w-4 ml-1" />
              </TableHead>
              <TableHead className="font-semibold">Client Confirmed On</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((plan, index) => {
              const isEvenRow = index % 2 === 0;
              return (
                <TableRow key={plan.id} className={isEvenRow ? "bg-gray-50" : "bg-white"}>
                  <TableCell className="py-4">{plan.fullName}</TableCell>
                  <TableCell>{formatDateWithIcon(plan.createdOn)}</TableCell>
                  <TableCell>{plan.cpNumber}</TableCell>
                  <TableCell>{plan.version}</TableCell>
                  <TableCell>{formatDateWithIcon(plan.confirmedOn)}</TableCell>
                  <TableCell>{plan.confirmedBy}</TableCell>
                  <TableCell>
                    {plan.clientConfirmedOn ? format(plan.clientConfirmedOn, "dd/MM/yyyy") : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button variant="outline" size="icon" className="h-9 w-9 bg-blue-600 text-white hover:bg-blue-700">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 bg-gray-600 text-white hover:bg-gray-700">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between p-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Showing 1 to {Math.min(currentItems.length, itemsPerPage)} of {carePlans.length} entries
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">20</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Visible Columns</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Export</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive={true}>1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
