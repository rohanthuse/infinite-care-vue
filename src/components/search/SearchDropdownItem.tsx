import { LucideIcon, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchDropdownItemProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  onClick: () => void;
  isSelected?: boolean;
  type: 'module' | 'client' | 'staff' | 'booking' | 'document';
}

export function SearchDropdownItem({
  icon: Icon,
  title,
  subtitle,
  badge,
  onClick,
  isSelected,
  type
}: SearchDropdownItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[SearchDropdownItem] clicked:', { title, type });
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left",
        "hover:bg-accent hover:text-accent-foreground cursor-pointer",
        "focus:bg-accent focus:outline-none",
        isSelected && "bg-accent text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{title}</span>
          {badge && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {type === 'module' && (
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}
