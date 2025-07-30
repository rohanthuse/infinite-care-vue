import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Search, Calendar, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

interface EventActionsViewProps {
  immediateActionsTaken?: string;
  investigationRequired?: boolean;
  investigationAssignedTo?: string;
  expectedResolutionDate?: string;
  lessonsLearned?: string;
}

export function EventActionsView({ 
  immediateActionsTaken,
  investigationRequired,
  investigationAssignedTo,
  expectedResolutionDate,
  lessonsLearned
}: EventActionsViewProps) {
  const hasActionsData = immediateActionsTaken || investigationRequired || lessonsLearned;
  
  if (!hasActionsData) return null;

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <CheckCircle className="h-4 w-4" />
        Actions & Investigation
      </h4>
      
      <div className="space-y-4">
        {/* Immediate Actions */}
        {immediateActionsTaken && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Immediate Actions Taken</h5>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">
              {immediateActionsTaken}
            </div>
          </div>
        )}

        {/* Investigation Details */}
        {investigationRequired && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="h-4 w-4 text-orange-600" />
              <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                Investigation Required
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {investigationAssignedTo && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Assigned To:</span>
                  <span>{investigationAssignedTo}</span>
                </div>
              )}
              
              {expectedResolutionDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Expected Resolution:</span>
                  <span>{format(new Date(expectedResolutionDate), 'PPP')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lessons Learned */}
        {lessonsLearned && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-green-600" />
              <h5 className="font-medium text-green-900">Lessons Learned</h5>
            </div>
            <div className="text-sm text-green-800 whitespace-pre-wrap">
              {lessonsLearned}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}