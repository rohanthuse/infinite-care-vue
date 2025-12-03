import React from "react";
import { motion } from "framer-motion";
import { Calendar, Users, BarChart4, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardStat } from "@/components/dashboard/DashboardStat";
import { useBranchDashboardStats } from "@/data/hooks/useBranchDashboardStats";
import { useBookingNavigation } from "@/hooks/useBookingNavigation";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";

interface DashboardStatsSectionProps {
  branchId: string | undefined;
  onNewClient: () => void;
  onTabChange: (tab: string) => void;
}

export const DashboardStatsSection: React.FC<DashboardStatsSectionProps> = ({
  branchId,
  onNewClient,
  onTabChange
}) => {
  const { data: dashboardStats, isLoading: isLoadingDashboardStats } = useBranchDashboardStats(branchId);
  const { navigateToBookings } = useBookingNavigation();
  const { branchName } = useBranchDashboardNavigation();

  const handleTodaysBookingsClick = () => {
    if (branchId && branchName) {
      navigateToBookings({
        branchId,
        branchName,
        date: new Date(), // Today's date
      });
    }
  };

  const handleTotalClientsClick = () => {
    onTabChange("clients");
  };

  const handlePendingFeedbacksClick = () => {
    onTabChange("reviews");
  };

  const handleMonthlyRevenueClick = () => {
    onTabChange("accounting");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-4 md:mt-6"
    >
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          variant="outline"
          className="h-auto py-3 px-4 border border-border shadow-sm bg-card hover:bg-accent text-left justify-start"
          onClick={onNewClient}
        >
          <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-primary/10 flex items-center justify-center">
            <Plus className="h-3.5 md:h-4 w-3.5 md:w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium text-xs md:text-sm text-card-foreground">New Client</div>
            <div className="text-xs text-muted-foreground hidden md:block">Add client details</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 px-4 border border-border shadow-sm bg-card hover:bg-accent text-left justify-start"
          onClick={() => onTabChange("bookings")}
        >
          <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-green-500/10 flex items-center justify-center">
            <Calendar className="h-3.5 md:h-4 w-3.5 md:w-4 text-green-600" />
          </div>
          <div>
            <div className="font-medium text-xs md:text-sm text-card-foreground">Schedule</div>
            <div className="text-xs text-muted-foreground hidden md:block">View calendar</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 px-4 border border-border shadow-sm bg-card hover:bg-accent text-left justify-start"
          onClick={() => onTabChange("reports")}
        >
          <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-amber-500/10 flex items-center justify-center">
            <FileText className="h-3.5 md:h-4 w-3.5 md:w-4 text-amber-600" />
          </div>
          <div>
            <div className="font-medium text-xs md:text-sm text-card-foreground">Reports</div>
            <div className="text-xs text-muted-foreground hidden md:block">Generate reports</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 px-4 border border-border shadow-sm bg-card hover:bg-accent text-left justify-start"
          onClick={() => onTabChange("carers")}
        >
          <div className="mr-2 md:mr-3 h-7 md:h-8 w-7 md:w-8 rounded-md bg-purple-500/10 flex items-center justify-center">
            <Users className="h-3.5 md:h-4 w-3.5 md:w-4 text-purple-600" />
          </div>
          <div>
            <div className="font-medium text-xs md:text-sm text-card-foreground">Carers</div>
            <div className="text-xs text-muted-foreground hidden md:block">Manage carers</div>
          </div>
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
        <DashboardStat 
          title="Total Clients" 
          value={dashboardStats?.clientsCount?.toString() ?? "0"} 
          change={dashboardStats?.clientsChange ?? "0%"} 
          icon={<Users className="h-5 w-5 text-blue-600" />} 
          positive={dashboardStats?.clientsChangePositive ?? true} 
          isLoading={isLoadingDashboardStats}
          onClick={handleTotalClientsClick}
          iconBgClass="bg-blue-500/10"
          iconColorClass="text-blue-600"
        />
        <DashboardStat 
          title="Today's Bookings" 
          value={dashboardStats?.todaysBookingsCount?.toString() ?? "0"} 
          change={dashboardStats?.todaysBookingsChange ?? "0%"} 
          icon={<Calendar className="h-5 w-5 text-green-600" />} 
          positive={dashboardStats?.todaysBookingsChangePositive ?? true} 
          isLoading={isLoadingDashboardStats}
          onClick={handleTodaysBookingsClick}
          iconBgClass="bg-green-500/10"
          iconColorClass="text-green-600"
        />
        <DashboardStat 
          title="Pending Feedbacks" 
          value={dashboardStats?.pendingReviewsCount?.toString() ?? "0"} 
          change={dashboardStats?.pendingReviewsChange ?? "0%"} 
          icon={<FileText className="h-5 w-5 text-amber-600" />} 
          positive={dashboardStats?.pendingReviewsChangePositive ?? true} 
          isLoading={isLoadingDashboardStats}
          onClick={handlePendingFeedbacksClick}
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-600"
        />
        <DashboardStat 
          title="Monthly Revenue" 
          value={`£${(dashboardStats?.monthlyRevenue ?? 0).toLocaleString()}`} 
          change={dashboardStats?.monthlyRevenueChange ?? "0%"} 
          icon={<BarChart4 className="h-5 w-5 text-purple-600" />} 
          positive={dashboardStats?.monthlyRevenueChangePositive ?? true} 
          isLoading={isLoadingDashboardStats}
          onClick={handleMonthlyRevenueClick}
          iconBgClass="bg-purple-500/10"
          iconColorClass="text-purple-600"
        />
      </div>
    </motion.div>
  );
};
