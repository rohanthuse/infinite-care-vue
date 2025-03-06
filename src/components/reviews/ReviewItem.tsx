
import React from 'react';
import { Star } from 'lucide-react';

interface ReviewItemProps {
  client: string;
  staff: string;
  date: string;
  rating: number;
  comment: string;
}

export const ReviewItem = ({ client, staff, date, rating, comment }: ReviewItemProps) => {
  return (
    <div className="p-2.5 border-b border-gray-100 last:border-0">
      <div className="flex justify-between items-start mb-1">
        <div>
          <div className="text-sm font-medium">{client}</div>
          <div className="text-xs text-gray-500">{staff}</div>
        </div>
        <div className="text-xs text-gray-500">{date}</div>
      </div>
      <div className="flex items-center mb-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3.5 w-3.5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      <div className="text-xs text-gray-600">{comment}</div>
    </div>
  );
};

export default ReviewItem;
