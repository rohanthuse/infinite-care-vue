
import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { 
  Paperclip, Menu, Plus,
  UserPlus2, FileSignature, CalendarPlus, UserRoundPlus,
  FileUp, Bell
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ModuleNavigation } from "@/components/ModuleNavigation";
import { toast } from "sonner";

interface TabNavigationProps {
  activeTab: string;
  onChange: (value: string) => void;
  hideActionsOnMobile?: boolean;
  hideQuickAdd?: boolean;
}

export const TabNavigation = ({ activeTab, onChange, hideActionsOnMobile = false, hideQuickAdd = false }: TabNavigationProps) => {
  const params = useParams();
  const location = useLocation();
  const { id, branchName } = params;
  
  const handleQuickAddAction = (action: string) => {
    toast.success(`${action} action selected`, {
      description: `The ${action.toLowerCase()} feature will be available soon`,
      position: "top-center",
    });
    console.log(`Quick Add action selected: ${action}`);
  };
  
  // Handler for module changes
  const handleModuleChange = (value: string) => {
    // Invoke the parent's onChange handler
    onChange(value);
  };
  
  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        {!hideActionsOnMobile && (
          <div className="flex items-center justify-between md:hidden bg-white p-3 rounded-lg shadow-sm">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
              <Menu className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-full relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              
              {!hideQuickAdd && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="rounded-full bg-blue-600 hover:bg-blue-700 h-9 w-9 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Client")} className="cursor-pointer">
                      <UserPlus2 className="mr-2 h-4 w-4" />
                      <span>New Client</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Booking")} className="cursor-pointer">
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      <span>New Booking</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Agreement")} className="cursor-pointer">
                      <FileSignature className="mr-2 h-4 w-4" />
                      <span>New Agreement</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Carer")} className="cursor-pointer">
                      <UserRoundPlus className="mr-2 h-4 w-4" />
                      <span>New Carer</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-30 md:hidden">
          {/* Mobile navigation is now handled in ModuleNavigation */}
        </div>

        <div className="hidden md:flex md:flex-col md:space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <ModuleNavigation activeModule={activeTab} onModuleChange={handleModuleChange} />
            
            <div className="flex items-center gap-2">
              {!hideQuickAdd && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      <span>Quick Add</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Client")} className="cursor-pointer">
                      <UserPlus2 className="mr-2 h-4 w-4" />
                      <span>New Client</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Booking")} className="cursor-pointer">
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      <span>New Booking</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Agreement")} className="cursor-pointer">
                      <FileSignature className="mr-2 h-4 w-4" />
                      <span>New Agreement</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleQuickAddAction("New Carer")} className="cursor-pointer">
                      <UserRoundPlus className="mr-2 h-4 w-4" />
                      <span>New Carer</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleQuickAddAction("Upload Document")} className="cursor-pointer">
                      <FileUp className="mr-2 h-4 w-4" />
                      <span>Upload Document</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="pb-16 md:pb-0"></div>
    </div>
  );
}
