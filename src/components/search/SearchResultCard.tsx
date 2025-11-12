import { User, Users, Calendar, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchResult } from "@/hooks/useBranchSearch";

interface SearchResultCardProps {
  result: SearchResult;
  onClick: () => void;
}

export function SearchResultCard({ result, onClick }: SearchResultCardProps) {
  const getIcon = () => {
    switch (result.type) {
      case 'client':
        return <User className="h-5 w-5 text-primary" />;
      case 'staff':
        return <Users className="h-5 w-5 text-primary" />;
      case 'booking':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'document':
        return <FileText className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusColor = () => {
    if (!result.status) return "secondary";
    
    const status = result.status.toLowerCase();
    if (status === 'active' || status === 'completed') return "default";
    if (status === 'inactive' || status === 'cancelled') return "secondary";
    if (status === 'scheduled' || status === 'pending') return "secondary";
    return "secondary";
  };

  return (
    <Card 
      className="p-4 hover:bg-accent/50 cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                {result.title}
              </h4>
              {result.subtitle && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {result.subtitle}
                </p>
              )}
            </div>
            {result.status && (
              <Badge variant={getStatusColor()} className="text-xs shrink-0">
                {result.status}
              </Badge>
            )}
          </div>
          {result.details && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {result.details}
            </p>
          )}
        </div>
        <Button 
          size="sm" 
          variant="ghost"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View
        </Button>
      </div>
    </Card>
  );
}
