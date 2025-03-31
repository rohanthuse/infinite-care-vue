
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Star, Download, Filter, Plus, ThumbsUp, User, Calendar, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ReviewsTabProps {
  branchId: string;
  branchName: string;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ branchId, branchName }) => {
  // Sample review data
  const reviews = [
    {
      id: 1,
      clientName: "John Smith",
      carerName: "Sarah Johnson",
      rating: 5,
      comment: "Excellent care provided. Very attentive and professional.",
      date: "2023-06-15",
      status: "Published"
    },
    {
      id: 2,
      clientName: "Emma Williams",
      carerName: "Michael Brown",
      rating: 4,
      comment: "Good service overall. Would recommend.",
      date: "2023-06-10",
      status: "Published"
    },
    {
      id: 3,
      clientName: "Robert Davis",
      carerName: "Jessica Wilson",
      rating: 3,
      comment: "Satisfactory service but room for improvement in communication.",
      date: "2023-06-05",
      status: "Under Review"
    },
    {
      id: 4,
      clientName: "Patricia Miller",
      carerName: "David Taylor",
      rating: 5,
      comment: "Exceptional care and support. Very happy with the service.",
      date: "2023-05-28",
      status: "Published"
    },
    {
      id: 5,
      clientName: "Thomas Anderson",
      carerName: "Jennifer Martinez",
      rating: 2,
      comment: "Service was below expectations. Carer was often late.",
      date: "2023-05-20",
      status: "Under Review"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Client Reviews for {branchName}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Request Review
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Overall Rating</CardTitle>
            <CardDescription>Branch: {branchId}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-yellow-500">4.2</div>
              <div className="flex ml-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <Star className="h-5 w-5 text-gray-300" />
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-1">Based on 27 reviews</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">5 Star Reviews</CardTitle>
            <CardDescription>Excellent feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-2" />
                <span className="text-sm font-medium">5 stars</span>
              </div>
              <div className="flex items-center">
                <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="text-sm font-medium">65%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Comments</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="flex items-center text-sm text-green-600">
              <span className="mr-1">↑</span>
              <span>33% from last week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Response Rate</CardTitle>
            <CardDescription>Staff engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <div className="flex items-center text-sm text-green-600">
              <span className="mr-1">↑</span>
              <span>5% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>Monitor and manage client feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Carer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="font-medium">{review.clientName}</TableCell>
                  <TableCell>{review.carerName}</TableCell>
                  <TableCell>
                    <div className="flex">
                      {Array(review.rating).fill(0).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      {Array(5 - review.rating).fill(0).map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gray-300" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                  <TableCell>{review.date}</TableCell>
                  <TableCell>
                    <Badge className={review.status === "Published" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                      {review.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Rated Carers</CardTitle>
            <CardDescription>Highest client satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Sarah Johnson</div>
                      <div className="text-sm text-gray-500">12 recent reviews</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-2 text-sm font-medium">4.9</div>
                    <div className="flex">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Review Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 text-green-500 mr-2" />
                  <span>Positive Reviews</span>
                </div>
                <div className="font-medium">78%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  <span>Average Response Time</span>
                </div>
                <div className="font-medium">1.3 days</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 text-purple-500 mr-2" />
                  <span>Total Comments</span>
                </div>
                <div className="font-medium">142</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewsTab;
