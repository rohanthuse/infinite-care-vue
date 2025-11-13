import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EQUIPMENT_OPTIONS, HANDLING_FACTORS } from '@/constants/equipment';

interface EquipmentSectionProps {
  equipment: any[];
}

export function EquipmentSection({ equipment }: EquipmentSectionProps) {
  if (!equipment || equipment.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Equipment & Aids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No equipment recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Equipment & Aids ({equipment.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {equipment.map((item, idx) => {
          // Get equipment name from either new or legacy format
          const equipmentName = item.equipmentUsed 
            ? EQUIPMENT_OPTIONS.find(opt => opt.value === item.equipmentUsed)?.label || item.equipmentUsed
            : (item.name || item.equipment_name || item.type || 'Unknown Equipment');
          
          // Get handling factors labels
          const handlingFactorLabels = item.handlingFactors?.map((factor: string) => 
            HANDLING_FACTORS.find(opt => opt.value === factor)?.label || factor
          ) || [];

          return (
            <Card key={idx} className="border-l-4 border-l-indigo-500">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">{equipmentName}</h4>
                      {EQUIPMENT_OPTIONS.find(opt => opt.value === item.equipmentUsed)?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {EQUIPMENT_OPTIONS.find(opt => opt.value === item.equipmentUsed)?.description}
                        </p>
                      )}
                    </div>
                    {item.hasExpiryDate === "yes" && item.maintenanceExpiryDate && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expiry Tracked
                      </Badge>
                    )}
                  </div>

                  {/* Handling Factors */}
                  {handlingFactorLabels.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded p-3">
                      <label className="text-sm font-medium text-amber-900 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Factors to Consider When Moving and Handling
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {handlingFactorLabels.map((factor, i) => (
                          <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Remedial Action */}
                  {item.remedialAction && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <label className="text-sm font-medium text-blue-900">Possible Remedial Action</label>
                      <p className="text-sm text-blue-800 mt-1 whitespace-pre-wrap">{item.remedialAction}</p>
                    </div>
                  )}

                  {/* Maintenance Expiry Date */}
                  {item.hasExpiryDate === "yes" && item.maintenanceExpiryDate && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <label className="text-sm font-medium text-green-900 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Maintenance Expiry Date
                      </label>
                      <p className="text-sm text-green-800 mt-1 font-medium">
                        {new Date(item.maintenanceExpiryDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {/* Legacy fields support */}
                  {(item.supplier || item.serial_number || item.location) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {item.supplier && (
                        <div>
                          <label className="text-muted-foreground">Supplier</label>
                          <p className="font-medium">{item.supplier}</p>
                        </div>
                      )}
                      {item.serial_number && (
                        <div>
                          <label className="text-muted-foreground">Serial Number</label>
                          <p className="font-medium font-mono text-xs">{item.serial_number}</p>
                        </div>
                      )}
                      {item.location && (
                        <div>
                          <label className="text-muted-foreground">Location</label>
                          <p className="font-medium">{item.location}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Legacy notes field */}
                  {item.notes && (
                    <div className="bg-muted/50 rounded p-3">
                      <label className="text-sm font-medium">Additional Notes</label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
