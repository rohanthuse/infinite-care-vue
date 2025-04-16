
import React from "react";
import { News2Dashboard } from "./news2/News2Dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

interface ClinicalReportsProps {
  branchId: string;
  branchName: string;
}

export function ClinicalReports({ branchId, branchName }: ClinicalReportsProps) {
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

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-4">NEWS2 Dashboard</h2>
        <News2Dashboard branchId={branchId} branchName={branchName} />
      </div>
    </div>
  );
}
