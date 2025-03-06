
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, MessageCircleReply, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  status: 'pending' | 'confirmed' | 'deleted';
}

// Mock data - replace with actual data fetching logic
const mockReviews: Review[] = [
  {
    id: '1',
    author: 'John Doe',
    rating: 4,
    content: 'Great service and professional staff!',
    date: '2024-03-15',
    status: 'pending',
  },
  {
    id: '2',
    author: 'Jane Smith',
    rating: 5,
    content: 'Excellent care provided. Highly recommend!',
    date: '2024-03-14',
    status: 'confirmed',
  },
];

const ReviewsTab = () => {
  const { toast } = useToast();

  const handleConfirmReview = (reviewId: string) => {
    toast({
      title: "Review Confirmed",
      description: "The review has been approved and published.",
    });
  };

  const handleReplyToReview = (reviewId: string) => {
    toast({
      title: "Reply to Review",
      description: "Reply feature coming soon.",
    });
  };

  const handleDeleteReview = (reviewId: string) => {
    toast({
      title: "Review Deleted",
      description: "The review has been removed.",
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reviews Management</h2>
        <p className="text-gray-500">Manage and moderate customer reviews</p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockReviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.author}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <span key={index} className="text-yellow-400">★</span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-md">{review.content}</TableCell>
                <TableCell>{new Date(review.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${review.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      review.status === 'deleted' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {review.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleConfirmReview(review.id)}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleReplyToReview(review.id)}
                      className="h-8 w-8"
                    >
                      <MessageCircleReply className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteReview(review.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ReviewsTab;
