import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Star, ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useBranchReviews, type BranchReview } from "@/hooks/useBranchReviews";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ReviewsTabProps {
  branchId?: string;
  branchName?: string;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ branchId, branchName }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<BranchReview | null>(null);
  const [isViewingReview, setIsViewingReview] = useState(false);
  
  const queryClient = useQueryClient();
  const itemsPerPage = 5;

  // Determine rating filter based on active tab
  const getEffectiveRatingFilter = useCallback(() => {
    if (activeTab === "positive") return "4-5";
    if (activeTab === "negative") return "1-3";
    return ratingFilter;
  }, [activeTab, ratingFilter]);

  // Fetch reviews data
  const { 
    data: reviewsData, 
    isLoading, 
    error,
    refetch 
  } = useBranchReviews({
    branchId: branchId || '',
    searchQuery,
    ratingFilter: getEffectiveRatingFilter(),
    page: currentPage,
    limit: itemsPerPage
  });

  const reviews = reviewsData?.data || [];
  const totalPages = reviewsData?.totalPages || 0;
  const totalCount = reviewsData?.totalCount || 0;

  // Filter reviews based on active tab (since we need to handle this client-side for complex filters)
  const filteredReviews = React.useMemo(() => {
    if (activeTab === "all") return reviews;
    if (activeTab === "positive") return reviews.filter(review => review.rating >= 4);
    if (activeTab === "negative") return reviews.filter(review => review.rating <= 3);
    return reviews;
  }, [reviews, activeTab]);

  const handleRefresh = async () => {
    try {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['branch-reviews', branchId] });
      toast.success("Reviews refreshed successfully");
    } catch (error) {
      console.error('Error refreshing reviews:', error);
      toast.error("Failed to refresh reviews");
    }
  };

  const handleExport = () => {
    // Generate CSV export of current reviews
    const csvContent = [
      ['Feedback ID', 'Client', 'Carer', 'Rating', 'Comment', 'Date'].join(','),
      ...reviews.map(review => [
        review.id,
        `"${review.clientName}"`,
        `"${review.carerName}"`,
        review.rating,
        `"${review.comment || ''}"`,
        review.date
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviews-${branchName}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success("Reviews exported successfully");
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const handleViewReview = (review: BranchReview) => {
    setSelectedReview(review);
    setIsViewingReview(true);
  };

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, ratingFilter]);

  if (error) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Reviews</h2>
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load reviews: {error.message}</p>
          <Button onClick={handleRefresh} variant="outline" className="group active:scale-95 transition-transform">
            <RefreshCw className="h-4 w-4 mr-2 group-active:-rotate-6 transition-transform" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Client Feedback</h2>
            <p className="text-muted-foreground text-sm mt-1">
              View and analyze client feedback to improve services
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 group active:scale-95 transition-transform" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : 'group-active:-rotate-6'} transition-transform`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={handleExport} disabled={reviews.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Feedback</TabsTrigger>
            <TabsTrigger value="positive">Positive</TabsTrigger>
            <TabsTrigger value="negative">Negative</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search feedback..." 
                className="pl-10 pr-4" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-3">
              <Select value={ratingFilter} onValueChange={setRatingFilter} disabled={isLoading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Tabs>
      </div>
      
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading reviews...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-muted/50">
                <TableHead className="text-muted-foreground font-medium w-[100px]">Feedback ID</TableHead>
                <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                <TableHead className="text-muted-foreground font-medium">Carer</TableHead>
                <TableHead className="text-muted-foreground font-medium">Rating</TableHead>
                <TableHead className="text-muted-foreground font-medium">Comment</TableHead>
                <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                <TableHead className="text-muted-foreground font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-muted/30 border-t border-border">
                    <TableCell className="font-medium">
                      <Button variant="ghost" className="p-0 h-auto font-medium underline-offset-4 hover:underline" onClick={() => handleViewReview(review)}>
                        {review.id.slice(0, 8)}...
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 bg-blue-100 text-blue-600">
                          <AvatarFallback>{review.clientInitials}</AvatarFallback>
                        </Avatar>
                        <span>{review.clientName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 bg-purple-100 text-purple-600">
                          <AvatarFallback>{review.carerInitials}</AvatarFallback>
                        </Avatar>
                        <span>{review.carerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                    <TableCell>{review.date}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2"
                        onClick={() => handleViewReview(review)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    {isLoading ? 'Loading reviews...' : 'No feedback found matching your search criteria.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      
      {reviews.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} feedback entries
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              className="h-8"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* View Review Dialog */}
      {selectedReview && (
        <Dialog open={isViewingReview} onOpenChange={setIsViewingReview}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Feedback Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Client</p>
                <div className="flex items-center mt-1 gap-2">
                  <Avatar className="h-8 w-8 bg-blue-100 text-blue-600">
                    <AvatarFallback>{selectedReview.clientInitials}</AvatarFallback>
                  </Avatar>
                  <span>{selectedReview.clientName}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Carer</p>
                <div className="flex items-center mt-1 gap-2">
                  <Avatar className="h-8 w-8 bg-purple-100 text-purple-600">
                    <AvatarFallback>{selectedReview.carerInitials}</AvatarFallback>
                  </Avatar>
                  <span>{selectedReview.carerName}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Rating</p>
                <div className="flex mt-1">{renderStars(selectedReview.rating)}</div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Comment</p>
                <div className="text-sm mt-1 p-3 bg-muted rounded border border-border">
                  {selectedReview.comment || 'No comment provided'}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p className="text-sm">{selectedReview.date}</p>
              </div>

              <div className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border">
                <p>Note: This feedback is for administrative purposes only and is not shared with the carer.</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewingReview(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReviewsTab;
