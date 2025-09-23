import React from "react";
import { User, MessageCircle, FileText, Calendar, CreditCard, ClipboardList, FileBarChart2, Heart, DollarSign, PauseCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClientSideTabNavProps {
  activeTab: string;
  onChange: (value: string) => void;
}

const navItems = [
  {
    id: "overview",
    label: "Overview",
    icon: BarChart3,
  },
  {
    id: "personal",
    label: "Personal Info",
    icon: User,
  },
  {
    id: "notes",
    label: "Notes",
    icon: FileText,
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: MessageCircle,
  },
  {
    id: "service-reports",
    label: "Service Reports",
    icon: FileBarChart2,
  },
  {
    id: "medications",
    label: "Medications",
    icon: ClipboardList,
  },
  {
    id: "visits",
    label: "Visit Records",
    icon: Calendar,
  },
  {
    id: "activities",
    label: "Activities",
    icon: Heart,
  },
  {
    id: "suspend",
    label: "Suspend",
    icon: PauseCircle,
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: Calendar,
  },
  {
    id: "billing",
    label: "Billing",
    icon: CreditCard,
  },
  {
    id: "careplans",
    label: "Care Plans",
    icon: ClipboardList,
  },
  {
    id: "eventslogs",
    label: "Events & Logs",
    icon: FileBarChart2,
  },
  {
    id: "rates",
    label: "Rates",
    icon: DollarSign,
  },
  {
    id: "hobbies",
    label: "Hobbies",
    icon: Heart,
  },
];

export const ClientSideTabNav: React.FC<ClientSideTabNavProps> = ({ activeTab, onChange }) => {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border flex-shrink-0">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Client Details
        </h3>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-10",
                  activeTab === item.id && "bg-primary/10 text-primary font-medium"
                )}
                onClick={() => onChange(item.id)}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};