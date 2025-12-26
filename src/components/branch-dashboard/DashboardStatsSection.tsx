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
          className="h-auto py-3 px-4 border-l-4 border-l-blue-500 border border-border shadow-sm bg-gradient-to-r from-blue-50/50 to-card dark:from-blue-950/30 hover:from-blue-100/70 dark:hover:from-blue-950/50 hover:shadow-md hover:shadow-blue-100/30 dark:hover:shadow-blue-900/20 text-left justify-start transition-all duration-300 group"
          onClick={onNewClient}
        >
          <div className="mr-2 md:mr-3 h-8 md:h-9 w-8 md:w-9 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="h-4 md:h-4.5 w-4 md:w-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-semibold text-xs md:text-sm text-card-foreground">New Client</div>
            <div className="text-xs text-muted-foreground hidden md:block">Add client details</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 px-4 border-l-4 border-l-green-500 border border-border shadow-sm bg-gradient-to-r from-green-50/50 to-card dark:from-green-950/30 hover:from-green-100/70 dark:hover:from-green-950/50 hover:shadow-md hover:shadow-green-100/30 dark:hover:shadow-green-900/20 text-left justify-start transition-all duration-300 group"
          onClick={() => onTabChange("bookings")}
        >
          <div className="mr-2 md:mr-3 h-8 md:h-9 w-8 md:w-9 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="h-4 md:h-4.5 w-4 md:w-4.5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="font-semibold text-xs md:text-sm text-card-foreground">Schedule</div>
            <div className="text-xs text-muted-foreground hidden md:block">View calendar</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 px-4 border-l-4 border-l-amber-500 border border-border shadow-sm bg-gradient-to-r from-amber-50/50 to-card dark:from-amber-950/30 hover:from-amber-100/70 dark:hover:from-amber-950/50 hover:shadow-md hover:shadow-amber-100/30 dark:hover:shadow-amber-900/20 text-left justify-start transition-all duration-300 group"
          onClick={() => onTabChange("reports")}
        >
          <div className="mr-2 md:mr-3 h-8 md:h-9 w-8 md:w-9 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="h-4 md:h-4.5 w-4 md:w-4.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-semibold text-xs md:text-sm text-card-foreground">Reports</div>
            <div className="text-xs text-muted-foreground hidden md:block">Generate reports</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          className="h-auto py-3 px-4 border-l-4 border-l-purple-500 border border-border shadow-sm bg-gradient-to-r from-purple-50/50 to-card dark:from-purple-950/30 hover:from-purple-100/70 dark:hover:from-purple-950/50 hover:shadow-md hover:shadow-purple-100/30 dark:hover:shadow-purple-900/20 text-left justify-start transition-all duration-300 group"
          onClick={() => onTabChange("carers")}
        >
          <div className="mr-2 md:mr-3 h-8 md:h-9 w-8 md:w-9 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users className="h-4 md:h-4.5 w-4 md:w-4.5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="font-semibold text-xs md:text-sm text-card-foreground">Carers</div>
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
          iconBgClass="bg-blue-500/20"
          iconColorClass="text-blue-600"
          gradientClass="bg-gradient-to-br from-blue-50/80 to-card dark:from-blue-950/30"
          borderColorClass="border-l-blue-500"
          shadowColorClass="hover:shadow-blue-200/50 dark:hover:shadow-blue-900/30"
        />
        <DashboardStat 
          title="Today's Bookings" 
          value={dashboardStats?.todaysBookingsCount?.toString() ?? "0"} 
          change={dashboardStats?.todaysBookingsChange ?? "0%"} 
          icon={<Calendar className="h-5 w-5 text-green-600" />} 
          positive={dashboardStats?.todaysBookingsChangePositive ?? true} 
          isLoading={isLoadingDashboardStats}
          onClick={handleTodaysBookingsClick}
          iconBgClass="bg-green-500/20"
          iconColorClass="text-green-600"
          gradientClass="bg-gradient-to-br from-green-50/80 to-card dark:from-green-950/30"
          borderColorClass="border-l-green-500"
          shadowColorClass="hover:shadow-green-200/50 dark:hover:shadow-green-900/30"
        />
        <DashboardStat 
          title="Pending Feedbacks" 
          value={dashboardStats?.pendingReviewsCount?.toString() ?? "0"} 
          change={dashboardStats?.pendingReviewsChange ?? "0%"} 
          icon={<FileText className="h-5 w-5 text-amber-600" />} 
          positive={dashboardStats?.pendingReviewsChangePositive ?? true} 
          isLoading={isLoadingDashboardStats}
          onClick={handlePendingFeedbacksClick}
          iconBgClass="bg-amber-500/20"
          iconColorClass="text-amber-600"
          gradientClass="bg-gradient-to-br from-amber-50/80 to-card dark:from-amber-950/30"
          borderColorClass="border-l-amber-500"
          shadowColorClass="hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30"
        />
        <DashboardStat 
          title="Monthly Revenue" 
          value={`£${(dashboardStats?.monthlyRevenue ?? 0).toLocaleString()}`} 
          change={dashboardStats?.monthlyRevenueChange ?? "0%"} 
          icon={<BarChart4 className="h-5 w-5 text-purple-600" />} 
          positive={dashboardStats?.monthlyRevenueChangePositive ?? true} 
          isLoading={isLoadingDashboardStats}
          onClick={handleMonthlyRevenueClick}
          iconBgClass="bg-purple-500/20"
          iconColorClass="text-purple-600"
          gradientClass="bg-gradient-to-br from-purple-50/80 to-card dark:from-purple-950/30"
          borderColorClass="border-l-purple-500"
          shadowColorClass="hover:shadow-purple-200/50 dark:hover:shadow-purple-900/30"
        />
      </div>
    </motion.div>
  );
};
