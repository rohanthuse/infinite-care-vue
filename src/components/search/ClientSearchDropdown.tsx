import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, Calendar, ClipboardList, FileText, ScrollText, BookOpen, 
  AlertTriangle, Star, BarChart, Activity, CreditCard, File, 
  Bell, MessageCircle, User, HelpCircle, LucideIcon
} from "lucide-react";
import { useClientNavigation } from "@/hooks/useClientNavigation";

interface ModuleShortcut {
  name: string;
  keywords: string[];
  path: string;
  icon: LucideIcon;
  category: string;
}

const clientModuleShortcuts: ModuleShortcut[] = [
  // Main
  { name: "Overview", keywords: ["overview", "dashboard", "home", "main"], path: "", icon: Home, category: "Main" },
  { name: "My Schedule", keywords: ["schedule", "calendar", "shift", "rota", "booking"], path: "/schedule", icon: Calendar, category: "Main" },
  { name: "Appointments", keywords: ["appointment", "visit", "booking", "meeting"], path: "/appointments", icon: Calendar, category: "Main" },
  { name: "Tasks", keywords: ["task", "todo", "action", "job"], path: "/tasks", icon: ClipboardList, category: "Main" },
  { name: "Care Plans", keywords: ["care plan", "careplan", "plan", "support"], path: "/care-plans", icon: FileText, category: "Main" },

  // Services
  { name: "My Forms", keywords: ["form", "forms", "submission", "fill"], path: "/forms", icon: FileText, category: "Services" },
  { name: "My Agreements", keywords: ["agreement", "contract", "sign", "signature"], path: "/agreements", icon: ScrollText, category: "Services" },
  { name: "Library", keywords: ["library", "resource", "guide", "help"], path: "/library", icon: BookOpen, category: "Services" },
  { name: "Events & Logs", keywords: ["event", "log", "history", "activity"], path: "/events-logs", icon: AlertTriangle, category: "Services" },
  { name: "Feedbacks", keywords: ["feedback", "review", "rating", "star"], path: "/reviews", icon: Star, category: "Services" },
  { name: "Service Reports", keywords: ["service report", "report", "summary"], path: "/service-reports", icon: BarChart, category: "Services" },
  { name: "Health Monitoring", keywords: ["health", "monitoring", "vital", "check"], path: "/health-monitoring", icon: Activity, category: "Services" },

  // Personal
  { name: "Payments", keywords: ["payment", "pay", "invoice", "billing", "money"], path: "/payments", icon: CreditCard, category: "Personal" },
  { name: "Documents", keywords: ["document", "file", "upload", "download"], path: "/documents", icon: File, category: "Personal" },
  { name: "Notifications", keywords: ["notification", "alert", "bell", "notify"], path: "/notifications", icon: Bell, category: "Personal" },
  { name: "Messages", keywords: ["message", "chat", "inbox", "communication"], path: "/messages", icon: MessageCircle, category: "Personal" },
  { name: "Profile", keywords: ["profile", "me", "account", "settings"], path: "/profile", icon: User, category: "Personal" },
  { name: "Support", keywords: ["support", "help", "contact", "assistance"], path: "/support", icon: HelpCircle, category: "Personal" },
];

interface ClientSearchDropdownProps {
  searchValue: string;
  onClose: () => void;
  onResultClick: () => void;
  anchorRef: React.RefObject<HTMLInputElement>;
}

export const ClientSearchDropdown: React.FC<ClientSearchDropdownProps> = ({
  searchValue,
  onClose,
  onResultClick,
  anchorRef,
}) => {
  const navigate = useNavigate();
  const { createClientPath } = useClientNavigation();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const query = searchValue.toLowerCase().trim();

  // Filter modules based on search query
  const filteredModules = clientModuleShortcuts.filter((module) => {
    const nameMatch = module.name.toLowerCase().includes(query);
    const keywordMatch = module.keywords.some((kw) => kw.includes(query));
    return nameMatch || keywordMatch;
  });

  // Group by category
  const groupedResults = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, ModuleShortcut[]>);

  const allResults = filteredModules;

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, anchorRef]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === "Enter" && allResults[selectedIndex]) {
        event.preventDefault();
        handleModuleClick(allResults[selectedIndex]);
      } else if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, allResults, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchValue]);

  const handleModuleClick = (module: ModuleShortcut) => {
    const fullPath = createClientPath(module.path);
    navigate(fullPath);
    onResultClick();
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "Main":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300";
      case "Services":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      case "Personal":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (allResults.length === 0) {
    return (
      <div
        ref={dropdownRef}
        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card border border-border rounded-lg shadow-lg z-50 p-4"
      >
        <p className="text-sm text-muted-foreground text-center">
          No results found for "{searchValue}"
        </p>
      </div>
    );
  }

  let flatIndex = -1;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
    >
      {Object.entries(groupedResults).map(([category, modules]) => (
        <div key={category}>
          <div className="px-3 py-2 border-b border-border bg-gray-50 dark:bg-muted/50 sticky top-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryBadgeColor(category)}`}>
              {category}
            </span>
          </div>
          {modules.map((module) => {
            flatIndex++;
            const currentIndex = flatIndex;
            const Icon = module.icon;
            return (
              <button
                key={module.path}
                onClick={() => handleModuleClick(module)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  currentIndex === selectedIndex
                    ? "bg-indigo-50 dark:bg-indigo-900/30"
                    : "hover:bg-gray-50 dark:hover:bg-muted/50"
                }`}
              >
                <div className={`p-1.5 rounded-md ${
                  currentIndex === selectedIndex
                    ? "bg-indigo-100 dark:bg-indigo-800"
                    : "bg-gray-100 dark:bg-muted"
                }`}>
                  <Icon className={`h-4 w-4 ${
                    currentIndex === selectedIndex
                      ? "text-indigo-600 dark:text-indigo-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                    {highlightMatch(module.name, query)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
