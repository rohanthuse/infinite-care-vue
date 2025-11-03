import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ServiceTypesDisplayProps {
  serviceCodes: string[];
  maxVisible?: number;
}

export const ServiceTypesDisplay = ({ 
  serviceCodes, 
  maxVisible = 2 
}: ServiceTypesDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // If no services or empty array
  if (!serviceCodes || serviceCodes.length === 0) {
    return <span className="text-sm text-muted-foreground">All Services</span>;
  }
  
  // If services fit within maxVisible, show all
  if (serviceCodes.length <= maxVisible) {
    return (
      <div className="flex flex-wrap gap-1">
        {serviceCodes.map(code => (
          <Badge key={code} variant="outline" className="text-xs">
            {code}
          </Badge>
        ))}
      </div>
    );
  }
  
  // Show first few + expandable "+X more"
  const visibleServices = serviceCodes.slice(0, maxVisible);
  const remainingCount = serviceCodes.length - maxVisible;
  
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Visible service badges */}
      {visibleServices.map(code => (
        <Badge key={code} variant="outline" className="text-xs">
          {code}
        </Badge>
      ))}
      
      {/* Popover for remaining services */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Badge 
            variant="secondary" 
            className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
            aria-label={`View ${remainingCount} more service types`}
          >
            +{remainingCount} more
          </Badge>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 max-h-96 overflow-y-auto" 
          align="start"
          side="bottom"
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">
                All Service Types ({serviceCodes.length})
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Complete list of services covered by this rate schedule
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {serviceCodes.map(code => (
                <Badge 
                  key={code} 
                  variant="outline" 
                  className="text-xs justify-center"
                >
                  {code}
                </Badge>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
