
import React from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  
  // Filter contacts based on type and search
  const filteredContacts = careTeam.filter(contact => {
    const matchesType = contactType === "all" || 
                       (contactType === "carers" && contact.type === "carer") ||
                       (contactType === "admins" && contact.type === "admin");
    
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  const getContactTypeBadge = (type: string) => {
    switch (type) {
      case 'carer':
        return (
          <Badge variant="outline" className="px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
            Carer
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="outline" className="px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
            Admin
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Your Care Team</h3>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search care team..."
            className="pl-9 bg-gray-50"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex bg-gray-100 rounded-md p-1 mb-4">
          <button 
            className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
              contactType === 'all' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => onContactTypeChange('all')}
          >
            All
          </button>
          <button 
            className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
              contactType === 'carers' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => onContactTypeChange('carers')}
          >
            Carers
          </button>
          <button 
            className={`flex-1 text-sm py-2 px-3 rounded transition-colors ${
              contactType === 'admins' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => onContactTypeChange('admins')}
          >
            Admins
          </button>
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
                  <div className="flex items-center mt-0.5">
                    {getContactTypeBadge(contact.type)}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredContacts.length === 0 && !isLoading && (
              <div className="p-4 text-center text-gray-500">
                {careTeam.length === 0 ? 'No care team members found' : 'No contacts match your search'}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
