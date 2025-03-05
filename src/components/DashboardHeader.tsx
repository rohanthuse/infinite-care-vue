
import { LogOut, HelpCircle, Menu, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { useState } from "react";

export function DashboardHeader() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    navigate('/super-admin');
  };
  
  return <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/40 py-4 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        {/* Logo aligned to the left */}
        <div className="flex items-center gap-3 md:gap-4 md:ml-4 pl-[4px]">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Med-infinite 
          </h2>
        </div>
        
        {/* Mobile menu button - Updated for better visibility */}
        <div className="md:hidden">
          <Button 
            variant="outline" 
            size="icon" 
            className="text-blue-600 border border-blue-200 bg-white shadow-sm hover:bg-blue-50 rounded-full" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Content aligned to the right */}
        <div className={`flex-col md:flex-row absolute md:static top-full left-0 right-0 bg-white md:bg-transparent py-4 md:py-0 border-b md:border-b-0 border-gray-100 shadow-md md:shadow-none z-20 md:z-auto ${mobileMenuOpen ? 'flex' : 'hidden md:flex'} items-center md:items-center gap-3 md:gap-5 px-6 md:px-0 md:justify-end`}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-700 font-medium hover:bg-gray-50/80 rounded-full transition-all w-full md:w-auto justify-start md:justify-center">
              <HelpCircle className="h-4 w-4 mr-2 text-blue-600" /> Help Guide
            </Button>
            
            <CustomButton size="sm" variant="pill" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all w-full md:w-auto">
              New Screen
            </CustomButton>
          </div>
          
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm w-full md:w-auto justify-between md:justify-start ml-0 md:ml-2">
            <div>
              <div className="text-gray-800 font-semibold">Administrator</div>
              <div className="text-gray-500 text-xs font-medium">Super Admin</div>
            </div>
            <div className="h-8 border-r border-gray-200/80 mx-1 hidden md:block"></div>
            <CustomButton variant="ghost" size="icon" className="flex items-center p-1.5 hover:bg-gray-100/80 text-gray-700 rounded-full transition-all" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
          
          {/* Mobile logout option */}
          <div className="md:hidden w-full">
            <Button 
              variant="ghost" 
              className="w-full flex justify-between items-center text-gray-700 hover:bg-gray-50/80 rounded-lg py-3"
              onClick={handleLogout}
            >
              <span className="font-medium">Logout</span>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>;
}
