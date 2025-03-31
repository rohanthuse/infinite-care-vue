
import React from "react";
import { format } from "date-fns";
import { Wrench, Calendar, CheckCircle2, AlertCircle, ShieldAlert, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Equipment {
  name: string;
  type: string;
  status: string;
  notes: string;
  lastInspection: Date;
}

interface EquipmentTabProps {
  equipment: Equipment[];
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({ equipment }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Use": return "bg-green-50 text-green-700 border-green-200";
      case "Available": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Maintenance": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Faulty": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getNextInspectionDate = (lastInspection: Date) => {
    const nextInspection = new Date(lastInspection);
    nextInspection.setMonth(nextInspection.getMonth() + 3); // Assuming inspections every 3 months
    return nextInspection;
  };

  const isInspectionSoon = (lastInspection: Date) => {
    const nextInspection = getNextInspectionDate(lastInspection);
    const today = new Date();
    const daysDiff = Math.ceil((nextInspection.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 14; // Warning if inspection is due within 14 days
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-lg">Equipment</CardTitle>
            </div>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Equipment</span>
            </Button>
          </div>
          <CardDescription>Medical equipment and assistive devices</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {equipment.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No equipment recorded</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {equipment.map((item, index) => (
                <div key={index} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                  <div className="bg-gradient-to-r from-slate-50 to-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-slate-100">
                        <Wrench className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getStatusBadge(item.status)}>
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                        <p className="text-sm">{item.notes}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Inspection Status</p>
                        <div className="flex items-center gap-2">
                          {isInspectionSoon(item.lastInspection) ? (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          <div>
                            <p className="text-sm">Last: {format(item.lastInspection, 'MMM dd, yyyy')}</p>
                            <p className="text-xs text-gray-500">
                              Next: {format(getNextInspectionDate(item.lastInspection), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-end">
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
