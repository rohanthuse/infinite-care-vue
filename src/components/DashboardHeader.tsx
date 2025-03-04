
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
    <header className="bg-white shadow-md py-4 border-b border-gray-100">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-med-500 text-white flex items-center justify-center font-bold text-xl shadow-md">M</div>
          <h2 className="text-2xl font-bold">
            Med-infinite <span className="text-med-500">Healthcare</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-700 font-medium hover:bg-gray-50"
          >
            <HelpCircle className="h-4 w-4 mr-2 text-med-500" /> Help Guide
          </Button>
          
          <CustomButton 
            size="sm" 
            className="bg-med-500 hover:bg-med-600 text-white font-semibold shadow-sm"
          >
            New Screen
          </CustomButton>
          
          <div className="flex items-center gap-3 bg-gray-50 py-2 px-4 rounded-lg border border-gray-100">
            <div>
              <div className="text-gray-800 font-semibold">Administrator</div>
              <div className="text-gray-500 text-xs font-medium">Super Admin</div>
            </div>
            <div className="h-8 border-r border-gray-200 mx-1"></div>
            <CustomButton 
              variant="ghost" 
              size="icon"
              className="flex items-center p-1.5 hover:bg-gray-100 text-gray-700 rounded-lg"
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
