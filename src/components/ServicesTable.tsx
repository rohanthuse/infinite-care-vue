
import React, { useState } from "react";
import { Check, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the service data type
interface Service {
  id: number;
  title: string;
  doubleHanded: boolean;
}

// Sample data array
const initialServices: Service[] = [
  { id: 1, title: "Personal Care", doubleHanded: false },
  { id: 2, title: "Medication Assistance", doubleHanded: false },
  { id: 3, title: "Client Transport", doubleHanded: false },
  { id: 4, title: "Home and Meal Support", doubleHanded: false },
  { id: 5, title: "Respite for Carers", doubleHanded: false },
  { id: 6, title: "Companionship", doubleHanded: false },
  { id: 7, title: "24/7 On-call Support", doubleHanded: false },
  { id: 8, title: "Sleep-in Care", doubleHanded: false },
  { id: 9, title: "Waking Night Care", doubleHanded: false },
  { id: 10, title: "Dementia Support", doubleHanded: false },
  { id: 11, title: "Learning Disability Support", doubleHanded: false },
  { id: 12, title: "Double Handed Care", doubleHanded: true },
  { id: 13, title: "Manual Handling", doubleHanded: false },
  { id: 14, title: "Live-in Care", doubleHanded: false },
  { id: 15, title: "Shopping", doubleHanded: false },
  { id: 16, title: "Personal Assistance", doubleHanded: false },
  { id: 17, title: "Night Only Sleep-In", doubleHanded: false },
  { id: 18, title: "Home Support", doubleHanded: false },
  { id: 19, title: "Meal Support", doubleHanded: false },
];

export function ServicesTable() {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortColumn, setSortColumn] = useState<'title' | 'doubleHanded'>('title');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Sort services based on current sort column and order
  const sortedServices = [...services].sort((a, b) => {
    if (sortColumn === 'title') {
      return sortOrder === 'asc' 
        ? a.title.localeCompare(b.title) 
        : b.title.localeCompare(a.title);
    } else {
      // Sort by boolean value
      return sortOrder === 'asc' 
        ? Number(a.doubleHanded) - Number(b.doubleHanded)
        : Number(b.doubleHanded) - Number(a.doubleHanded);
    }
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(services.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedServices = sortedServices.slice(startIndex, startIndex + itemsPerPage);
  
  // Handle sort
  const handleSort = (column: 'title' | 'doubleHanded') => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50/80">
              <TableHead className="w-[70%] font-semibold text-gray-700">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 font-semibold p-0 hover:bg-transparent"
                  onClick={() => handleSort('title')}
                >
                  Title
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="w-[20%] font-semibold text-gray-700">
                <Button
                  variant="ghost"
                  className="flex items-center gap-1 font-semibold p-0 hover:bg-transparent"
                  onClick={() => handleSort('doubleHanded')}
                >
                  Double Handed?
                  <ArrowUpDown className="h-4 w-4 ml-1" />
                </Button>
              </TableHead>
              <TableHead className="w-[10%] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedServices.map((service) => (
              <TableRow key={service.id} className="hover:bg-gray-50/50">
                <TableCell className="font-medium text-gray-700">{service.title}</TableCell>
                <TableCell>
                  {service.doubleHanded && (
                    <Check className="w-5 h-5 text-green-600" />
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem className="cursor-pointer">Edit</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50">
        <div className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, services.length)} of {services.length} entries
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
            >
              <span>«</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              <span>‹</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0 bg-blue-50 text-blue-600 border-blue-200"
            >
              {currentPage}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              <span>›</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 p-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
            >
              <span>»</span>
            </Button>
          </div>
          
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder={itemsPerPage.toString()} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="ml-2 h-8">
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
