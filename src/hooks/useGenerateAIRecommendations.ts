import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useGenerateAIRecommendations() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<number>(0);
  const currentRequestRef = useRef<string | null>(null);
  
  const COOLDOWN_MS = 10000; // 10 second cooldown between requests

  const generateRecommendations = async (
    observationId: string,
    news2PatientId: string
  ) => {
    // Prevent duplicate calls for the same observation
    if (currentRequestRef.current === observationId) {
      console.log('[useGenerateAIRecommendations] Request already in progress for this observation');
      return;
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastGeneration = now - lastGeneratedAt;
    
    if (timeSinceLastGeneration < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastGeneration) / 1000);
      const errorMsg = `Please wait ${waitSeconds} seconds before generating again.`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Mark this observation as being processed
    currentRequestRef.current = observationId;
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
      
      setLastGeneratedAt(Date.now());
      return data.recommendations;
    } catch (err) {
      console.error("Error generating AI recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to generate recommendations");
      throw err;
    } finally {
      setIsGenerating(false);
      currentRequestRef.current = null; // Clear the current request
    }
  };

  return { generateRecommendations, isGenerating, error };
}
