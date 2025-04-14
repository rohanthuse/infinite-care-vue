
import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Check, 
  X, 
  Plus 
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExtraTimeTabProps {
  branchId?: string;
  branchName?: string;
}

// Mock data for extra time entries
const mockExtraTimeData = [
  {
    id: "ET001",
    carerName: "John Smith",
    carerID: "C-1234",
    date: "2025-04-10",
    startTime: "14:00",
    endTime: "16:30",
    duration: "2.5 hours",
    clientName: "Alice Johnson",
    clientID: "CL-5678",
    reason: "Client needed additional assistance with medication",
    status: "pending",
    submittedAt: "2025-04-11T09:15:00Z"
  },
  {
    id: "ET002",
    carerName: "Sarah Williams",
    carerID: "C-2345",
    date: "2025-04-11",
    startTime: "10:00",
    endTime: "11:30",
    duration: "1.5 hours",
    clientName: "Robert Davis",
    clientID: "CL-6789",
    reason: "Extended personal care routine",
    status: "approved",
    submittedAt: "2025-04-11T12:30:00Z",
    approvedBy: "Lisa Admin",
    approvedAt: "2025-04-12T10:15:00Z"
  },
  {
    id: "ET003",
    carerName: "Michael Brown",
    carerID: "C-3456",
    date: "2025-04-12",
    startTime: "16:00",
    endTime: "18:00",
    duration: "2 hours",
    clientName: "Patricia Wilson",
    clientID: "CL-7890",
    reason: "Client had emergency situation requiring extended stay",
    status: "approved",
    submittedAt: "2025-04-12T19:00:00Z",
    approvedBy: "Lisa Admin",
    approvedAt: "2025-04-13T09:30:00Z"
  },
  {
    id: "ET004",
    carerName: "Jennifer Clark",
    carerID: "C-4567",
    date: "2025-04-13",
    startTime: "09:00",
    endTime: "12:00",
    duration: "3 hours",
    clientName: "Thomas White",
    clientID: "CL-8901",
    reason: "Additional cleaning required after client illness",
    status: "pending",
    submittedAt: "2025-04-13T13:20:00Z"
  },
  {
    id: "ET005",
    carerName: "David Miller",
    carerID: "C-5678",
    date: "2025-04-10",
    startTime: "18:00",
    endTime: "19:30",
    duration: "1.5 hours",
    clientName: "Barbara Moore",
    clientID: "CL-9012",
    reason: "Client family was delayed in returning home",
    status: "rejected",
    submittedAt: "2025-04-11T08:45:00Z",
    rejectedBy: "Lisa Admin",
    rejectedAt: "2025-04-12T11:20:00Z",
    rejectReason: "Family should cover additional costs for their delay"
  }
];

