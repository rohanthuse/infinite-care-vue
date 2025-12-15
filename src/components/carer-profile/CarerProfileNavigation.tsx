import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TabItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface TabGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  tabs: TabItem[];
}

interface CarerProfileNavigationProps {
  tabGroups: TabGroup[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function CarerProfileNavigation({
  tabGroups,
  activeTab,
  onTabChange,
}: CarerProfileNavigationProps) {
  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand the group containing the active tab
  useEffect(() => {
    const activeGroup = tabGroups.find(group => 
      group.tabs.some(tab => tab.value === activeTab)
    );
    if (activeGroup) {
      setExpandedGroups(prev => ({
        ...prev,
        [activeGroup.id]: true
      }));
    }
  }, [activeTab, tabGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const isGroupActive = (group: TabGroup) => {
    return group.tabs.some(tab => tab.value === activeTab);
  };

  return (
    <div className="p-4 space-y-1">
      {tabGroups.map((group) => {
        const GroupIcon = group.icon;
        const isExpanded = expandedGroups[group.id] ?? false;
        const groupActive = isGroupActive(group);

        return (
          <Collapsible
            key={group.id}
            open={isExpanded}
            onOpenChange={() => toggleGroup(group.id)}
          >
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  "hover:bg-muted",
                  groupActive && "bg-primary/10 text-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <GroupIcon className="h-4 w-4 flex-shrink-0" />
                  <span>{group.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {group.tabs.length}
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
              <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-muted pl-2">
                {group.tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.value;

                  return (
                    <button
                      key={tab.value}
                      onClick={() => onTabChange(tab.value)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                        isActive
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <TabIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate text-left">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
