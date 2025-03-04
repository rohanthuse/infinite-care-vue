
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
    <header className="bg-white shadow-md px-6 py-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-med-500 text-white flex items-center justify-center font-bold text-xl">M</div>
          <h2 className="text-xl font-bold text-gray-800">
            Med-infinite <span className="text-med-500">Healthcare</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-gray-700 font-medium shadow-sm hover:bg-gray-100">
            <HelpCircle className="h-4 w-4 mr-2" /> Help Guide
          </Button>
          <CustomButton 
            size="sm" 
            className="bg-med-500 hover:bg-med-600 text-white font-semibold shadow-sm"
          >
            New Screen
          </CustomButton>
          <div className="flex items-center ml-4 bg-gray-50 py-1 px-3 rounded-lg">
            <div className="mr-3">
              <div className="text-gray-800 font-semibold">Administrator</div>
              <div className="text-gray-500 text-xs">Super Admin</div>
            </div>
            <CustomButton 
              variant="outline" 
              size="icon"
              className="flex items-center p-1 border-gray-200 hover:bg-gray-100 text-gray-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </CustomButton>
          </div>
        </div>
      </div>
    </header>
  );
}
