
import React from "react";
import { format } from "date-fns";
import { Wrench, Calendar, CheckCircle2, AlertCircle, ShieldAlert, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClientEquipment } from "@/hooks/useClientEquipment";

interface EquipmentTabProps {
  equipment: ClientEquipment[];
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({ equipment }) => {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "bg-green-50 text-green-700 border-green-200";
      case "inactive": return "bg-gray-50 text-gray-700 border-gray-200";
      case "maintenance": return "bg-amber-50 text-amber-700 border-amber-200";
      case "faulty": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getNextMaintenanceDate = (lastMaintenance?: string, schedule?: string) => {
    if (!lastMaintenance) return null;
    
    const lastDate = new Date(lastMaintenance);
    // Simple logic: add 3 months for regular maintenance
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + 3);
    return nextDate;
  };

  const isMaintenanceSoon = (equipment: ClientEquipment) => {
    if (equipment.next_maintenance_date) {
      const nextDate = new Date(equipment.next_maintenance_date);
      const today = new Date();
      const daysDiff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 14; // Warning if maintenance is due within 14 days
    }
    
    if (equipment.last_maintenance_date) {
      const nextDate = getNextMaintenanceDate(equipment.last_maintenance_date, equipment.maintenance_schedule);
      if (nextDate) {
        const today = new Date();
        const daysDiff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 14;
      }
    }
    
    return false;
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
              {equipment.map((item) => (
                <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-all">
                  <div className="bg-gradient-to-r from-slate-50 to-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 rounded-full bg-slate-100">
                        <Wrench className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{item.equipment_name}</h3>
                        <p className="text-sm text-gray-500">{item.equipment_type}</p>
                        {item.manufacturer && (
                          <p className="text-xs text-gray-400">{item.manufacturer}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMaintenanceSoon(item) && (
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                      )}
                      <Badge variant="outline" className={getStatusBadge(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Equipment Details */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Equipment Details</h4>
                        {item.model_number && (
                          <p className="text-xs"><span className="font-medium">Model:</span> {item.model_number}</p>
                        )}
                        {item.serial_number && (
                          <p className="text-xs"><span className="font-medium">Serial:</span> {item.serial_number}</p>
                        )}
                        {item.location && (
                          <p className="text-xs"><span className="font-medium">Location:</span> {item.location}</p>
                        )}
                        {item.installation_date && (
                          <p className="text-xs">
                            <span className="font-medium">Installed:</span> {format(new Date(item.installation_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>

                      {/* Maintenance Information */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Maintenance</h4>
                        {item.last_maintenance_date ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-xs">Last: {format(new Date(item.last_maintenance_date), 'MMM dd, yyyy')}</p>
                              {item.next_maintenance_date && (
                                <p className="text-xs text-gray-500">
                                  Next: {format(new Date(item.next_maintenance_date), 'MMM dd, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            <p className="text-xs text-amber-600">No maintenance records</p>
                          </div>
                        )}
                        {item.maintenance_schedule && (
                          <p className="text-xs text-gray-500">Schedule: {item.maintenance_schedule}</p>
                        )}
                      </div>
                    </div>

                    {item.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Notes</h4>
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button variant="outline" size="sm">Schedule Maintenance</Button>
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
