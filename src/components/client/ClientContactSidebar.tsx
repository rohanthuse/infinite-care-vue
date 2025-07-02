
import React from "react";
import { Search, AlertCircle, RefreshCw } from "lucide-react";
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
  const { data: careTeam = [], isLoading, error, refetch } = useClientCareTeam();
  
  // Filter contacts based on search (removed type filtering since we only have admins)
  const filteredContacts = careTeam.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const getContactTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className="px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
        Care Coordinator
      </Badge>
    );
  };
  
  return (
    <>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Care Coordinators</h3>
          {error && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="text-red-600 hover:text-red-700"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">Message your care administrators who coordinate with your care team</p>
        
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search coordinators..."
            className="pl-9 bg-gray-50"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {error && (
          <div className="mt-2 p-3 bg-red-50 rounded-md border border-red-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-red-700">
                <p className="font-medium mb-1">Unable to load care coordinators</p>
                <p className="text-red-600">
                  {error.message?.includes('not authenticated') ? 
                    'Please try refreshing the page or logging out and back in.' :
                    'Please check your connection and try again.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading your care coordinators...</span>
            </div>
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
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                    {contact.avatar}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                    contact.status === "online" ? "bg-green-500" :
                    contact.status === "away" ? "bg-amber-500" : "bg-gray-400"
                  }`}></div>
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm text-gray-900">{contact.name}</div>
                    {contact.unread > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                        {contact.unread}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    {getContactTypeBadge(contact.type)}
                    {contact.email && (
                      <span className="text-xs text-gray-500 truncate ml-2">
                        {contact.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {!isLoading && filteredContacts.length === 0 && !error && (
              <div className="p-4 text-center text-gray-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">
                  {careTeam.length === 0 ? (
                    <div>
                      <p className="font-medium mb-1">No care coordinators found</p>
                      <p className="text-xs text-gray-400">
                        No administrators are assigned to your branch. Please contact support.
                      </p>
                    </div>
                  ) : (
                    <p>No coordinators match your search</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
