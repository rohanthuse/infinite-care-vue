

import React from 'react';
import { Star } from 'lucide-react';
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
    <div className="py-3 px-3 border-b last:border-0 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-transparent dark:hover:from-amber-950/30 rounded-lg transition-all duration-200 border-l-2 border-l-amber-400">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-xs md:text-sm font-semibold text-foreground">{client}</div>
          <div className="text-xs text-muted-foreground">{staff}</div>
        </div>
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">{date}</div>
      </div>
      <div className="flex items-start gap-2">
        <div className="flex items-center bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50 rounded-full px-2 py-1 gap-0.5 shadow-sm">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <Star 
                key={i} 
                className={`h-3.5 w-3.5 ${i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'}`} 
              />
            ))}
        </div>
        <p className="text-xs md:text-sm text-muted-foreground flex-1 line-clamp-2">{comment}</p>
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
