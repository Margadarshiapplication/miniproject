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

const API_URL = import.meta.env.VITE_API_URL || "";

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
      // Get user session for auth
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await fetch(`${API_URL}/api/itinerary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || err.detail || `HTTP ${resp.status}`);
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
