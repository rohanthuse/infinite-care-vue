import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, X } from "lucide-react";
import { useGenerateAIRecommendations } from "@/hooks/useGenerateAIRecommendations";
import { AIRecommendationsCard } from "@/components/news2/AIRecommendationsCard";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GenerateAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any;
  latestObservation: any;
}

export function GenerateAIDialog({
  open,
  onOpenChange,
  patient,
  latestObservation,
}: GenerateAIDialogProps) {
  const { generateRecommendations, isGenerating, error } = useGenerateAIRecommendations();
  const [recommendations, setRecommendations] = useState<any>(null);

  useEffect(() => {
    if (open && latestObservation?.id) {
      handleGenerate();
    }
    // Reset when dialog closes
    if (!open) {
      setRecommendations(null);
    }
  }, [open, latestObservation?.id]);

  const handleGenerate = async () => {
    try {
      const result = await generateRecommendations(
        latestObservation.id,
        patient.id
      );
      setRecommendations(result);
    } catch (err) {
      console.error("Failed to generate recommendations:", err);
    }
  };

  const patientName = `${patient.client?.first_name || ''} ${patient.client?.last_name || ''}`.trim() || 'Unknown Patient';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Clinical Recommendations - {patientName}
          </DialogTitle>
          <DialogDescription>
            AI-powered clinical insights based on the latest NEWS2 observation and patient history
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Generating AI recommendations...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Analyzing patient data and clinical observations
              </p>
            </div>
          )}

          {error && !isGenerating && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerate}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {recommendations && !isGenerating && (
            <AIRecommendationsCard
              recommendations={JSON.stringify(recommendations)}
              observationDate={latestObservation.recorded_at}
              totalScore={latestObservation.total_score}
              riskLevel={latestObservation.risk_level}
            />
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
