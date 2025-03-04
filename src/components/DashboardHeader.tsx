
import { LogOut, HelpCircle, Menu, Heart, Search } from "lucide-react";
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

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100/30 py-3 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-sm transition-all duration-300">
            <Heart className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h2 className="text-lg md:text-xl font-medium tracking-tight text-gray-900">
            Med-infinite
          </h2>
        </div>
        
        <div className="hidden md:flex items-center">
          <div className="flex items-center bg-gray-50/80 rounded-full px-4 py-1.5 mx-4">
            <Button variant="ghost" size="sm" className="text-gray-700 font-medium hover:text-blue-600 rounded-full transition-all px-3">
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-700 font-medium hover:text-blue-600 rounded-full transition-all px-3">
              Patients
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-700 font-medium hover:text-blue-600 rounded-full transition-all px-3">
              Analytics
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-700 font-medium hover:text-blue-600 rounded-full transition-all px-3">
              Resources
            </Button>
          </div>
        </div>
        
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-700 hover:bg-gray-50/80 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative hidden md:flex">
            <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-50 rounded-full transition-all">
              <Search className="h-4.5 w-4.5" />
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-700 font-medium hover:bg-gray-50/80 rounded-full transition-all hidden md:flex"
          >
            <HelpCircle className="h-4 w-4 mr-2 text-blue-600" /> Help
          </Button>
          
          <div className="hidden md:flex h-6 border-r border-gray-200/80 mx-0.5"></div>
          
          <div className="flex items-center gap-1.5 py-1.5 pl-1.5 pr-1 rounded-full border border-gray-100/60 bg-white/80 shadow-sm">
            <div className="hidden md:block pl-1.5">
              <div className="text-gray-800 text-sm font-medium">Administrator</div>
              <div className="text-gray-500 text-xs">Super Admin</div>
            </div>
            <CustomButton 
              variant="ghost" 
              size="icon"
              className="flex items-center p-1.5 hover:bg-gray-100/80 text-gray-700 rounded-full transition-all"
              onClick={handleLogout}
            >
              <LogOut className="h-4.5 w-4.5" />
            </CustomButton>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl py-4 border-b border-gray-100 shadow-md z-20 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col space-y-3">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50/80 py-2">Dashboard</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50/80 py-2">Patients</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50/80 py-2">Analytics</Button>
            <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50/80 py-2">Resources</Button>
            
            <div className="pt-2 border-t border-gray-100">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50/80 py-2">
                <HelpCircle className="h-4 w-4 mr-2 text-blue-600" /> Help
              </Button>
              <CustomButton 
                size="sm"
                variant="default"
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                New Screen
              </CustomButton>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
