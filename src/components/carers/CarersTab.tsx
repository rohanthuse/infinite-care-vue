
import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Briefcase } from "lucide-react";
import RecruitmentSection from "./RecruitmentSection";
import { TeamManagementSection } from "./TeamManagementSection";

interface CarersTabProps {
  branchId?: string;
  branchName?: string;
}

export function CarersTab({ branchId, branchName }: CarersTabProps) {
  const [activeTab, setActiveTab] = useState("team");

  if (!branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">Branch ID is required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Carers Management</h2>
          <p className="text-gray-600">Manage your care team and recruitment</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Recruitment & Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <TeamManagementSection branchId={branchId} branchName={branchName} />
        </TabsContent>

        <TabsContent value="recruitment" className="mt-6">
          <RecruitmentSection branchId={branchId} branchName={branchName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
