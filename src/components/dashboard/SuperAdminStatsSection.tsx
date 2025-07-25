import React from "react";
import { motion } from "framer-motion";
import { Calendar, Users, BarChart4, FileText } from "lucide-react";
import { DashboardStat } from "@/components/dashboard/DashboardStat";
import { useSuperAdminStats } from "@/hooks/useSuperAdminStats";
import { useSuperAdminNavigation } from "@/hooks/useSuperAdminNavigation";

export const SuperAdminStatsSection: React.FC = () => {
  const { data: stats, isLoading } = useSuperAdminStats();
  const { navigateToClients, navigateToBookings, navigateToReviews, navigateToAccounting } = useSuperAdminNavigation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">System Overview</h2>
        <p className="text-gray-600">Monitor key metrics across all branches</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div onClick={navigateToClients} className="cursor-pointer">
          <DashboardStat 
            title="Total Clients" 
            value={stats?.totalClientsCount?.toString() ?? "0"} 
            change={stats?.totalClientsChange ?? "0%"} 
            icon={<Users className="h-5 w-5 text-blue-600" />} 
            positive={stats?.totalClientsChangePositive ?? true} 
            isLoading={isLoading}
          />
        </div>
        
        <div onClick={navigateToBookings} className="cursor-pointer">
          <DashboardStat 
            title="Today's Bookings" 
            value={stats?.todaysBookingsCount?.toString() ?? "0"} 
            change={stats?.todaysBookingsChange ?? "0%"} 
            icon={<Calendar className="h-5 w-5 text-green-600" />} 
            positive={stats?.todaysBookingsChangePositive ?? true} 
            isLoading={isLoading}
          />
        </div>
        
        <div onClick={navigateToReviews} className="cursor-pointer">
          <DashboardStat 
            title="Pending Reviews" 
            value={stats?.pendingReviewsCount?.toString() ?? "0"} 
            change={stats?.pendingReviewsChange ?? "0%"} 
            icon={<FileText className="h-5 w-5 text-amber-600" />} 
            positive={stats?.pendingReviewsChangePositive ?? true} 
            isLoading={isLoading}
          />
        </div>
        
        <div onClick={navigateToAccounting} className="cursor-pointer">
          <DashboardStat 
            title="Monthly Revenue" 
            value={`£${(stats?.monthlyRevenue ?? 0).toLocaleString()}`} 
            change={stats?.monthlyRevenueChange ?? "0%"} 
            icon={<BarChart4 className="h-5 w-5 text-purple-600" />} 
            positive={stats?.monthlyRevenueChangePositive ?? true} 
            isLoading={isLoading}
          />
        </div>
      </div>
    </motion.div>
  );
};