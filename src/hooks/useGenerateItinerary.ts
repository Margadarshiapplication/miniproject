import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  }): Promise<GeneratedItinerary> => {
    setIsGenerating(true);
    setResult(null);
    try {
      // Get user session for auth header (optional — backend doesn't require it)
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Use AbortController for a 45-second timeout (NVIDIA API + Pexels enrichment can be slow)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const resp = await fetch(`${API_URL}/api/itinerary`, {
        method: "POST",
        headers,
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Server error" }));
        throw new Error(err.error || err.detail || `HTTP ${resp.status}`);
      }

      const data: GeneratedItinerary = await resp.json();

      // Validate the response has activities
      if (!data.activities || !Array.isArray(data.activities) || data.activities.length === 0) {
        throw new Error("AI returned empty itinerary. Please try again.");
      }

      setResult(data);
      return data;
    } catch (e: unknown) {
      // Re-throw so the caller (PlanTrip) can handle it
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new Error("Request timed out. The AI server may be busy — please try again.");
      }
      throw e instanceof Error ? e : new Error("Could not generate itinerary. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, result };
};
