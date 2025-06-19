
import React from "react";
import { format } from "date-fns";
import { Wrench, Plus, Calendar, MapPin, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientEquipment } from "@/hooks/useClientEquipment";

interface EquipmentTabProps {
  clientId: string;
  equipment: ClientEquipment[];
  onAddEquipment?: () => void;
}

export const EquipmentTab: React.FC<EquipmentTabProps> = ({
  clientId,
  equipment,
  onAddEquipment,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Equipment</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={onAddEquipment}>
              <Plus className="h-4 w-4" />
              <span>Add Equipment</span>
            </Button>
          </div>
          <CardDescription>Medical and assistive equipment</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {equipment.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No equipment registered</p>
              {onAddEquipment && (
                <Button variant="outline" className="mt-3" onClick={onAddEquipment}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Equipment
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {equipment.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{item.equipment_name}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Type:</span> {item.equipment_type}
                      </div>
                      {item.manufacturer && (
                        <div>
                          <span className="font-medium">Manufacturer:</span> {item.manufacturer}
                        </div>
                      )}
                      {item.model_number && (
                        <div>
                          <span className="font-medium">Model:</span> {item.model_number}
                        </div>
                      )}
                      {item.serial_number && (
                        <div>
                          <span className="font-medium">Serial:</span> {item.serial_number}
                        </div>
                      )}
                    </div>
                    {item.location && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>Location: {item.location}</span>
                      </div>
                    )}
                    {item.installation_date && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Installed: {format(new Date(item.installation_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {item.next_maintenance_date && (
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Next maintenance: {format(new Date(item.next_maintenance_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-sm text-gray-600">{item.notes}</p>
                    )}
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