const ExtraTimeTab: React.FC<ExtraTimeTabProps> = ({ branchId, branchName }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  
  const itemsPerPage = 5;
  
  // Filter the data based on search term and filters
  const filteredData = mockExtraTimeData.filter(entry => {
    const matchesSearch = 
      entry.carerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      entry.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && new Date(entry.date).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'thisWeek' && isThisWeek(new Date(entry.date)));
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  // Helper function to check if a date is in the current week
  function isThisWeek(date: Date) {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(now.setDate(now.getDate() + 6));
    return date >= weekStart && date <= weekEnd;
  }
  
  // Preview an extra time entry
  const handlePreviewEntry = (entry: any) => {
    setSelectedEntry(entry);
    setPreviewDialogOpen(true);
  };
  
  // Handle approve/reject actions
  const handleApproveEntry = (entry: any) => {
    console.log("Approving entry:", entry);
    // In a real application, this would make an API call
    setPreviewDialogOpen(false);
  };
  
  const handleRejectEntry = (entry: any) => {
    console.log("Rejecting entry:", entry);
    // In a real application, this would make an API call
    setPreviewDialogOpen(false);
  };
  
  const handleAddNewEntry = (formData: any) => {
    console.log("Adding new extra time entry:", formData);
    // In a real application, this would make an API call
    setAddDialogOpen(false);
  };
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Extra Time Management</h2>
          <p className="text-gray-500 mt-1">Review and approve additional hours reported by carers</p>
        </div>
        
        <Button 
          onClick={() => setAddDialogOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Extra Time</span>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by carer name, client or reason..."
            className="pl-10 pr-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" className="h-10 w-10 bg-white">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {filteredData.length > 0 ? (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Carer</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.carerName}</div>
                        <div className="text-sm text-gray-500">{entry.carerID}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.clientName}</div>
                        <div className="text-sm text-gray-500">{entry.clientID}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{new Date(entry.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-500">{entry.startTime} - {entry.endTime}</div>
                      </div>
                    </TableCell>
                    <TableCell>{entry.duration}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          entry.status === "approved" ? "text-green-600 bg-green-50 border-green-200" :
                          entry.status === "rejected" ? "text-red-600 bg-red-50 border-red-200" :
                          "text-amber-600 bg-amber-50 border-amber-200"
                        }
                      >
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handlePreviewEntry(entry)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Clock className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No extra time entries found</h3>
          <p className="text-gray-500">No entries match your search criteria or there are no entries yet.</p>
          <Button 
            variant="default" 
            className="mt-4 bg-blue-600 hover:bg-blue-700"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Extra Time
          </Button>
        </div>
      )}
      
      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extra Time Record</DialogTitle>
            <DialogDescription>
              Review the details of this extra time record
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Carer</h4>
                  <p className="text-sm">{selectedEntry.carerName}</p>
                  <p className="text-xs text-gray-500">{selectedEntry.carerID}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Client</h4>
                  <p className="text-sm">{selectedEntry.clientName}</p>
                  <p className="text-xs text-gray-500">{selectedEntry.clientID}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Date</h4>
                  <p className="text-sm">{new Date(selectedEntry.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Time</h4>
                  <p className="text-sm">{selectedEntry.startTime} - {selectedEntry.endTime}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Duration</h4>
                <p className="text-sm">{selectedEntry.duration}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Reason</h4>
                <p className="text-sm">{selectedEntry.reason}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <Badge
                  variant="outline"
                  className={
                    selectedEntry.status === "approved" ? "text-green-600 bg-green-50 border-green-200" :
                    selectedEntry.status === "rejected" ? "text-red-600 bg-red-50 border-red-200" :
                    "text-amber-600 bg-amber-50 border-amber-200"
                  }
                >
                  {selectedEntry.status.charAt(0).toUpperCase() + selectedEntry.status.slice(1)}
                </Badge>
              </div>
              
              {selectedEntry.status === "approved" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Approved By</h4>
                    <p className="text-sm">{selectedEntry.approvedBy}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Approved At</h4>
                    <p className="text-sm">{new Date(selectedEntry.approvedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
              
              {selectedEntry.status === "rejected" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Rejected By</h4>
                      <p className="text-sm">{selectedEntry.rejectedBy}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Rejected At</h4>
                      <p className="text-sm">{new Date(selectedEntry.rejectedAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Reject Reason</h4>
                    <p className="text-sm">{selectedEntry.rejectReason}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedEntry && selectedEntry.status === "pending" && (
              <div className="flex items-center justify-end gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => handleRejectEntry(selectedEntry)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleApproveEntry(selectedEntry)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            )}
            {selectedEntry && selectedEntry.status !== "pending" && (
              <Button
                variant="outline"
                onClick={() => setPreviewDialogOpen(false)}
                className="ml-auto"
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add New Extra Time Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Extra Time</DialogTitle>
            <DialogDescription>
              Record additional hours worked by a carer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carer">Carer</Label>
                <Select>
                  <SelectTrigger id="carer">
                    <SelectValue placeholder="Select a carer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="c-1234">John Smith (C-1234)</SelectItem>
                    <SelectItem value="c-2345">Sarah Williams (C-2345)</SelectItem>
                    <SelectItem value="c-3456">Michael Brown (C-3456)</SelectItem>
                    <SelectItem value="c-4567">Jennifer Clark (C-4567)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cl-5678">Alice Johnson (CL-5678)</SelectItem>
                    <SelectItem value="cl-6789">Robert Davis (CL-6789)</SelectItem>
                    <SelectItem value="cl-7890">Patricia Wilson (CL-7890)</SelectItem>
                    <SelectItem value="cl-8901">Thomas White (CL-8901)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" type="date" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input id="duration" type="number" min="0.5" step="0.5" placeholder="e.g., 2.5" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" type="time" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="time" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Extra Time</Label>
                <Textarea 
                  id="reason" 
                  placeholder="Explain why extra time was necessary..." 
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => handleAddNewEntry({})}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExtraTimeTab;
