
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { News2Dashboard } from "./news2/News2Dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion, PlusCircle } from "lucide-react";

interface ClinicalReportsProps {
  branchId: string;
  branchName: string;
}

export function ClinicalReports({ branchId, branchName }: ClinicalReportsProps) {
  const [activeTab, setActiveTab] = useState("news2");

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h3 className="text-lg font-medium">
          Clinical Reports for {branchName}
        </h3>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="h-9">
            <FileQuestion className="h-4 w-4 mr-2" />
            Help Guide
          </Button>
        </div>
      </div>

      <Tabs defaultValue="news2" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="news2">NEWS2 Dashboard</TabsTrigger>
          <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="trends">Clinical Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="news2" className="mt-4">
          <News2Dashboard branchId={branchId} branchName={branchName} />
        </TabsContent>
        
        <TabsContent value="vitals" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center h-60 text-center p-6">
                <FileQuestion className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Vital Signs Reporting</h3>
                <p className="text-gray-500 mb-4">
                  Vital signs reporting will be available in a future update.
                </p>
                <Button variant="outline" disabled>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="medications" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center h-60 text-center p-6">
                <FileQuestion className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Medications Reporting</h3>
                <p className="text-gray-500 mb-4">
                  Medications reporting will be available in a future update.
                </p>
                <Button variant="outline" disabled>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center h-60 text-center p-6">
                <FileQuestion className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Clinical Trends Analysis</h3>
                <p className="text-gray-500 mb-4">
                  Clinical trends analysis will be available in a future update.
                </p>
                <Button variant="outline" disabled>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
