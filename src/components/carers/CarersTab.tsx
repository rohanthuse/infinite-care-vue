
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  SearchIcon, Filter, UserCheck, Download, RefreshCw, 
  Plus, Edit, EyeIcon, HelpCircle, CheckCircle, 
  ChevronLeft, ChevronRight 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarerFilters } from "./CarerFilters";

const mockCarers = [
  {
    id: "CR-001",
    name: "Charuma, Charmaine",
    email: "charmaine.c@med-infinite.com",
    phone: "+44 20 7946 3344",
    location: "Milton Keynes, MK9 3NZ",
    status: "Active",
    avatar: "CC",
    experience: "3 years",
    specialization: "Home Care",
    availability: "Full-time"
  },
  {
    id: "CR-002",
    name: "Warren, Susan",
    email: "susan.w@med-infinite.com",
    phone: "+44 20 7946 5566",
    location: "Milton Keynes, MK9 3NZ",
    status: "Active",
    avatar: "SW",
    experience: "5 years",
    specialization: "Elderly Care",
    availability: "Part-time"
  },
  {
    id: "CR-003",
    name: "Ayo-Famure, Opeyemi",
    email: "opeyemi.af@med-infinite.com",
    phone: "+44 20 7946 7788",
    location: "London, SW1A 1AA",
    status: "On Leave",
    avatar: "AF",
    experience: "2 years",
    specialization: "Nurse",
    availability: "Part-time"
  },
  {
    id: "CR-004",
    name: "Smith, John",
    email: "john.s@med-infinite.com",
    phone: "+44 20 7946 9900",
    location: "Cambridge, CB2 1TN",
    status: "Active",
    avatar: "SJ",
    experience: "7 years",
    specialization: "Physiotherapy",
    availability: "Full-time"
  },
  {
    id: "CR-005",
    name: "Williams, Mary",
    email: "mary.w@med-infinite.com",
    phone: "+44 20 7946 1122",
    location: "Bristol, BS1 5TR",
    status: "Training",
    avatar: "WM",
    experience: "1 year",
    specialization: "Home Care",
    availability: "Full-time"
  },
  {
    id: "CR-006",
    name: "Chen, Lisa",
    email: "lisa.c@med-infinite.com",
    phone: "+44 20 7946 3344",
    location: "Milton Keynes, MK9 3NZ",
    status: "Active",
    avatar: "LC",
    experience: "4 years",
    specialization: "Mental Health",
    availability: "Full-time"
  },
  {
    id: "CR-007",
    name: "Patel, Raj",
    email: "raj.p@med-infinite.com",
    phone: "+44 20 7946 5566",
    location: "London, SW1A 1AA",
    status: "Inactive",
    avatar: "RP",
    experience: "6 years",
    specialization: "Elderly Care",
    availability: "Part-time"
  },
  {
    id: "CR-008",
    name: "Murphy, Siobhan",
    email: "siobhan.m@med-infinite.com",
    phone: "+44 20 7946 7788",
    location: "Manchester, M1 1AE",
    status: "Active",
    avatar: "MS",
    experience: "2 years",
    specialization: "Disability Support",
    availability: "Full-time"
  }
];

interface CarersTabProps {
  branchId: string;
}

export const CarersTab = ({ branchId }: CarersTabProps) => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredCarers = mockCarers.filter(carer => {
    const matchesSearch = 
      carer.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      carer.email.toLowerCase().includes(searchValue.toLowerCase()) ||
      carer.id.toLowerCase().includes(searchValue.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || carer.status === statusFilter;
    const matchesSpecialization = specializationFilter === "all" || carer.specialization === specializationFilter;
    const matchesAvailability = availabilityFilter === "all" || carer.availability === availabilityFilter;
    
    return matchesSearch && matchesStatus && matchesSpecialization && matchesAvailability;
  });

  const totalPages = Math.ceil(filteredCarers.length / itemsPerPage);
  const paginatedCarers = filteredCarers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleViewCarer = (carerId: string) => {
    navigate(`/branch-dashboard/${id}/${branchName}/carers/${carerId}`);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, specializationFilter, availabilityFilter, searchValue]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Carers</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage carers and care staff, view their details, and track assignments
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-md">
            <Plus className="h-4 w-4 mr-2" />
            Add Carer
          </Button>
        </div>
        
        <CarerFilters 
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          specializationFilter={specializationFilter}
          setSpecializationFilter={setSpecializationFilter}
          availabilityFilter={availabilityFilter}
          setAvailabilityFilter={setAvailabilityFilter}
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-gray-50/90">
              <TableHead className="text-gray-600 font-medium w-[100px]">Carer ID</TableHead>
              <TableHead className="text-gray-600 font-medium">Carer Name</TableHead>
              <TableHead className="text-gray-600 font-medium">Email Address</TableHead>
              <TableHead className="text-gray-600 font-medium">Specialization</TableHead>
              <TableHead className="text-gray-600 font-medium">Experience</TableHead>
              <TableHead className="text-gray-600 font-medium">Availability</TableHead>
              <TableHead className="text-gray-600 font-medium">Status</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCarers.length > 0 ? (
              paginatedCarers.map((carer) => (
                <TableRow key={carer.id} className="hover:bg-gray-50 border-t border-gray-100">
                  <TableCell className="font-medium">{carer.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                        {carer.avatar}
                      </div>
                      <span>{carer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{carer.email}</TableCell>
                  <TableCell>{carer.specialization}</TableCell>
                  <TableCell>{carer.experience}</TableCell>
                  <TableCell>{carer.availability}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${carer.status === "Active" ? "bg-green-50 text-green-700 border-0" : ""}
                        ${carer.status === "Inactive" ? "bg-red-50 text-red-700 border-0" : ""}
                        ${carer.status === "On Leave" ? "bg-amber-50 text-amber-700 border-0" : ""}
                        ${carer.status === "Training" ? "bg-purple-50 text-purple-700 border-0" : ""}
                        px-4 py-1 rounded-full
                      `}
                    >
                      {carer.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleViewCarer(carer.id)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No carers found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {paginatedCarers.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCarers.length)} of {filteredCarers.length} carers
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
