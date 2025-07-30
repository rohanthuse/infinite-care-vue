import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Bell, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface EventComplianceViewProps {
  familyNotified?: boolean;
  familyNotificationDate?: string;
  familyNotificationMethod?: string;
  gpNotified?: boolean;
  gpNotificationDate?: string;
  insuranceNotified?: boolean;
  insuranceNotificationDate?: string;
  externalReportingRequired?: boolean;
  externalReportingDetails?: string;
}

export function EventComplianceView({ 
  familyNotified,
  familyNotificationDate,
  familyNotificationMethod,
  gpNotified,
  gpNotificationDate,
  insuranceNotified,
  insuranceNotificationDate,
  externalReportingRequired,
  externalReportingDetails
}: EventComplianceViewProps) {
  const hasComplianceData = familyNotified !== undefined || gpNotified !== undefined || 
                           insuranceNotified !== undefined || externalReportingRequired !== undefined;
  
  if (!hasComplianceData) return null;

  const NotificationItem = ({ 
    label, 
    notified, 
    date, 
    method 
  }: { 
    label: string; 
    notified?: boolean; 
    date?: string; 
    method?: string; 
  }) => (
    <div className="flex items-start gap-3 p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        {notified ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        <span className="font-medium text-sm">{label}</span>
      </div>
      <div className="flex-1">
        <Badge variant={notified ? "secondary" : "destructive"} className="text-xs">
          {notified ? "Notified" : "Not Notified"}
        </Badge>
        {notified && date && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-600">
            <Calendar className="h-3 w-3" />
            {format(new Date(date), 'PPP')}
          </div>
        )}
        {method && (
          <div className="text-xs text-gray-600 mt-1">
            Method: {method}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <Bell className="h-4 w-4" />
        Notifications & Compliance
      </h4>
      
      <div className="space-y-3">
        {/* Family Notification */}
        {familyNotified !== undefined && (
          <NotificationItem
            label="Family"
            notified={familyNotified}
            date={familyNotificationDate}
            method={familyNotificationMethod}
          />
        )}

        {/* GP Notification */}
        {gpNotified !== undefined && (
          <NotificationItem
            label="GP/Doctor"
            notified={gpNotified}
            date={gpNotificationDate}
          />
        )}

        {/* Insurance Notification */}
        {insuranceNotified !== undefined && (
          <NotificationItem
            label="Insurance"
            notified={insuranceNotified}
            date={insuranceNotificationDate}
          />
        )}

        {/* External Reporting */}
        {externalReportingRequired !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">External Reporting</span>
              <Badge variant={externalReportingRequired ? "destructive" : "secondary"}>
                {externalReportingRequired ? "Required" : "Not Required"}
              </Badge>
            </div>
            {externalReportingRequired && externalReportingDetails && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                <div className="font-medium text-red-900 mb-1">Reporting Details:</div>
                <div className="text-red-800">{externalReportingDetails}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}