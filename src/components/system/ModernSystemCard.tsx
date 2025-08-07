import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface ModernSystemCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  stats: string;
  onClick: () => void;
  disabled?: boolean;
}

export const ModernSystemCard = ({
  title,
  description,
  icon: Icon,
  stats,
  onClick,
  disabled = false
}: ModernSystemCardProps) => {
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 border-border hover:border-primary/20 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>
        
        <Badge variant="secondary" className="text-xs font-medium">
          {stats}
        </Badge>
      </CardContent>
    </Card>
  );
};