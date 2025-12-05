import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeroProps {
  badge?: string;
  badgeIcon?: LucideIcon;
  title: string;
  highlightedText?: string;
  description: string;
  className?: string;
}

const PageHero = ({ 
  badge, 
  badgeIcon: BadgeIcon, 
  title, 
  highlightedText,
  description, 
  className 
}: PageHeroProps) => {
  return (
    <div className={cn("text-center mb-16 animate-fade-in", className)}>
      {badge && (
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-6">
          {BadgeIcon && <BadgeIcon className="h-4 w-4" />}
          {badge}
        </div>
      )}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
        {title}
        {highlightedText && (
          <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            {" "}{highlightedText}
          </span>
        )}
      </h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default PageHero;