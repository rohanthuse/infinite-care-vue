
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

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
        "rounded-lg border shadow-sm h-full cursor-pointer",
        borderColor
      )}
      onClick={onClick}
    >
      <div className={cn("p-5 flex flex-col h-full", bgColor)}>
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-full", bgColor)}>
            <Icon className={cn("h-7 w-7", color)} />
          </div>
          <div className={cn("text-3xl font-bold", color)}>{count}</div>
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationCard;
