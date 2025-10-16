import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
        {equipment.map((item, idx) => (
          <Card key={idx} className="border-l-4 border-l-indigo-500">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">{item.name || item.equipment_name || item.type}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                  {item.status && (
                    <Badge variant={item.status === 'active' || item.status === 'in_use' ? 'default' : 'secondary'}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {item.category && (
                    <div>
                      <label className="text-muted-foreground">Category</label>
                      <p className="font-medium capitalize">{item.category}</p>
                    </div>
                  )}
                  {item.location && (
                    <div>
                      <label className="text-muted-foreground">Location</label>
                      <p className="font-medium">{item.location}</p>
                    </div>
                  )}
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
                  {item.maintenance_due && (
                    <div>
                      <label className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Maintenance Due
                      </label>
                      <p className="font-medium">{new Date(item.maintenance_due).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {item.usage_instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <label className="text-sm font-medium text-blue-900">Usage Instructions</label>
                    <p className="text-sm text-blue-800 mt-1 whitespace-pre-wrap">{item.usage_instructions}</p>
                  </div>
                )}

                {item.notes && (
                  <div className="bg-muted/50 rounded p-3">
                    <label className="text-sm font-medium">Additional Notes</label>
                    <p className="text-sm mt-1">{item.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
