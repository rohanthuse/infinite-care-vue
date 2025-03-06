import { LogOut, HelpCircle, Menu, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { useState, useEffect } from "react";
export function DashboardHeader() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);
  const handleLogout = () => {
    navigate('/super-admin');
  };
  return <header className="bg-white shadow-sm border-b border-gray-100 py-3 md:py-4 sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 flex justify-between items-center relative">
        {/* Logo aligned to the left - simplified for mobile */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Heart className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <h2 className="text-base md:text-xl font-bold tracking-tight">
            Med-infinite 
          </h2>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="text-blue-600 border border-blue-200 bg-white shadow-sm hover:bg-blue-50 rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content aligned to the right - Fixed for mobile viewing */}
        <div className={`
            flex-col md:flex-row 
            fixed md:static 
            top-[56px] md:top-auto
            left-0 md:left-auto
            right-0 md:right-auto
            bg-white md:bg-transparent 
            py-4 md:py-0 
            border-b md:border-b-0 
            border-gray-100 
            shadow-md md:shadow-none 
            z-[500] md:z-auto
            ${mobileMenuOpen ? 'flex' : 'hidden md:flex'} 
            items-center md:items-center 
            gap-3 md:gap-5 
            px-6 md:px-0 
            md:justify-end
          `} style={{
        maxHeight: 'calc(100vh - 56px)',
        overflowY: 'auto'
      }}>
          <div className="flex items-center gap-2 w-full md:w-auto">
            
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
            <Button variant="ghost" className="w-full flex justify-between items-center text-gray-700 hover:bg-gray-50/80 rounded-lg py-3" onClick={handleLogout}>
              <span className="font-medium">Logout</span>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>;
}