
import React, { useState } from "react";
import { 
  Menu, Plus, Bell, ArrowLeft,
  UserPlus2, FileSignature, CalendarPlus, UserRoundPlus,
  FileUp
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
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface ModuleContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const ModuleContent = ({ 
  title, 
  description, 
  children, 
  showBackButton = false,
  onBack
}: ModuleContentProps) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 mr-1" 
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          {description && (
            <p className="text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
};

interface TabNavigationProps {
  activeTab: string;
  onChange: (value: string) => void;
  hideActionsOnMobile?: boolean;
  hideQuickAdd?: boolean;
}

export const TabNavigation = ({ 
  activeTab, 
  onChange, 
  hideActionsOnMobile = false, 
  hideQuickAdd = false 
}: TabNavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleQuickAddAction = (action: string) => {
    toast.success(`${action} action selected`, {
      description: `The ${action.toLowerCase()} feature will be available soon`,
      position: "top-center",
    });
  };
  
  const QuickAddMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
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
  );
  
  // Mobile quick actions
  const MobileActions = () => (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-between items-center z-30">
      <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="p-4 grid grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 justify-center"
              onClick={() => {
                handleQuickAddAction("New Client");
                setMobileMenuOpen(false);
              }}
            >
              <UserPlus2 className="h-6 w-6" />
              <span>New Client</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 justify-center"
              onClick={() => {
                handleQuickAddAction("New Booking");
                setMobileMenuOpen(false);
              }}
            >
              <CalendarPlus className="h-6 w-6" />
              <span>New Booking</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 justify-center"
              onClick={() => {
                handleQuickAddAction("New Agreement");
                setMobileMenuOpen(false);
              }}
            >
              <FileSignature className="h-6 w-6" />
              <span>New Agreement</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 justify-center"
              onClick={() => {
                handleQuickAddAction("New Carer");
                setMobileMenuOpen(false);
              }}
            >
              <UserRoundPlus className="h-6 w-6" />
              <span>New Carer</span>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
      
      <Button variant="outline" size="sm" className="rounded-full relative">
        <Bell className="h-4 w-4" />
        <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
      </Button>
    </div>
  );
  
  return (
    <div className="w-full">
      <div className="flex justify-end mb-6">
        {!hideQuickAdd && <QuickAddMenu />}
      </div>
      
      {!hideActionsOnMobile && <MobileActions />}
    </div>
  );
};
