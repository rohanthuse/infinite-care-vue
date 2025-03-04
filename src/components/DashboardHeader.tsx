
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
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <div className="flex-1">
        <h2 className="text-lg font-bold text-blue-600">Med-infinite Healthcare Services</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-gray-600">
          <HelpCircle className="h-4 w-4 mr-1" /> Help Guide
        </Button>
        <CustomButton 
          size="sm" 
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          New Screen
        </CustomButton>
        <div className="flex items-center ml-4">
          <span className="mr-2 text-gray-700">Welcome, Administrator</span>
          <CustomButton 
            variant="outline" 
            size="icon"
            className="flex items-center p-1"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </CustomButton>
        </div>
      </div>
    </header>
  );
}
