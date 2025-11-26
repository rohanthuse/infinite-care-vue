import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Calendar, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EQUIPMENT_OPTIONS, HANDLING_FACTORS } from '@/constants/equipment';

interface EquipmentSectionProps {
  equipment: any[] | any;
}

export function EquipmentSection({ equipment }: EquipmentSectionProps) {
  // Handle both array format and object format (with equipment_blocks)
  let equipmentItems: any[] = [];
  let movingHandling: any = null;
  let environmentChecks: any = null;
  let homeRepairs: any = null;

  if (Array.isArray(equipment)) {
    equipmentItems = equipment;
  } else if (equipment && typeof equipment === 'object') {
    equipmentItems = equipment.equipment_blocks || [];
    movingHandling = equipment.moving_handling;
    environmentChecks = equipment.environment_checks;
    homeRepairs = equipment.home_repairs;
  }

  const renderField = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null && value !== '';
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <p className="text-base mt-1 whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  const renderYesNo = (label: string, value: any) => {
    const hasValue = value !== undefined && value !== null;
    
    return (
      <div>
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        {hasValue ? (
          <Badge variant={value === true || value === 'yes' ? 'default' : 'secondary'} className="mt-1 block w-fit">
            {value === true || value === 'yes' ? 'Yes' : 'No'}
          </Badge>
        ) : (
          <p className="text-sm mt-1 text-muted-foreground italic">No data provided</p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Equipment & Aids ({equipmentItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Equipment List */}
        {equipmentItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
            <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No equipment has been recorded yet.</p>
            <p className="text-sm">Equipment can be added during care plan creation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {equipmentItems.map((item, idx) => {
              const equipmentName = item.equipmentUsed 
                ? EQUIPMENT_OPTIONS.find(opt => opt.value === item.equipmentUsed)?.label || item.equipmentUsed
                : (item.name || item.equipment_name || item.type || 'Unknown Equipment');
              
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
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Factors to Consider When Moving and Handling</label>
                        {handlingFactorLabels.length > 0 ? (
                          <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2">
                            <div className="flex flex-wrap gap-2">
                              {handlingFactorLabels.map((factor: string, i: number) => (
                                <Badge key={i} variant="secondary" className="bg-amber-100 text-amber-900 border-amber-300">
                                  {factor}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm mt-1 text-muted-foreground italic">No handling factors specified</p>
                        )}
                      </div>

                      {/* Remedial Action */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Possible Remedial Action</label>
                        {item.remedialAction ? (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                            <p className="text-sm text-blue-800 whitespace-pre-wrap">{item.remedialAction}</p>
                          </div>
                        ) : (
                          <p className="text-sm mt-1 text-muted-foreground italic">No remedial action specified</p>
                        )}
                      </div>

                      {/* Maintenance Expiry Date */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Maintenance Expiry Date</label>
                        {item.hasExpiryDate === "yes" && item.maintenanceExpiryDate ? (
                          <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
                            <p className="text-sm text-green-800 font-medium">
                              {new Date(item.maintenanceExpiryDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm mt-1 text-muted-foreground italic">No expiry date specified</p>
                        )}
                      </div>

                      {/* Legacy fields support */}
                      {(item.supplier || item.serial_number || item.location) && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {renderField('Supplier', item.supplier)}
                          {renderField('Serial Number', item.serial_number)}
                          {renderField('Location', item.location)}
                        </div>
                      )}

                      {/* Notes */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Additional Notes</label>
                        {item.notes ? (
                          <div className="bg-muted/50 rounded p-3 mt-2">
                            <p className="text-sm whitespace-pre-wrap">{item.notes}</p>
                          </div>
                        ) : (
                          <p className="text-sm mt-1 text-muted-foreground italic">No additional notes</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Moving and Handling */}
        <div>
          <h4 className="font-semibold text-base mb-3">Moving and Handling</h4>
          {movingHandling && Object.keys(movingHandling).length > 0 ? (
            <div className="bg-muted/50 rounded p-4 space-y-3">
              {Object.entries(movingHandling).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</label>
                  <p className="text-base mt-1">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No moving and handling information provided</p>
          )}
        </div>

        {/* Environment Checks */}
        <div>
          <h4 className="font-semibold text-base mb-3">Environment Checks</h4>
          {environmentChecks && Object.keys(environmentChecks).length > 0 ? (
            <div className="bg-muted/50 rounded p-4 space-y-3">
              {Object.entries(environmentChecks).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</label>
                  <p className="text-base mt-1">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No environment checks information provided</p>
          )}
        </div>

        {/* Home Repairs */}
        <div>
          <h4 className="font-semibold text-base mb-3">Home Repairs</h4>
          {homeRepairs && Object.keys(homeRepairs).length > 0 ? (
            <div className="bg-muted/50 rounded p-4 space-y-3">
              {Object.entries(homeRepairs).map(([key, value]: [string, any]) => (
                <div key={key}>
                  <label className="text-sm font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</label>
                  <p className="text-base mt-1">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value) || <span className="text-muted-foreground italic">Not specified</span>}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No home repairs information provided</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
