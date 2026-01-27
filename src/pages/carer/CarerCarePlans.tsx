
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Filter, FileText, User, Calendar, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, differenceInDays, addDays } from "date-fns";
import { CarePlanViewDialog } from "@/components/care/CarePlanViewDialog";
import { useCarerAssignedCarePlans } from "@/hooks/useCarePlanData";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { useCarePlansNeedingReviewCount } from "@/hooks/useCarePlansNeedingReview";

const CarerCarePlans: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarePlanId, setSelectedCarePlanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('filter') || "all");
  
  const { user, isAuthenticated, loading } = useCarerAuth();
  const { data: carerProfile } = useCarerProfile();
  const { data: carePlans, isLoading, error } = useCarerAssignedCarePlans(user?.id || '');
  const { total: needsReviewCount } = useCarePlansNeedingReviewCount(carerProfile?.id || '');
  
  // Update tab from URL params
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam === 'needs-review') {
      setActiveTab('needs-review');
    }
  }, [searchParams]);

  // Show loading state while checking authentication or loading care plans
  if (loading || isLoading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  if (error) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <h1 className="text-xl md:text-2xl font-bold">My Care Plans</h1>
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Error loading care plans</h3>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  // Helper to check if a care plan needs review (within 7 days or overdue)
  const carePlanNeedsReview = (reviewDate: string | null) => {
    if (!reviewDate) return false;
    const now = new Date();
    const review = new Date(reviewDate);
    const sevenDaysFromNow = addDays(now, 7);
    return review <= sevenDaysFromNow;
  };

  // Transform Supabase data to match the expected format
  const transformedCarePlans = carePlans?.map(plan => {
    const needsReview = carePlanNeedsReview(plan.review_date);
    const daysUntilReview = plan.review_date 
      ? differenceInDays(new Date(plan.review_date), new Date())
      : null;
    
    return {
      id: plan.id,
      clientName: plan.client ? `${plan.client.first_name} ${plan.client.last_name}` : 'Unknown Client',
      dateCreated: new Date(plan.created_at),
      lastUpdated: new Date(plan.updated_at),
      status: plan.status === 'active' ? 'Active' : plan.status,
      type: plan.care_plan_type || 'Standard Care',
      alerts: plan.status === 'rejected' ? 1 : 0,
      isDirectlyAssigned: plan.isDirectlyAssigned || false,
      assignmentType: plan.isDirectlyAssigned ? 'Direct' : 'Branch',
      reviewDate: plan.review_date,
      needsReview,
      daysUntilReview,
      isOverdue: daysUntilReview !== null && daysUntilReview < 0,
      tasks: plan.activities?.map(activity => ({
        id: activity.id,
        name: activity.name,
        completed: activity.status === 'completed'
      })) || []
    };
  }) || [];

  // Count care plans needing review
  const carePlansNeedingReview = transformedCarePlans.filter(p => p.needsReview);

  const filteredCarePlans = transformedCarePlans.filter(carePlan => {
    const searchMatches = 
      carePlan.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      carePlan.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const tabMatches = 
      activeTab === "all" || 
      (activeTab === "active" && (carePlan.status === 'Active' || carePlan.status === 'active' || carePlan.status === 'approved')) ||
      (activeTab === "alerts" && carePlan.alerts > 0) ||
      (activeTab === "needs-review" && carePlan.needsReview);
    
    return searchMatches && tabMatches;
  });

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">My Care Plans</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              className="pl-8"
              placeholder="Search care plans by client or type" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">All ({transformedCarePlans.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({transformedCarePlans.filter(plan => plan.status === 'active' || plan.status === 'approved' || plan.status === 'Active').length})</TabsTrigger>
            <TabsTrigger value="needs-review" className="relative">
              <RefreshCw className="h-3 w-3 mr-1" />
              Needs Review
              {carePlansNeedingReview.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {carePlansNeedingReview.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Requires Attention
              {transformedCarePlans.filter(plan => plan.alerts > 0).length > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {transformedCarePlans.filter(plan => plan.alerts > 0).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCarePlans.length > 0 ? (
          filteredCarePlans.map((carePlan) => (
            <Card key={carePlan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedCarePlanId(carePlan.id)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium">
                      {carePlan.clientName.split(" ").map(name => name[0]).join("")}
                    </div>
                    <CardTitle className="text-lg">{carePlan.clientName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {carePlan.needsReview && (
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${
                          carePlan.isOverdue 
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800' 
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                        }`}
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>{carePlan.isOverdue ? 'Overdue' : 'Review Due'}</span>
                      </Badge>
                    )}
                    {carePlan.alerts > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{carePlan.alerts}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">{carePlan.type}</div>
                  <Badge variant={carePlan.isDirectlyAssigned ? "default" : "secondary"} className="text-xs">
                    {carePlan.assignmentType}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <div className="text-muted-foreground">Created:</div>
                    <div className="text-foreground">{format(carePlan.dateCreated, "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Updated:</div>
                    <div className="text-foreground">{format(carePlan.lastUpdated, "MMM d, yyyy")}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tasks</div>
                  <div className="space-y-1">
                    {carePlan.tasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center gap-2">
                        {task.completed ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />
                        )}
                        <span className="text-sm truncate">{task.name}</span>
                      </div>
                    ))}
                    {carePlan.tasks.length > 3 && (
                      <div className="text-sm text-muted-foreground pl-5">+ {carePlan.tasks.length - 3} more tasks</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-1 md:col-span-3 py-12 text-center bg-card border border-border rounded-lg">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No care plans assigned</h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery ? "Try a different search term" : "You have no care plans assigned at this time"}
            </p>
          </div>
        )}
      </div>
      
      {/* Detailed Care Plan View */}
      {selectedCarePlanId && (
        <CarePlanViewDialog 
          carePlanId={selectedCarePlanId}
          open={Boolean(selectedCarePlanId)}
          onOpenChange={(open) => !open && setSelectedCarePlanId(null)}
        />
      )}
    </div>
  );
};

export default CarerCarePlans;
