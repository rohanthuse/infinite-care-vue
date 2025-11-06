import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGenerateAIRecommendations() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = async (
    observationId: string,
    news2PatientId: string
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "news2-ai-recommendations",
        {
          body: {
            observation_id: observationId,
            news2_patient_id: news2PatientId,
            include_client_context: true,
            include_history: true,
          },
        }
      );

      if (functionError) throw functionError;
      return data.recommendations;
    } catch (err) {
      console.error("Error generating AI recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateRecommendations, isGenerating, error };
}
