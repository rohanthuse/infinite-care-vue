import React, { useState, useEffect } from "react";
import { Bell, Search, Heart, Menu, X, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CustomButton } from "@/components/ui/CustomButton";
import { useClientAuth } from "@/contexts/ClientAuthContext";

const ClientHeader: React.FC<{ title: string }> = ({ title }) => {
  const { clientProfile, signOut, loading } = useClientAuth();
  const clientName = clientProfile?.first_name || localStorage.getItem("clientName") || "Client";
  const notificationCount = 2; // For demonstration
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
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

  const handleLogout = async () => {
    if (loading) return; // Prevent multiple logout attempts
    
    try {
      await signOut();
      // signOut already handles navigation to login page and localStorage cleanup
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation even if signOut fails
      window.location.href = '/client-login';
    }
  };
  
  return (
    <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        {/* Logo aligned to the left - with Heart icon to match Super Admin */}
        <div className="flex items-center gap-2 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Heart className="w-4 h-4 md:w-5 md:h-5" />
          </div>
          <h2 className="text-base md:text-xl font-bold tracking-tight">
            Med-Infinite 
          </h2>
        </div>
        
        {/* Search in center for desktop view */}
        <div className="hidden md:flex items-center justify-center flex-1 mx-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 rounded-full bg-white border-gray-200 w-full transition-all duration-300"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>
        
        {/* Bell notification on right for desktop view */}
        <div className="hidden md:flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-9 w-9 rounded-full relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button variant="outline" size="icon" className="text-blue-600 border border-blue-200 bg-white shadow-sm hover:bg-blue-50 rounded-full" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        
        {/* Profile card - styled like Super Admin */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm ml-2">
            <div>
              <div className="text-gray-800 font-semibold">{clientName}</div>
              <div className="text-gray-500 text-xs font-medium">Client</div>
            </div>
            <div className="h-8 border-r border-gray-200/80 mx-1"></div>
            <CustomButton 
              variant="ghost" 
              size="icon" 
              className="flex items-center p-1.5 hover:bg-gray-100/80 text-gray-700 rounded-full transition-all" 
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      <div className={`
          flex-col md:hidden
          fixed top-[64px] left-0 right-0
          bg-white py-4
          border-b border-gray-100 
          shadow-md z-[500]
          ${mobileMenuOpen ? 'flex' : 'hidden'} 
          items-center gap-3 px-6
        `} style={{
          maxHeight: 'calc(100vh - 64px)',
          overflowY: 'auto'
        }}>
          
        {/* Search for mobile view */}
        <div className="relative w-full mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 rounded-full bg-white border-gray-200 w-full"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        
        {/* Notifications for mobile */}
        <div className="w-full flex justify-between items-center py-2">
          <span className="text-sm font-medium text-gray-700">Notifications</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 rounded-full relative"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>
        </div>
        
        {/* Mobile profile and logout */}
        <div className="w-full pt-2 border-t border-gray-100 mt-2">
          <div className="flex items-center gap-3 mb-3">
            <Avatar>
              <AvatarFallback className="bg-blue-100 text-blue-800">
                {clientName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-800">{clientName}</p>
              <p className="text-xs text-gray-500">Client</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full flex justify-between items-center text-gray-700 hover:bg-gray-50/80 rounded-lg py-3" 
            onClick={handleLogout}
            disabled={loading}
          >
            <span className="font-medium">{loading ? 'Signing out...' : 'Logout'}</span>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ClientHeader;
