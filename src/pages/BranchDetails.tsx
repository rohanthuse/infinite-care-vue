import React from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { motion } from "framer-motion";
import { 
  Building2, Calendar, Users, FileText, Clock, 
  BarChart4, AlertCircle, Clipboard, ArrowLeft, UserCog,
  LayoutDashboard, Loader2, Star
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useBranch } from "@/data/hooks/branches";
import { useBranchStatistics } from "@/data/hooks/useBranchStatistics";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const BranchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: branchData, isLoading, error } = useBranch(id);
  const { data: stats, isLoading: isLoadingStats, error: errorStats } = useBranchStatistics(id);

  const handleNavigateToBranchAdmins = () => {
    toast.success("Navigating to Branch Admins dashboard");
    navigate('/admin/branch-admins');
  };

  const handleNavigateToBranchDashboard = () => {
    toast.success("Navigating to Branch Dashboard");
    if (branchData) {
      navigate(`/admin/branch-dashboard/${branchData.id}/${encodeURIComponent(branchData.name)}`);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, isLoading }: { icon: any, title: string, value: number | string, color: string, isLoading?: boolean }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col`}>
      <div className="flex items-center mb-2">
        <div className={`p-2 rounded-md ${color} mr-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-1/2" />
      ) : (
        <p className="text-2xl font-bold">{value}</p>
      )}
    </div>
  );

  const statCardsData = [
    { title: "Active Carers", value: stats?.staffCount ?? 0, icon: Users, color: "bg-blue-500" },
    { title: "Active Clients", value: stats?.clientsCount ?? 0, icon: Users, color: "bg-green-500" },
    { title: "Total Bookings", value: stats?.bookingsCount ?? 0, icon: Calendar, color: "bg-purple-500" },
    { title: "Total Reviews", value: stats?.reviewsCount ?? 0, icon: FileText, color: "bg-yellow-500" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-[50vh] bg-red-50 text-red-700 rounded-lg p-8">
                <AlertCircle className="h-12 w-12 mb-4" />
                <h2 className="text-xl font-bold mb-2">Error loading branch details</h2>
                <p>{error.message}</p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => navigate('/admin/branch')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Branches
                </Button>
            </div>
        ) : branchData ? (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex items-start gap-4">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full border-gray-200"
                  onClick={() => navigate('/admin/branch')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">{branchData.name}</h1>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
                      {branchData.status}
                    </Badge>
                    <span className="text-gray-500 text-sm">
                      {branchData.branch_type} | {branchData.country} | {branchData.regulatory}
                    </span>
                  </div>
                   <div className="text-gray-500 text-sm mt-2">
                    Created on {format(new Date(branchData.created_at), 'dd MMM, yyyy')} by {branchData.created_by || 'System'}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-md border-gray-200 flex items-center gap-2"
                  onClick={handleNavigateToBranchDashboard}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Branch Dashboard
                </Button>
                <Button 
                  variant="outline"
                  className="rounded-md border-gray-200 flex items-center gap-2"
                  onClick={handleNavigateToBranchAdmins}
                >
                  <UserCog className="h-4 w-4" />
                  Branch Admins
                </Button>
                <Button variant="outline" className="rounded-md border-gray-200">
                  Edit Branch
                </Button>
                <CustomButton className="bg-blue-600 hover:bg-blue-700">
                  Manage Carers
                </CustomButton>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCardsData.map(card => (
                <StatCard 
                  key={card.title}
                  icon={card.icon}
                  title={card.title}
                  value={card.value}
                  color={card.color}
                  isLoading={isLoadingStats}
                />
              ))}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <BarChart4 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Weekly Statistics</h2>
                </div>
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-gray-500">Bar chart to be implemented</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Today's Bookings</h2>
                </div>
                <div className="mt-4">
                  {isLoadingStats ? (
                    Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-10 w-10 rounded-full" />
                           <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                           </div>
                        </div>
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                    ))
                  ) : errorStats ? (
                    <p className="text-red-500 text-center py-4">Error loading bookings.</p>
                  ) : stats?.todaysBookings && stats.todaysBookings.length > 0 ? (
                    stats.todaysBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-full">
                            <Users className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{booking.staff?.first_name || 'N/A'}, {booking.staff?.last_name || ''}</p>
                            <p className="text-xs text-gray-500">Client: {booking.client?.first_name || 'N/A'}, {booking.client?.last_name || ''}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">{format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No bookings for today.</p>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Expiry Alerts</h2>
                </div>
                <div className="mt-4">
                  {isLoadingStats ? (
                     Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                           <Skeleton className="h-10 w-10 rounded-full" />
                           <div className="space-y-2">
                            <Skeleton className="h-4 w-[150px]" />
                            <Skeleton className="h-3 w-[100px]" />
                           </div>
                        </div>
                        <Skeleton className="h-6 w-[70px] rounded-full" />
                      </div>
                    ))
                  ) : errorStats ? (
                    <p className="text-red-500 text-center py-4">Error loading expiry alerts.</p>
                  ) : stats?.expiryAlerts && stats.expiryAlerts.length > 0 ? (
                    stats.expiryAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-100 p-2 rounded-full">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{alert.staff?.first_name || 'N/A'}, {alert.staff?.last_name || ''}</p>
                            <p className="text-xs text-gray-500">{alert.document_type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          Expired
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No expiry alerts.</p>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clipboard className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-800">Latest Reviews</h2>
                </div>
                <div className="mt-4">
                  {isLoadingStats ? (
                     Array(3).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                             <Skeleton className="h-10 w-10 rounded-full" />
                             <div className="space-y-2">
                              <Skeleton className="h-4 w-[150px]" />
                              <Skeleton className="h-3 w-[100px]" />
                             </div>
                          </div>
                          <Skeleton className="h-4 w-[100px]" />
                        </div>
                      ))
                  ) : errorStats ? (
                    <p className="text-red-500 text-center py-4">Error loading latest reviews.</p>
                  ) : stats?.latestReviews && stats.latestReviews.length > 0 ? (
                    stats.latestReviews.map((review) => (
                      <div key={review.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-100 p-2 rounded-full">
                            <Users className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-medium">{review.client?.first_name || 'N/A'}, {review.client?.last_name || ''}</p>
                            <p className="text-xs text-gray-500">Carer: {review.staff?.first_name || 'N/A'}, {review.staff?.last_name || ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star key={j} className={`h-4 w-4 ${j < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No reviews yet.</p>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        ) : (
           <div className="flex flex-col items-center justify-center h-[50vh]">
                <p>Branch not found.</p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => navigate('/admin/branch')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Branches
                </Button>
            </div>
        )}
      </motion.main>
    </div>
  );
};

export default BranchDetails;
