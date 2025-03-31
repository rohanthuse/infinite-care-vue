
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NotificationCardProps {
  title: string;
  count: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description?: string;
  onClick?: () => void;
}

const NotificationCard = ({
  title,
  count,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  description,
  onClick,
}: NotificationCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border shadow-sm overflow-hidden cursor-pointer",
        borderColor
      )}
      onClick={onClick}
    >
      <div className={cn("p-5", bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", bgColor)}>
              <Icon className={cn("h-6 w-6", color)} />
            </div>
            <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          </div>
          <div className={cn("text-2xl font-bold", color)}>{count}</div>
        </div>
        {description && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            className={cn("text-sm font-medium hover:bg-opacity-10", color)}
            onClick={(e) => {
              e.stopPropagation(); // Stop propagation to prevent double navigation
              if (onClick) onClick();
            }}
          >
            View All
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationCard;
