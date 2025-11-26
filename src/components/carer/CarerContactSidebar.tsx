
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCarerMessageContacts } from "@/hooks/useCarerMessaging";

interface CarerContactSidebarProps {
  onContactSelect: (contactId: string) => void;
  contactType: "all" | "assigned" | "branch";
  onContactTypeChange: (type: "all" | "assigned" | "branch") => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const CarerContactSidebar = ({ 
  onContactSelect, 
  contactType,
  onContactTypeChange,
  searchTerm,
  onSearchChange 
}: CarerContactSidebarProps) => {
  const { data: contacts = [], isLoading, error } = useCarerMessageContacts();
  
  // Filter contacts based on search term and contact type
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    // For now, all contacts are treated the same - can add assigned/branch logic later
    return matchesSearch;
  });

  const getContactCounts = () => {
    return { 
      totalCount: contacts.length,
      assignedCount: contacts.length, // Placeholder - would need booking data
      branchCount: contacts.length 
    };
  };

  const { totalCount, assignedCount, branchCount } = getContactCounts();
  
  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Your Clients</h3>
        <p className="text-sm text-gray-600 mb-4">
          Message clients you provide care for
        </p>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search clients..."
            className="pl-9 bg-gray-50"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Contact type filter */}
        <div className="flex items-center justify-between mb-2">
          <div className="w-full flex overflow-hidden bg-gray-100 rounded-md">
            <button 
              className={`flex-1 text-sm py-2 px-3 ${contactType === 'all' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('all')}
            >
              All ({totalCount})
            </button>
            <button 
              className={`flex-1 text-sm py-2 px-3 ${contactType === 'assigned' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('assigned')}
            >
              Assigned ({assignedCount})
            </button>
            <button 
              className={`flex-1 text-sm py-2 px-3 ${contactType === 'branch' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('branch')}
            >
              Branch ({branchCount})
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 rounded-md text-xs text-red-700">
            Error loading clients: {error.message}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading clients...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onContactSelect(contact.id);
                }}
              >
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                    {contact.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{contact.name}</div>
                  </div>
                  <div className="flex items-center mt-0.5">
                    <Badge variant="outline" className="px-1.5 py-0 text-xs bg-green-50 text-green-700 border-green-200">
                      Client
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredContacts.length === 0 && !isLoading && (
              <div className="p-4 text-center text-gray-500">
                {error ? 'Failed to load clients' : 
                 contacts.length === 0 ? 'No clients found' :
                 'No clients match your search'}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
