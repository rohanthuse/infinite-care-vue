
import { LogOut, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";

export function DashboardHeader() {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    navigate('/super-admin');
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/40 py-4 sticky top-0 z-10">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-med-500 to-med-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">M</div>
          <h2 className="text-2xl font-bold tracking-tight">
            Med-infinite <span className="bg-gradient-to-r from-med-500 to-med-600 bg-clip-text text-transparent">Healthcare</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-700 font-medium hover:bg-gray-50/80 rounded-full transition-all"
          >
            <HelpCircle className="h-4 w-4 mr-2 text-med-500" /> Help Guide
          </Button>
          
          <CustomButton 
            size="sm"
            variant="pill"
            className="bg-gradient-to-r from-med-500 to-med-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
          >
            New Screen
          </CustomButton>
          
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm py-2 px-4 rounded-full border border-gray-100/60 shadow-sm">
            <div>
              <div className="text-gray-800 font-semibold">Administrator</div>
              <div className="text-gray-500 text-xs font-medium">Super Admin</div>
            </div>
            <div className="h-8 border-r border-gray-200/80 mx-1"></div>
            <CustomButton 
              variant="ghost" 
              size="icon"
              className="flex items-center p-1.5 hover:bg-gray-100/80 text-gray-700 rounded-full transition-all"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </CustomButton>
          </div>
        </div>
      </div>
    </header>
  );
}
