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

export interface GeneratedItinerary {
  activities: GeneratedActivity[];
  total_estimated_cost: number;
  tips: string[];
}

const API_URL = import.meta.env.VITE_API_URL || "";

/**
 * Save itinerary activities to localStorage as a fallback
 * when Supabase is unavailable or inserts fail.
 */
function saveItineraryToLocalStorage(tripId: string, itinerary: GeneratedItinerary) {
  try {
    const key = `margdarshi_itinerary_${tripId}`;
    localStorage.setItem(key, JSON.stringify(itinerary));

    // Also save into a master index so we can list all cached itineraries
    const indexKey = "margdarshi_cached_itineraries";
    const existing: string[] = JSON.parse(localStorage.getItem(indexKey) || "[]");
    if (!existing.includes(tripId)) {
      existing.push(tripId);
      localStorage.setItem(indexKey, JSON.stringify(existing));
    }
  } catch (e) {
    console.warn("[Margdarshi] Failed to save itinerary to localStorage:", e);
  }
}

/**
 * Load itinerary activities from localStorage fallback.
 */
export function loadItineraryFromLocalStorage(tripId: string): GeneratedItinerary | null {
  try {
    const key = `margdarshi_itinerary_${tripId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as GeneratedItinerary;
  } catch {
    return null;
  }
}

export const useGenerateItinerary = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedItinerary | null>(null);

  const generate = async (
    params: {
      destination: string;
      days: number;
      budget?: number;
      travelers?: number;
      preferences?: string;
    },
    tripId?: string,
    userId?: string,
  ): Promise<GeneratedItinerary> => {
    setIsGenerating(true);
    setResult(null);
    try {
      // Build headers — auth is optional (backend doesn't require it)
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      } catch {
        // Auth not available — that's fine, continue without it
      }

      // 45-second timeout for NVIDIA API + Pexels enrichment
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

      // Validate
      if (!data.activities || !Array.isArray(data.activities) || data.activities.length === 0) {
        throw new Error("AI returned empty itinerary. Please try again.");
      }

      // Always save to localStorage as backup
      if (tripId) {
        saveItineraryToLocalStorage(tripId, data);
      }

      // Try to save to Supabase if we have a tripId and userId
      if (tripId && userId) {
        try {
          // Bulk insert all activities at once (much faster than one-by-one)
          const rows = data.activities.map((a, i) => ({
            trip_id: tripId,
            user_id: userId,
            day_number: a.day_number,
            time_slot: a.time_slot || null,
            title: a.title,
            description: a.description || null,
            location: a.location || null,
            estimated_cost: a.estimated_cost || 0,
            photo_url: a.photo_url || null,
            sort_order: i,
          }));

          const { error: insertError } = await supabase
            .from("trip_activities")
            .insert(rows);

          if (insertError) {
            console.warn("[Margdarshi] Supabase activity insert failed:", insertError.message);
            // Activities are already in localStorage, so this is not fatal
          }
        } catch (dbErr) {
          console.warn("[Margdarshi] Supabase save failed, using localStorage:", dbErr);
          // Not fatal — localStorage backup is already done
        }
      }

      setResult(data);
      return data;
    } catch (e: unknown) {
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
