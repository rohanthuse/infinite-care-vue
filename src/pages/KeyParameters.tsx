
import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ListChecks, ChevronRight } from "lucide-react";
import { TabNavigation } from "@/components/TabNavigation";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import KeyParametersContent from "@/components/keyparameters/KeyParametersContent";

const KeyParameters = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { id, branchName } = params;
  const [activeTab, setActiveTab] = useState("key-parameters");
  
  const isInBranchContext = Boolean(id && branchName);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <div className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full">
        {isInBranchContext && (
          <div className="mb-6">
            <TabNavigation 
              activeTab={activeTab} 
              onChange={(tab) => {
                setActiveTab(tab);
                navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
              }}
              hideQuickAdd={true}
            />
          </div>
        )}
        
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              {isInBranchContext ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/branch-dashboard/${id}/${branchName}`}>
                        Dashboard
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">
                      Dashboard
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbLink>Core Settings</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <KeyParametersContent branchId={id} branchName={branchName} />
      </div>
    </div>
  );
};

export default KeyParameters;
