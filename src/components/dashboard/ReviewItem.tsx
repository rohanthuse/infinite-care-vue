
import React from 'react';
import { ThumbsUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const ReviewItem = ({
  client,
  staff,
  date,
  rating,
  comment,
}: {
  client: string;
  staff: string;
  date: string;
  rating: number;
  comment: string;
}) => {
  return (
    <div className="py-2 border-b last:border-0">
      <div className="flex justify-between">
        <div>
          <div className="text-xs md:text-sm font-medium">{client}</div>
          <div className="text-xs text-gray-500">for {staff}</div>
        </div>
        <div className="text-xs text-gray-500">{date}</div>
      </div>
      <div className="flex items-center mt-1">
        <div className="flex">
          {Array(rating)
            .fill(0)
            .map((_, i) => (
              <ThumbsUp key={i} className="h-3 w-3 text-yellow-500" />
            ))}
        </div>
        <p className="ml-2 text-xs md:text-sm text-gray-700">{comment}</p>
      </div>
    </div>
  );
};

export const ReviewItemSkeleton = () => (
  <div className="py-2 border-b last:border-0">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
      <Skeleton className="h-3 w-20" />
    </div>
    <div className="flex items-center mt-2">
      <Skeleton className="h-4 w-24" />
    </div>
    <div className="mt-1">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3 mt-1" />
    </div>
  </div>
);
