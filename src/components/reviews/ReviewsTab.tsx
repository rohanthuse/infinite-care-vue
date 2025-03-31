
import React from "react";
import { Button } from "@/components/ui/button";

export interface ReviewsTabProps {
  branchId?: string;
  branchName?: string;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ branchId, branchName }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Reviews Management</h2>
      <p className="text-gray-500 mb-6">View and manage client reviews and feedback.</p>
      
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Reviews functionality is coming soon</p>
          <Button>Request Early Access</Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewsTab;
