import { useFluidIntakeSummary } from '@/hooks/useFluidIntakeRecords';
import { useFluidOutputSummary } from '@/hooks/useFluidOutputRecords';
import { useUrinaryOutputSummary } from '@/hooks/useUrinaryOutputRecords';
import { useFluidBalanceTarget, useUpdateFluidBalanceTarget } from '@/hooks/useFluidBalanceTargets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, Droplets, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';

interface FluidBalanceSummaryProps {
  clientId: string;
  date: string;
}

export function FluidBalanceSummary({ clientId, date }: FluidBalanceSummaryProps) {
  const { data: intakeSummary } = useFluidIntakeSummary(clientId, date);
  const { data: outputSummary } = useFluidOutputSummary(clientId, date);
  const { data: urinarySummary } = useUrinaryOutputSummary(clientId, date);
  const { data: target } = useFluidBalanceTarget(clientId);
  const updateTarget = useUpdateFluidBalanceTarget();

  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [targetValues, setTargetValues] = useState({
    daily_intake_target_ml: 2000,
    alert_threshold_percentage: 50,
    notes: '',
  });

  // Sync target values when target data is fetched
  useEffect(() => {
    if (target) {
      setTargetValues({
        daily_intake_target_ml: target.daily_intake_target_ml || 2000,
        alert_threshold_percentage: target.alert_threshold_percentage || 50,
        notes: target.notes || '',
      });
    }
  }, [target]);

  const totalIntake = intakeSummary?.total || 0;
  const totalOutput = (outputSummary?.total || 0) + (urinarySummary?.total || 0);
  const fluidBalance = totalIntake - totalOutput;

  const intakeTarget = target?.daily_intake_target_ml || 2000;
  const intakePercentage = (totalIntake / intakeTarget) * 100;
  const alertThreshold = target?.alert_threshold_percentage || 50;

  const hasLowIntake = intakePercentage < alertThreshold;
  const hasNegativeBalance = fluidBalance < 0;

  const handleSaveTarget = () => {
    updateTarget.mutate({
      client_id: clientId,
      ...targetValues,
    }, {
      onSuccess: () => {
        setTargetDialogOpen(false);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {hasLowIntake && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Low Fluid Intake</AlertTitle>
          <AlertDescription>
            Fluid intake is less than {alertThreshold}% of the daily target ({totalIntake}ml / {intakeTarget}ml).
            Encourage the service user to drink more fluids.
          </AlertDescription>
        </Alert>
      )}

      {totalIntake < 500 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Severe Dehydration Risk</AlertTitle>
          <AlertDescription>
            Total intake is critically low (&lt;500ml). Please notify senior carer or healthcare professional immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Droplets className="h-4 w-4 text-primary" />
              Total Intake
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-primary">{totalIntake} ml</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Target: {intakeTarget} ml ({intakePercentage.toFixed(0)}%)
            </div>
            <Progress value={Math.min(intakePercentage, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-secondary" />
              Total Output
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl sm:text-3xl font-bold text-secondary">{totalOutput} ml</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              Urinary: {urinarySummary?.total || 0} ml | Other: {outputSummary?.total || 0} ml
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
              {fluidBalance >= 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
              Fluid Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`text-2xl sm:text-3xl font-bold ${fluidBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {fluidBalance > 0 && '+'}{fluidBalance} ml
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              {fluidBalance >= 0 ? 'Positive balance' : 'Negative balance - monitor closely'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guidelines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base">Guidelines & Notes</CardTitle>
          <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => {
                setTargetValues({
                  daily_intake_target_ml: target?.daily_intake_target_ml || 2000,
                  alert_threshold_percentage: target?.alert_threshold_percentage || 50,
                  notes: target?.notes || '',
                });
              }}>
                <Settings className="h-4 w-4 mr-2" />
                Set Target
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Fluid Balance Target</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Daily Intake Target (ml)</label>
                  <Input
                    type="number"
                    min="500"
                    max="5000"
                    value={targetValues.daily_intake_target_ml}
                    onChange={(e) => setTargetValues({ ...targetValues, daily_intake_target_ml: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Alert Threshold (%)</label>
                  <Input
                    type="number"
                    min="10"
                    max="100"
                    value={targetValues.alert_threshold_percentage}
                    onChange={(e) => setTargetValues({ ...targetValues, alert_threshold_percentage: parseInt(e.target.value) })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Alert when intake falls below this % of target
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    value={targetValues.notes}
                    onChange={(e) => setTargetValues({ ...targetValues, notes: e.target.value })}
                    placeholder="Any special instructions or considerations..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSaveTarget} disabled={updateTarget.isPending} className="w-full">
                  Save Target
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Encourage the service user to drink fluids regularly throughout the day (target: {intakeTarget}ml/day).</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p>Notify the senior carer or nurse if fluid intake is less than {alertThreshold}% of the target or urine output appears abnormal (e.g. dark, strong odour, blood-stained).</p>
            </div>
            <div className="flex items-start gap-2">
              <Droplets className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Record any fluid offered but refused.</p>
            </div>
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <p>Ensure accurate measurement using a calibrated jug when possible.</p>
            </div>
            {target?.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="font-medium text-xs uppercase text-muted-foreground mb-1">Custom Notes:</p>
                <p className="text-sm">{target.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
