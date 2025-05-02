import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Star, ThumbsUp, ThumbsDown, ChevronLeft, ChevronRight, Download, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

export interface ReviewsTabProps {
  branchId?: string;
  branchName?: string;
}

// Existing mock reviews
const mockReviews = [
  {
    id: "REV-001",
    clientName: "Pender, Eva",
    clientInitials: "EP",
    carerName: "Warren, Susan",
    carerInitials: "WS",
    rating: 5,
    comment: "Excellent care and attention to detail. Susan was very professional and caring.",
    date: "26/01/2023",
    status: "Published"
  },
  {
    id: "REV-002",
    clientName: "Pender, Eva",
    clientInitials: "EP",
    carerName: "Charuma, Charmaine",
    carerInitials: "CC",
    rating: 5,
    comment: "Very professional and friendly service. Would highly recommend.",
    date: "26/01/2023",
    status: "Published"
  },
  {
    id: "REV-003",
    clientName: "Fulcher, Patricia",
    clientInitials: "FP",
    carerName: "Ayo-Famure, Opeyemi",
    carerInitials: "AF",
    rating: 4,
    comment: "Good service but arrived a bit late. Otherwise very satisfied with the care provided.",
    date: "22/01/2023",
    status: "Published"
  },
  {
    id: "REV-004",
    clientName: "Baulch, Ursula",
    clientInitials: "BU",
    carerName: "Smith, John",
    carerInitials: "SJ",
    rating: 3,
    comment: "Average service. Could improve on timeliness and communication.",
    date: "18/01/2023",
    status: "Under Review"
  },
  {
    id: "REV-005",
    clientName: "Ren, Victoria",
    clientInitials: "RV",
    carerName: "Williams, Mary",
    carerInitials: "WM",
    rating: 5,
    comment: "Exceptional service. Mary was attentive and professional throughout.",
    date: "15/01/2023",
    status: "Published"
  },
  {
    id: "REV-006",
    clientName: "Iyaniwura, Ifeoluwa",
    clientInitials: "II",
    carerName: "Warren, Susan",
    carerInitials: "WS",
    rating: 2,
    comment: "Disappointed with the service. Carer was late and seemed rushed.",
    date: "10/01/2023",
    status: "Under Review"
  },
  {
    id: "REV-007",
    clientName: "Johnson, Andrew",
    clientInitials: "JA",
    carerName: "Charuma, Charmaine",
    carerInitials: "CC",
    rating: 5,
    comment: "Charmaine is an excellent carer. Very attentive and professional.",
    date: "05/01/2023",
    status: "Published"
  },
  {
    id: "REV-008",
    clientName: "Mistry, Sanjay",
    clientInitials: "MS",
    carerName: "Ayo-Famure, Opeyemi",
    carerInitials: "AF",
    rating: 4,
    comment: "Good service overall. Would use again.",
    date: "02/01/2023",
    status: "Published"
  }
];

// Adding client-submitted reviews with pending status
const allReviews = [
  ...mockReviews,
  {
    id: "REV-009",
    clientName: "Johnson, Andrew",
    clientInitials: "JA",
    carerName: "Warren, Susan",
    carerInitials: "WS",
    rating: 3,
    comment: "The service was okay, but the carer was 15 minutes late. Otherwise professional care was provided.",
    date: "01/05/2025",
    status: "Under Review"
  },
  {
    id: "REV-010",
    clientName: "Pender, Eva",
    clientInitials: "EP",
    carerName: "Smith, John",
    carerInitials: "SJ",
    rating: 2,
    comment: "I was not satisfied with the care provided. The carer seemed distracted and didn't follow my care plan properly.",
    date: "30/04/2025",
    status: "Under Review"
  }
];

