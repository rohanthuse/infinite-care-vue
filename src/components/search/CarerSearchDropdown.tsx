import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  User,
  Calendar,
  CalendarDays,
  CalendarOff,
  Users,
  FileText,
  ClipboardList,
  AlertTriangle,
  Files,
  ScrollText,
  BookOpen,
  Clock,
  FileBarChart,
  MessageSquare,
  Wallet,
  GraduationCap,
  Newspaper,
  Loader2,
  LucideIcon,
} from "lucide-react";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CarerSearchDropdownProps {
  searchValue: string;
  onClose: () => void;
  onResultClick: () => void;
  anchorRef: React.RefObject<HTMLInputElement>;
  isMobile?: boolean;
}

interface ModuleShortcut {
  name: string;
  keywords: string[];
  path: string;
  icon: LucideIcon;
  category: string;
}

const carerModuleShortcuts: ModuleShortcut[] = [
  // Main
  { name: "Dashboard", keywords: ["dashboard", "home", "overview", "main"], path: "", icon: Home, category: "Main" },
  { name: "Profile", keywords: ["profile", "me", "account", "my", "settings"], path: "/profile", icon: User, category: "Main" },

  // Schedule & Appointments
  { name: "Booking Calendar", keywords: ["schedule", "calendar", "booking", "shift", "rota"], path: "/schedule", icon: Calendar, category: "Schedule" },
  { name: "Appointments", keywords: ["appointment", "visit", "meeting", "session"], path: "/appointments", icon: CalendarDays, category: "Schedule" },
  { name: "Leave", keywords: ["leave", "time off", "holiday", "vacation", "absence"], path: "/leave", icon: CalendarOff, category: "Schedule" },

  // Clients & Care
  { name: "Clients", keywords: ["client", "patient", "service user", "customer"], path: "/clients", icon: Users, category: "Care" },
  { name: "Care Plans", keywords: ["care plan", "careplan", "care", "plan", "support"], path: "/careplans", icon: FileText, category: "Care" },

  // Tasks & Work
  { name: "Tasks", keywords: ["task", "todo", "work", "job", "action"], path: "/tasks", icon: ClipboardList, category: "Tasks" },
  { name: "My Assignments", keywords: ["assignment", "assigned", "alert", "pending"], path: "/my-tasks", icon: AlertTriangle, category: "Tasks" },
  { name: "Events & Logs", keywords: ["event", "log", "history", "activity", "record"], path: "/events-logs", icon: Files, category: "Tasks" },

  // Documents
  { name: "My Agreements", keywords: ["agreement", "contract", "sign", "signature"], path: "/agreements", icon: ScrollText, category: "Documents" },
  { name: "Documents", keywords: ["document", "file", "upload", "download"], path: "/documents", icon: FileText, category: "Documents" },
  { name: "My Forms", keywords: ["form", "forms", "submission", "fill"], path: "/forms", icon: FileText, category: "Documents" },
  { name: "Library", keywords: ["library", "resource", "guide", "help", "reference"], path: "/library", icon: BookOpen, category: "Documents" },

  // Reports & Finance
  { name: "Service Reports", keywords: ["service report", "report", "summary"], path: "/service-reports", icon: FileBarChart, category: "Reports" },
  { name: "Reports", keywords: ["report", "analytics", "stats", "data"], path: "/reports", icon: FileBarChart, category: "Reports" },
  { name: "Payments", keywords: ["payment", "pay", "salary", "wage", "money", "finance"], path: "/payments", icon: Wallet, category: "Reports" },

  // Communication & Training
  { name: "Messages", keywords: ["message", "chat", "inbox", "communication", "mail"], path: "/messages", icon: MessageSquare, category: "Communication" },
  { name: "News", keywords: ["news", "update", "announcement", "bulletin"], path: "/news2", icon: Newspaper, category: "Communication" },
  { name: "Training", keywords: ["training", "course", "learn", "education", "skill"], path: "/training", icon: GraduationCap, category: "Communication" },
];

// Highlight matching text in results
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5 font-semibold">
        {part}
      </span>
    ) : (
      part
    )
  );
};

export const CarerSearchDropdown: React.FC<CarerSearchDropdownProps> = ({
  searchValue,
  onClose,
  onResultClick,
  anchorRef,
  isMobile = false,
}) => {
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Filter modules based on search value
  const filteredModules = carerModuleShortcuts.filter((module) => {
    const query = searchValue.toLowerCase().trim();
    if (!query) return false;

    // Check if name matches
    if (module.name.toLowerCase().includes(query)) return true;

    // Check if any keyword matches
    return module.keywords.some((keyword) => keyword.toLowerCase().includes(query));
  });

  // Simulate brief loading state for UX
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 150);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredModules.length]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose, anchorRef]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (filteredModules.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredModules.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredModules.length) % filteredModules.length);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredModules[selectedIndex]) {
            handleModuleClick(filteredModules[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredModules, selectedIndex, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleModuleClick = (module: ModuleShortcut) => {
    const fullPath = createCarerPath(module.path);
    console.log("[CarerSearchDropdown] Navigating to:", fullPath);
    navigate(fullPath);
    onResultClick();
  };

  // Group modules by category
  const groupedModules = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, ModuleShortcut[]>);

  // Calculate global index for keyboard navigation
  let globalIndex = 0;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        "bg-background border border-border rounded-lg shadow-lg z-[100] max-h-[400px] overflow-y-auto",
        isMobile ? "relative w-full" : "absolute top-full left-0 right-0 mt-2"
      )}
    >
      {/* Loading state */}
      {isSearching ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          <p className="text-sm">No modules found for "{searchValue}"</p>
          <p className="text-xs mt-1">Try searching for Dashboard, Clients, Schedule, etc.</p>
        </div>
      ) : (
        <div className="py-2">
          {Object.entries(groupedModules).map(([category, modules]) => (
            <div key={category}>
              {/* Category header */}
              <div className="px-3 py-1.5 flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {category}
                </Badge>
              </div>

              {/* Module items */}
              {modules.map((module) => {
                const currentGlobalIndex = globalIndex++;
                const isSelected = currentGlobalIndex === selectedIndex;
                const Icon = module.icon;

                return (
                  <button
                    key={module.path}
                    onClick={() => handleModuleClick(module)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      "hover:bg-accent hover:text-accent-foreground cursor-pointer",
                      isSelected && "bg-accent text-accent-foreground ring-2 ring-primary ring-inset"
                    )}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">
                        {highlightMatch(module.name, searchValue)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        /{module.path || "dashboard"}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-muted-foreground">↵ Enter</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Keyboard hint */}
          <div className="px-3 py-2 border-t border-border mt-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
