
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableHeader, TableBody, TableHead, 
  TableRow, TableCell
} from "@/components/ui/table";
import { 
  Pagination, PaginationContent, PaginationItem, 
  PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, Filter, Star, MessageSquare, ThumbsUp, 
  ThumbsDown, MoreHorizontal, Download
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface ReviewsTabProps {
  branchId?: string;
  branchName?: string;
}

const mockReviews = [
  {
    id: "REV-001",
    patientName: "John Michael",
    patientId: "PT-2356",
    caregiverName: "Sarah Johnson",
    date: new Date("2023-11-15"),
    rating: 5,
    comment: "Excellent care provided. Very attentive and professional.",
    status: "Published",
    avatar: "JM"
  },
  {
    id: "REV-002",
    patientName: "Emma Thompson",
    patientId: "PT-1122",
    caregiverName: "James Wilson",
    date: new Date("2023-10-22"),
    rating: 4,
    comment: "Good service, but could improve on punctuality.",
    status: "Published",
    avatar: "ET"
  },
  {
    id: "REV-003",
    patientName: "Wendy Smith",
    patientId: "PT-3421",
    caregiverName: "David Brown",
    date: new Date("2023-11-05"),
    rating: 5,
    comment: "Very satisfied with the care provided. David was excellent.",
    status: "Under Review",
    avatar: "WS"
  },
  {
    id: "REV-004",
    patientName: "Robert Johnson",
    patientId: "PT-7890",
    caregiverName: "Emma Lewis",
    date: new Date("2023-09-18"),
    rating: 3,
    comment: "Satisfactory service but there's room for improvement.",
    status: "Published",
    avatar: "RJ"
  },
  {
    id: "REV-005",
    patientName: "Lisa Rodrigues",
    patientId: "PT-9876",
    caregiverName: "Sarah Johnson",
    date: new Date("2023-10-30"),
    rating: 5,
    comment: "Sarah is consistently excellent. Very caring and thorough.",
    status: "Published",
    avatar: "LR"
  },
  {
    id: "REV-006",
    patientName: "David Wilson",
    patientId: "PT-3344",
    caregiverName: "Michael Scott",
    date: new Date("2023-10-12"),
    rating: 2,
    comment: "Service was below expectations. Caregiver was late multiple times.",
    status: "Under Review",
    avatar: "DW"
  },
  {
    id: "REV-007",
    patientName: "Kate Williams",
    patientId: "PT-5432",
    caregiverName: "James Wilson",
    date: new Date("2023-11-08"),
    rating: 4,
    comment: "Reliable and professional service.",
    status: "Published",
    avatar: "KW"
  },
  {
    id: "REV-008",
    patientName: "Olivia Parker",
    patientId: "PT-5566",
    caregiverName: "Emma Lewis",
    date: new Date("2023-10-28"),
    rating: 5,
    comment: "Emma has been amazing. Very attentive to all needs.",
    status: "Published",
    avatar: "OP"
  }
];

const ReviewsTab: React.FC<ReviewsTabProps> = ({ branchId, branchName }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter reviews based on search, status and rating
  const filteredReviews = mockReviews.filter(review => {
    const matchesSearch = 
      review.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.caregiverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4", 
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Reviews Management</h2>
      <p className="text-gray-500 mb-6">View and manage client reviews and feedback.</p>
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reviews..."
            className="pl-10 pr-4 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">ID</TableHead>
              <TableHead className="min-w-[180px]">Patient</TableHead>
              <TableHead className="hidden md:table-cell">Caregiver</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="hidden lg:table-cell">Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedReviews.length > 0 ? (
              paginatedReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                        {review.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{review.patientName}</div>
                        <div className="text-xs text-gray-500">{review.patientId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {review.caregiverName}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(review.date, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-[300px] truncate">
                    {review.comment}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        review.status === "Published" ? "text-green-600 bg-green-50 border-green-200" :
                        review.status === "Under Review" ? "text-amber-600 bg-amber-50 border-amber-200" :
                        review.status === "Hidden" ? "text-gray-600 bg-gray-50 border-gray-200" :
                        "text-gray-600 bg-gray-50 border-gray-200"
                      )}
                    >
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ThumbsUp className="mr-2 h-4 w-4" /> Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ThumbsDown className="mr-2 h-4 w-4" /> Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No reviews found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {filteredReviews.length > 0 && (
        <div className="flex items-center justify-between px-2 mt-4">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredReviews.length)} of {filteredReviews.length} reviews
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className={cn(currentPage === totalPages && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Review Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <div className="text-sm font-medium">Average Rating</div>
                  <div className="text-sm font-medium">4.3/5</div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full rounded-full" style={{ width: "86%" }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = mockReviews.filter(r => r.rating === rating).length;
                  const percentage = (count / mockReviews.length) * 100;
                  
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <div className="flex w-16">
                        {Array(rating).fill(0).map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex-1">
                        <div 
                          className="bg-yellow-400 h-full rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 w-8 text-right">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Rated Caregivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from(new Set(mockReviews.map(r => r.caregiverName)))
                .map(name => {
                  const caregiversReviews = mockReviews.filter(r => r.caregiverName === name);
                  const averageRating = caregiversReviews.reduce((acc, r) => acc + r.rating, 0) / caregiversReviews.length;
                  
                  return { name, averageRating, reviewCount: caregiversReviews.length };
                })
                .sort((a, b) => b.averageRating - a.averageRating)
                .slice(0, 5)
                .map((caregiver, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{caregiver.name}</div>
                      <div className="text-xs text-gray-500">{caregiver.reviewCount} reviews</div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex mr-2">
                        {renderStars(Math.round(caregiver.averageRating))}
                      </div>
                      <div className="text-sm font-medium">{caregiver.averageRating.toFixed(1)}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewsTab;
