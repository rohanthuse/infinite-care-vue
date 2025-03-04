
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
    <header className="bg-white shadow-soft px-6 py-4 flex justify-between items-center">
      <div className="flex-1">
        <h2 className="text-xl font-bold bg-gradient-to-r from-med-600 to-med-500 bg-clip-text text-transparent">
          Med-infinite Healthcare Services
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-gray-700 font-medium">
          <HelpCircle className="h-4 w-4 mr-2" /> Help Guide
        </Button>
        <CustomButton 
          size="sm" 
          className="bg-med-500 hover:bg-med-600 text-white font-medium"
        >
          New Screen
        </CustomButton>
        <div className="flex items-center ml-4">
          <span className="mr-3 text-gray-800 font-medium">Welcome, Administrator</span>
          <CustomButton 
            variant="outline" 
            size="icon"
            className="flex items-center p-1 border-gray-200 hover:bg-gray-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </CustomButton>
        </div>
      </div>
    </header>
  );
}
