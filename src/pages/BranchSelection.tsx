import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomButton } from "@/components/ui/CustomButton";
import { useToast } from "@/hooks/use-toast";
import { Heart, Building, ArrowRight } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  status: string;
}

const BranchSelection = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const availableBranches = localStorage.getItem("availableBranches");
    if (availableBranches) {
      try {
        const branchesData = JSON.parse(availableBranches);
        setBranches(branchesData);
      } catch (error) {
        console.error("Error parsing branches data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to load branch information.",
        });
        navigate("/branch-admin-login");
      }
    } else {
      navigate("/branch-admin-login");
    }
  }, [navigate, toast]);

  const handleBranchSelection = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const handleContinue = () => {
    if (!selectedBranch) return;

    setIsLoading(true);
    
    // Store selected branch information
    localStorage.setItem("currentBranchId", selectedBranch.id);
    localStorage.setItem("currentBranchName", selectedBranch.name);
    
    // Clean up temporary data
    localStorage.removeItem("availableBranches");
    
    // Properly encode branch name for URL
    const encodedBranchName = encodeURIComponent(selectedBranch.name);
    
    toast({
      title: "Branch Selected",
      description: `Redirecting to ${selectedBranch.name}...`,
    });
    
    setTimeout(() => {
      const targetPath = `/branch-dashboard/${selectedBranch.id}/${encodedBranchName}`;
      navigate(targetPath, { replace: true });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/lovable-uploads/3c8cdaf9-5267-424f-af69-9a1ce56b7ec5.png" alt="Med-Infinite Logo" className="h-10 w-10" />
            <div className="flex flex-col text-center">
              <span className="text-2xl font-bold text-gray-900">MED-INFINITE</span>
              <span className="text-sm text-gray-500 -mt-1">ENDLESS CARE</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Select Your Branch
          </h2>
          <p className="text-gray-600">
            You have access to multiple branches. Please select the branch you want to manage.
          </p>
        </div>

        {/* Branch Selection */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedBranch?.id === branch.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => handleBranchSelection(branch)}
              >
                <div className="flex items-center space-x-3">
                  <Building className="h-6 w-6 text-blue-600" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {branch.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Status: {branch.status}
                    </p>
                  </div>
                  {selectedBranch?.id === branch.id && (
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Continue Button */}
          <div className="mt-6 flex justify-center">
            <CustomButton
              onClick={handleContinue}
              disabled={!selectedBranch || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md transition duration-200 font-medium flex items-center space-x-2"
            >
              <span>{isLoading ? "Loading..." : "Continue to Dashboard"}</span>
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </CustomButton>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <CustomButton
            variant="ghost"
            onClick={() => navigate("/branch-admin-login")}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Login
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default BranchSelection;