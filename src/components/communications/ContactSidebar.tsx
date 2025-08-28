
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
import { useContacts } from "@/hooks/useContacts";
import { useAdminContacts } from "@/hooks/useAdminMessaging";
import { useUserRole } from "@/hooks/useUserRole";

interface ContactSidebarProps {
  branchId: string;
  onContactSelect: (contactId: string) => void;
  contactType: "all" | "carers" | "clients" | "admins" | "groups";
  onContactTypeChange: (type: "all" | "carers" | "clients" | "admins" | "groups") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const ContactSidebar = ({ 
  branchId, 
  onContactSelect, 
  contactType,
  onContactTypeChange,
  searchTerm,
  onSearchChange 
}: ContactSidebarProps) => {
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const { data: currentUser, isLoading: userLoading } = useUserRole();
  
  // Use different hooks based on user role
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'branch_admin';
  const { data: adminContacts = [], isLoading: adminContactsLoading, error: adminContactsError } = useAdminContacts(branchId);
  const { data: regularContacts = [], isLoading: regularContactsLoading, error: regularContactsError } = useContacts(branchId, contactType);
  
  // Choose the appropriate contacts and loading states
  const contacts = isAdmin ? adminContacts : regularContacts;
  const contactsLoading = isAdmin ? adminContactsLoading : regularContactsLoading;
  const contactsError = isAdmin ? adminContactsError : regularContactsError;
  
  console.log('ContactSidebar - Current user:', currentUser);
  console.log('ContactSidebar - Contacts:', contacts);
  console.log('ContactSidebar - Loading states:', { userLoading, contactsLoading });
  console.log('ContactSidebar - Error:', contactsError);
  
  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  
  // Filter contacts based on search term, status filters, and contact type
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(contact.status);
    
    // For admin users, apply contact type filtering to admin contacts
    let matchesType = true;
    if (isAdmin && contactType !== 'all') {
      if (contactType === 'carers') {
        matchesType = contact.type === 'carer';
      } else if (contactType === 'clients') {
        matchesType = contact.type === 'client';
      } else if (contactType === 'admins') {
        matchesType = contact.type === 'branch_admin' || contact.type === 'super_admin';
      }
    }
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Show available contact types based on user role
  const availableContactTypes = () => {
    if (!currentUser) return ['all'];
    
    if (currentUser.role === 'super_admin' || currentUser.role === 'branch_admin') {
      return ['all', 'carers', 'clients', 'admins'];
    } else {
      return ['all', 'admins']; // Carers and clients can only message admins
    }
  };

  const getContactTypeBadge = (contactRole: string) => {
    switch (contactRole) {
      case 'client':
        return (
          <Badge variant="outline" className="px-1.5 py-0 text-xs bg-green-50 text-green-700 border-green-200">
            Client
          </Badge>
        );
      case 'carer':
        return (
          <Badge variant="outline" className="px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
            Carer
          </Badge>
        );
      case 'super_admin':
      case 'branch_admin':
        return (
          <Badge variant="outline" className="px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-1.5 py-0 text-xs bg-gray-50 text-gray-700 border-gray-200">
            Contact
          </Badge>
        );
    }
  };
  
  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Contacts</h3>
        
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
            {availableContactTypes().map((type) => (
              <button 
                key={type}
                className={`flex-1 text-sm py-2 px-4 ${contactType === type ? 'bg-white rounded-md shadow-sm' : ''}`}
                onClick={() => onContactTypeChange(type as any)}
              >
                {type === 'all' ? 'All' : 
                 type === 'carers' ? 'Carers' : 
                 type === 'clients' ? 'Clients' : 
                 type === 'admins' ? 'Admins' : 'Groups'}
              </button>
            ))}
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

        {(currentUser?.role === 'carer' || currentUser?.role === 'client') && (
          <div className="mt-2 p-2 bg-blue-50 rounded-md text-xs text-blue-700">
            You can only message administrators directly.
          </div>
        )}

        {contactsError && (
          <div className="mt-2 p-2 bg-red-50 rounded-md text-xs text-red-700">
            Error loading contacts: {contactsError.message}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {userLoading || contactsLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading contacts...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
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
                   <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                     {getContactTypeBadge(contact.type)}
                     {('canMessage' in contact && contact.canMessage === false) && (
                       <Badge variant="outline" className="px-1.5 py-0 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                         Setup Required
                       </Badge>
                     )}
                   </div>
                </div>
              </div>
            ))}
            
            {filteredContacts.length === 0 && !contactsLoading && (
              <div className="p-4 text-center text-gray-500">
                {contactsError ? 'Failed to load contacts' : 'No contacts found'}
                {currentUser && (
                  <div className="mt-2 text-xs">
                    User role: {currentUser.role} | Contact type: {contactType}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
