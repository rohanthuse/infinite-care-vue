
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useClientCareTeam } from "@/hooks/useClientMessaging";

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
  const { data: careTeam = [], isLoading, error } = useClientCareTeam();
  
  console.log('[ClientContactSidebar] Care team data:', careTeam);
  console.log('[ClientContactSidebar] Current contact type filter:', contactType);
  
  // Filter contacts based on search term and contact type
  const filteredContacts = careTeam.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply contact type filter
    let matchesType = true;
    if (contactType === 'carers') {
      matchesType = contact.type === 'carer';
    } else if (contactType === 'admins') {
      matchesType = contact.type === 'admin';
    }
    // 'all' type shows everything
    
    return matchesSearch && matchesType;
  });

  console.log('[ClientContactSidebar] Filtered contacts:', filteredContacts);

  const getContactTypeBadge = (type: "admin" | "carer") => {
    if (type === 'admin') {
      return (
        <Badge variant="outline" className="px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
          Care Coordinator
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
          Carer
        </Badge>
      );
    }
  };

  const getContactCounts = () => {
    const adminCount = careTeam.filter(c => c.type === 'admin').length;
    const carerCount = careTeam.filter(c => c.type === 'carer').length;
    return { adminCount, carerCount, totalCount: careTeam.length };
  };

  const { adminCount, carerCount, totalCount } = getContactCounts();
  
  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-2">Your Care Team</h3>
        <p className="text-sm text-gray-600 mb-4">
          Message your care coordinators and carers who provide your support
        </p>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search your care team..."
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
              className={`flex-1 text-sm py-2 px-3 ${contactType === 'admins' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('admins')}
            >
              Coordinators ({adminCount})
            </button>
            <button 
              className={`flex-1 text-sm py-2 px-3 ${contactType === 'carers' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => onContactTypeChange('carers')}
            >
              Carers ({carerCount})
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 rounded-md text-xs text-red-700">
            Error loading care team: {error.message}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading your care team...
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  console.log('[ClientContactSidebar] Selected contact:', contact);
                  onContactSelect(contact.id);
                }}
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
                  <div className="flex items-center mt-0.5">
                    {getContactTypeBadge(contact.type)}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredContacts.length === 0 && !isLoading && (
              <div className="p-4 text-center text-gray-500">
                {error ? 'Failed to load care team' : 
                 careTeam.length === 0 ? 'No care team members found' :
                 'No team members match your search'}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
