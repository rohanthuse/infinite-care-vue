
import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Mocked data - would come from an API
const mockAdmins = [
  { id: "admin-1", name: "Branch Admin", avatar: "BA", status: "online", unread: 1, type: "admin" },
  { id: "admin-2", name: "Care Coordinator", avatar: "CC", status: "online", unread: 0, type: "admin" },
];

const mockCarers = [
  { id: "carer-1", name: "Warren, Susan", avatar: "WS", status: "online", unread: 2, type: "carer" },
  { id: "carer-2", name: "Smith, John", avatar: "SJ", status: "offline", unread: 0, type: "carer" },
  { id: "carer-3", name: "Charuma, Charmaine", avatar: "CC", status: "away", unread: 0, type: "carer" },
];

interface ClientContactSidebarProps {
  onContactSelect: (contactId: string) => void;
  contactType: "all" | "carers" | "admins";
  onContactTypeChange: (type: "all" | "carers" | "admins") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const ClientContactSidebar = ({ 
  onContactSelect, 
  contactType,
  onContactTypeChange,
  searchTerm,
  onSearchChange 
}: ClientContactSidebarProps) => {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  
  // Filter contacts based on search term and filters
  const filteredAdmins = mockAdmins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(admin.status);
    return matchesSearch && matchesStatus;
  });
  
  const filteredCarers = mockCarers.filter(carer => {
    const matchesSearch = carer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(carer.status);
    return matchesSearch && matchesStatus;
  });
  
  // Get contacts based on selected type
  const displayContacts = 
    contactType === "all" ? [...filteredAdmins, ...filteredCarers] : 
    contactType === "carers" ? filteredCarers : 
    filteredAdmins;
  
  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Care Team</h3>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search contacts..."
            className="pl-9 bg-gray-50"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="w-full flex overflow-hidden bg-gray-100 rounded-md">
            <button 
              className={`flex-1 text-sm py-2 px-4 ${contactType === 'all' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('all')}
            >
              All
            </button>
            <button 
              className={`flex-1 text-sm py-2 px-4 ${contactType === 'carers' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('carers')}
            >
              Carers
            </button>
            <button 
              className={`flex-1 text-sm py-2 px-4 ${contactType === 'admins' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('admins')}
            >
              Admins
            </button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("online")}
                onCheckedChange={() => handleStatusFilterChange("online")}
              >
                Online
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("offline")}
                onCheckedChange={() => handleStatusFilterChange("offline")}
              >
                Offline
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("away")}
                onCheckedChange={() => handleStatusFilterChange("away")}
              >
                Away
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {displayContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => onContactSelect(contact.id)}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                  {contact.avatar}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                  contact.status === "online" ? "bg-green-500" :
                  contact.status === "away" ? "bg-amber-500" : "bg-gray-400"
                }`}></div>
              </div>
              
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{contact.name}</div>
                  {contact.unread > 0 && (
                    <div className="bg-blue-600 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                      {contact.unread}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                  {contact.type === "admin" ? (
                    <Badge variant="outline" className="px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Carer
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {displayContacts.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No contacts found
            </div>
          )}
        </div>
      </div>
    </>
  );
};
