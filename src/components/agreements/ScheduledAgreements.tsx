
import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, Calendar, User, Clock, Tag, FileText, Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Mock data for scheduled agreements
const mockScheduledAgreements = [
  {
    id: 1,
    title: "Employment Contract Review",
    scheduledFor: "12 May 2024",
    scheduledWith: "Aderinsola Thomas",
    status: "Upcoming",
    type: "Employment Agreement",
    notes: "Annual review of employment terms"
  },
  {
    id: 2,
    title: "Service Agreement Renewal",
    scheduledFor: "18 May 2024",
    scheduledWith: "James Wilson",
    status: "Upcoming",
    type: "Service Agreement",
    notes: "Discuss updated service terms and pricing"
  },
  {
    id: 3,
    title: "Non-Disclosure Agreement",
    scheduledFor: "25 May 2024",
    scheduledWith: "Sophia Martinez",
    status: "Upcoming",
    type: "NDA",
    notes: "New partner onboarding"
  },
  {
    id: 4,
    title: "Data Processing Agreement",
    scheduledFor: "02 June 2024",
    scheduledWith: "Michael Johnson",
    status: "Pending Approval",
    type: "Data Agreement",
    notes: "Updates to comply with new regulations"
  },
  {
    id: 5,
    title: "Supplier Agreement",
    scheduledFor: "10 June 2024",
    scheduledWith: "Emma Williams",
    status: "Under Review",
    type: "Service Agreement",
    notes: "New equipment supplier terms"
  }
];

type ScheduledAgreementsProps = {
  searchQuery?: string;
  typeFilter?: string;
  dateFilter?: string;
  branchId: string;
};

export function ScheduledAgreements({ 
  searchQuery = "", 
  typeFilter = "all",
  dateFilter = "all",
  branchId
}: ScheduledAgreementsProps) {
  const [agreements, setAgreements] = useState(mockScheduledAgreements);
  const [filteredAgreements, setFilteredAgreements] = useState(agreements);
  
  // In a real implementation, this would fetch data based on the branch ID
  useEffect(() => {
    // Simulate API call to get scheduled agreements by branch
    setAgreements(mockScheduledAgreements);
  }, [branchId]);
  
  // Apply filters whenever they change
  useEffect(() => {
    let filtered = agreements;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        agreement => 
          agreement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agreement.scheduledWith.toLowerCase().includes(searchQuery.toLowerCase()) ||
          agreement.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(agreement => agreement.type === typeFilter);
    }
    
    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch(dateFilter) {
        case "last7days":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "last30days":
          filterDate.setDate(now.getDate() - 30);
          break;
        case "last90days":
          filterDate.setDate(now.getDate() - 90);
          break;
      }
      
      filtered = filtered.filter(agreement => {
        const agreementDate = new Date(agreement.scheduledFor);
        return agreementDate >= filterDate;
      });
    }
    
    setFilteredAgreements(filtered);
  }, [searchQuery, typeFilter, dateFilter, agreements]);
  
  const handleView = (id: number) => {
    // In a full implementation, this would open a dialog to view the scheduled agreement
    console.log(`View scheduled agreement ${id}`);
  };

  const handleDeleteScheduled = (id: number) => {
    // In a real application, this would make an API call
    setAgreements(agreements.filter(a => a.id !== id));
    alert(`Scheduled agreement ${id} deleted successfully`);
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="w-[5%]">#</TableHead>
            <TableHead className="w-[25%]">Title</TableHead>
            <TableHead className="w-[15%]">Scheduled With</TableHead>
            <TableHead className="w-[15%]">Scheduled For</TableHead>
            <TableHead className="w-[15%]">Type</TableHead>
            <TableHead className="w-[10%]">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAgreements.length > 0 ? (
            filteredAgreements.map((agreement) => (
              <TableRow key={agreement.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                <TableCell className="font-medium">{agreement.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-800">{agreement.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{agreement.scheduledWith}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{agreement.scheduledFor}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{agreement.type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      agreement.status === "Upcoming" 
                        ? "bg-green-100 text-green-800 hover:bg-green-100" 
                        : agreement.status === "Under Review"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                    }
                  >
                    {agreement.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(agreement.id)}
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDeleteScheduled(agreement.id)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1 py-4 text-gray-500">
                  <Calendar className="h-10 w-10 text-gray-300" />
                  <p className="text-sm">No scheduled agreements found</p>
                  {searchQuery && (
                    <p className="text-xs text-gray-400">Try a different search term</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