const ReviewsTab: React.FC<ReviewsTabProps> = ({ branchId, branchName }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isViewingReview, setIsViewingReview] = useState(false);
  const { toast } = useToast();
  
  const itemsPerPage = 5;

  // Filter reviews based on active tab
  const tabFilteredReviews = allReviews.filter(review => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return review.status === "Published";
    if (activeTab === "pending") return review.status === "Under Review";
    if (activeTab === "negative") return review.rating <= 3;
    return true;
  });

  // Apply search and filters
  const filteredReviews = tabFilteredReviews.filter(review => {
    const matchesSearch = 
      review.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.carerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || review.status === statusFilter;
    const matchesRating = ratingFilter === "all" || review.rating === parseInt(ratingFilter);
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  const handleViewReview = (review: any) => {
    setSelectedReview(review);
    setIsViewingReview(true);
  };

  const handleApproveReview = (review: any) => {
    setSelectedReview(review);
    setIsApproving(true);
  };

  const handleRejectReview = (review: any) => {
    setSelectedReview(review);
    setIsRejecting(true);
  };

  const confirmApproval = () => {
    // In a real app, this would update the database
    toast({
      title: "Review approved",
      description: `The review from ${selectedReview.clientName} has been published.`
    });
    setIsApproving(false);
  };

  const confirmRejection = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for rejecting this review.",
        variant: "destructive"
      });
      return;
    }

    // In a real app, this would update the database
    toast({
      title: "Review rejected",
      description: `The review from ${selectedReview.clientName} has been rejected.`
    });
    setIsRejecting(false);
    setRejectionReason("");
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Reviews & Feedback</h2>
            <p className="text-gray-500 text-sm mt-1">
              Manage and respond to client reviews and feedback
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
            <TabsTrigger value="negative">Negative</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search reviews..." 
                className="pl-10 pr-4" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
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
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-gray-50/90">
              <TableHead className="text-gray-600 font-medium w-[100px]">Review ID</TableHead>
              <TableHead className="text-gray-600 font-medium">Client</TableHead>
              <TableHead className="text-gray-600 font-medium">Carer</TableHead>
              <TableHead className="text-gray-600 font-medium">Rating</TableHead>
              <TableHead className="text-gray-600 font-medium">Comment</TableHead>
              <TableHead className="text-gray-600 font-medium">Date</TableHead>
              <TableHead className="text-gray-600 font-medium">Status</TableHead>
              <TableHead className="text-gray-600 font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReviews.length > 0 ? (
              paginatedReviews.map((review) => (
                <TableRow key={review.id} className="hover:bg-gray-50 border-t border-gray-100">
                  <TableCell className="font-medium">
                    <Button variant="ghost" className="p-0 h-auto font-medium underline-offset-4 hover:underline" onClick={() => handleViewReview(review)}>
                      {review.id}
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
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`
                        ${review.status === "Published" ? "bg-green-50 text-green-700 border-0" : ""}
                        ${review.status === "Under Review" ? "bg-amber-50 text-amber-700 border-0" : ""}
                        px-3 py-1 rounded-full
                      `}
                    >
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {review.status === "Under Review" && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => handleApproveReview(review)}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2"
                            onClick={() => handleRejectReview(review)}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {review.status === "Published" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2"
                          onClick={() => handleViewReview(review)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  No reviews found matching your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {paginatedReviews.length > 0 && (
        <div className="flex items-center justify-between p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
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
              <DialogTitle>Review Details</DialogTitle>
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
                <p className="text-sm font-medium text-gray-500">Comment</p>
                <div className="text-sm mt-1 p-3 bg-gray-50 rounded border border-gray-100">
                  {selectedReview.comment}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-sm">{selectedReview.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge 
                    variant="outline" 
                    className={`
                      ${selectedReview.status === "Published" ? "bg-green-50 text-green-700 border-0" : ""}
                      ${selectedReview.status === "Under Review" ? "bg-amber-50 text-amber-700 border-0" : ""}
                      px-2 py-0.5 rounded-full mt-1
                    `}
                  >
                    {selectedReview.status}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewingReview(false)}>Close</Button>
              {selectedReview.status === "Under Review" && (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsViewingReview(false);
                    handleApproveReview(selectedReview);
                  }}>
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsViewingReview(false);
                    handleRejectReview(selectedReview);
                  }}>
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={isApproving} onOpenChange={setIsApproving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve and publish this review from {selectedReview?.clientName}? 
              The review will be visible to other clients but not to the rated carer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApproval}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Dialog */}
      <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Review</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this review. This information will be shared with the client.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-32"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsRejecting(false);
              setRejectionReason("");
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejection}>
              Reject Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsTab;
