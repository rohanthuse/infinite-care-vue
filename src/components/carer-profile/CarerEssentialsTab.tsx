import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, Clock, FileText, Shield, Award } from "lucide-react";

interface CarerEssentialsTabProps {
  carerId: string;
}

export const CarerEssentialsTab: React.FC<CarerEssentialsTabProps> = ({ carerId }) => {
  const essentialItems = [
    { id: 1, name: 'DBS Check', status: 'complete', expires: '2024-12-15', category: 'Background' },
    { id: 2, name: 'Right to Work', status: 'complete', expires: '2025-06-30', category: 'Legal' },
    { id: 3, name: 'First Aid Certificate', status: 'expiring', expires: '2024-02-28', category: 'Training' },
    { id: 4, name: 'Fire Safety Training', status: 'complete', expires: '2024-08-15', category: 'Training' },
    { id: 5, name: 'Safeguarding Certificate', status: 'pending', expires: null, category: 'Training' },
    { id: 6, name: 'Manual Handling', status: 'complete', expires: '2024-09-20', category: 'Training' },
    { id: 7, name: 'Health Declaration', status: 'complete', expires: '2024-07-10', category: 'Health' },
    { id: 8, name: 'References', status: 'complete', expires: null, category: 'Background' },
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'complete':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' };
      case 'expiring':
        return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' };
      case 'pending':
        return { icon: Clock, color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800' };
      default:
        return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-800' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Background':
        return Shield;
      case 'Legal':
        return FileText;
      case 'Training':
        return Award;
      case 'Health':
        return CheckCircle;
      default:
        return FileText;
    }
  };

  const completedCount = essentialItems.filter(item => item.status === 'complete').length;
  const completionPercentage = (completedCount / essentialItems.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Essentials Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Completion</span>
              <span>{completedCount}/{essentialItems.length} Complete</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>

          <div className="grid gap-4">
            {essentialItems.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              const CategoryIcon = getCategoryIcon(item.category);
              const StatusIcon = statusInfo.icon;

              return (
                <div key={item.id} className={`p-4 rounded-lg border ${statusInfo.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full bg-white flex items-center justify-center`}>
                        <CategoryIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      </div>
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                        {item.expires && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {new Date(item.expires).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      <Badge className={statusInfo.badge}>
                        {item.status === 'complete' && 'Complete'}
                        {item.status === 'expiring' && 'Expiring Soon'}
                        {item.status === 'pending' && 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Action Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {essentialItems
              .filter(item => item.status === 'pending' || item.status === 'expiring')
              .map((item) => {
                const statusInfo = getStatusInfo(item.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.status === 'expiring' ? `Expires ${new Date(item.expires!).toLocaleDateString()}` : 'Awaiting completion'}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusInfo.badge}>
                      {item.status === 'expiring' ? 'Renew' : 'Complete'}
                    </Badge>
                  </div>
                );
              })}
            
            {essentialItems.filter(item => item.status === 'pending' || item.status === 'expiring').length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>All essentials are up to date!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};