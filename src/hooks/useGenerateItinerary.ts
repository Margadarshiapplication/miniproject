import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface GeneratedActivity {
  day_number: number;
  time_slot: string;
  title: string;
  description: string;
  location: string;
  estimated_cost: number;
  photo_url: string | null;
}

interface GeneratedItinerary {
  activities: GeneratedActivity[];
  total_estimated_cost: number;
  tips: string[];
}

export const useGenerateItinerary = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedItinerary | null>(null);

  const generate = async (params: {
    destination: string;
    days: number;
    budget?: number;
    travelers?: number;
    preferences?: string;
  }) => {
    setIsGenerating(true);
    setResult(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-itinerary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify(params),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const data: GeneratedItinerary = await resp.json();
      setResult(data);
      return data;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Could not generate itinerary. Try again.";
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, result };
};
