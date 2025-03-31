import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Routes, Route } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { motion } from "framer-motion";
import { 
  Calendar, Users, BarChart4, Clock, FileText, AlertCircle, Search, Bell, ChevronRight, Home, ArrowUpRight, Phone, Mail, MapPin, Plus, Clock7, RefreshCw, Download, Filter, ClipboardCheck, ThumbsUp, ArrowUp, ArrowDown, ChevronDown, Edit, Eye, HelpCircle, CalendarIcon, ChevronLeft
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TabNavigation } from "@/components/TabNavigation";
import { BookingsTab } from "@/components/bookings/BookingsTab";
import { CarersTab } from "@/components/carers/CarersTab";
import ReviewsTab from "@/components/reviews/ReviewsTab";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/NewBookingDialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { CommunicationsTab } from "@/components/communications/CommunicationsTab";
import { ListChecks, Book } from "lucide-react";
import KeyParametersContent from "@/components/keyparameters/KeyParametersContent";
import WorkflowContent from "@/components/workflow/WorkflowContent";
import { MedicationTab } from "@/components/medication/MedicationTab";
import { CareTab } from "@/components/care/CareTab";

[Previous content continues exactly as before until the handleTabChange function, which is replaced with:]

const handleTabChange = (newTab: string) => {
  setActiveTab(newTab);
  
  if (newTab === "workflow") {
    handleWorkflowNavigation("workflow");
  } else if (newTab === "key-parameters") {
    handleWorkflowNavigation("key-parameters");
  } else if (newTab === "task-matrix") {
    handleWorkflowNavigation("task-matrix");
  } else if (newTab === "training") {
    handleWorkflowNavigation("training");
  } else if (newTab === "forms") {
    handleWorkflowNavigation("forms");
  } else if (newTab === "notifications") {
    handleWorkflowNavigation("notifications");
  }
};

[Previous content continues exactly as before until the TabNavigation component, which is replaced with:]

<TabNavigation 
  activeTab={activeTab} 
  onChange={(tab) => {
    setActiveTab(tab);
    
    if (tab === "dashboard") {
      navigate(`/branch-dashboard/${id}/${branchName}`);
    } else if (tab === "key-parameters") {
      navigate(`/branch-dashboard/${id}/${branchName}/key-parameters`);
    } else if (tab === "workflow") {
      navigate(`/branch-dashboard/${id}/${branchName}/workflow`);
    } else if (tab === "task-matrix") {
      navigate(`/branch-dashboard/${id}/${branchName}/task-matrix`);
    } else if (tab === "training") {
      navigate(`/branch-dashboard/${id}/${branchName}/training`);
    } else if (tab === "forms") {
      navigate(`/branch-dashboard/${id}/${branchName}/forms`);
    } else if (tab === "notifications") {
      navigate(`/branch-dashboard/${id}/${branchName}/notifications`);
    } else {
      navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
    }
  }}
/>

[Rest of the file continues exactly as before]
