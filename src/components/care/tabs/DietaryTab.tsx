import React, { useState } from "react";
import { Edit, Droplets, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FluidBalanceRecordDialog } from "@/components/fluid-balance/FluidBalanceRecordDialog";
import { useFluidIntakeSummary } from "@/hooks/useFluidIntakeRecords";
import { useFluidOutputSummary } from "@/hooks/useFluidOutputRecords";
import { format } from 'date-fns';

interface DietaryTabProps {
  dietaryRequirements: any;
  carePlanData?: any;
  clientId?: string;
  clientName?: string;
  onEditDietaryRequirements?: () => void;
}

export const DietaryTab: React.FC<DietaryTabProps> = ({ 
  dietaryRequirements, 
  carePlanData,
  clientId,
  clientName,
  onEditDietaryRequirements 
}) => {
  const [fluidBalanceDialogOpen, setFluidBalanceDialogOpen] = useState(false);
  const dietaryInfo = carePlanData?.auto_save_data?.dietary || dietaryRequirements || {};
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayIntake } = useFluidIntakeSummary(clientId || '', today);
  const { data: todayOutput } = useFluidOutputSummary(clientId || '', today);
  
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Dietary Requirements</h2>
            <Button variant="outline" onClick={onEditDietaryRequirements} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>

          <div className="space-y-8">
            {/* Dietary content sections... */}
            
            {/* Fluid Balance Section */}
            {clientId && clientName && (
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-blue-500" />
                    Fluid Intake & Output Monitoring
                  </h3>
                  <Button variant="outline" onClick={() => setFluidBalanceDialogOpen(true)}>
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Record Fluid Balance
                  </Button>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">Intake</div>
                        <div className="text-2xl font-bold text-primary">{todayIntake?.total || 0} ml</div>
                      </div>
                      <div className="p-4 bg-secondary/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">Output</div>
                        <div className="text-2xl font-bold text-secondary">{todayOutput?.total || 0} ml</div>
                      </div>
                      <div className="p-4 bg-accent/10 rounded-lg">
                        <div className="text-sm text-muted-foreground">Balance</div>
                        <div className="text-2xl font-bold">{(todayIntake?.total || 0) - (todayOutput?.total || 0)} ml</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {clientId && clientName && (
        <FluidBalanceRecordDialog
          open={fluidBalanceDialogOpen}
          onOpenChange={setFluidBalanceDialogOpen}
          clientId={clientId}
          clientName={clientName}
        />
      )}
    </>
  );
};
