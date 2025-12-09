import React from 'react';
import { useClientServiceReports } from '@/hooks/useServiceReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  FileText,
  Eye,
  List
} from 'lucide-react';
import { format } from 'date-fns';

interface RecentReportsAdminProps {
  branchId: string;
}

// Renamed from PendingReportsAdmin to RecentReportsAdmin since approval is removed
export function PendingReportsAdmin({ branchId }: RecentReportsAdminProps) {
  // This component is no longer needed for approval workflow
  // Now just shows a message that all reports are auto-approved
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Service Reports
          </h3>
          <p className="text-sm text-muted-foreground">
            All service reports are automatically approved and visible to clients
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium">Approval Workflow Removed</p>
            <p className="text-sm mt-1">
              Service reports are now automatically approved when created. 
              View reports from the client details page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
