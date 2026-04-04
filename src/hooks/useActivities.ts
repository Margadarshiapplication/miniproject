import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TripActivity {
  id: string;
  trip_id: string;
  user_id: string;
  day_number: number;
  time_slot: string | null;
  title: string;
  description: string | null;
  location: string | null;
  estimated_cost: number;
  /** Present when DB column exists and set (e.g. AI-generated activities). */
  photo_url?: string | null;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
}

export const useTripActivities = (tripId: string | undefined) => {
  return useQuery({
    queryKey: ["trip_activities", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_activities")
        .select("*")
        .eq("trip_id", tripId!)
        .order("day_number")
        .order("sort_order");
      if (error) throw error;
      return data as TripActivity[];
    },
    enabled: !!tripId,
  });
};

export const useAddActivity = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (activity: {
      trip_id: string;
      day_number: number;
      time_slot?: string;
      title: string;
      description?: string;
      location?: string;
      estimated_cost?: number;
      photo_url?: string | null;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("trip_activities")
        .insert({ ...activity, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as TripActivity;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trip_activities", data.trip_id] });
    },
  });
};

export const useToggleActivity = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed, trip_id }: { id: string; is_completed: boolean; trip_id: string }) => {
      const { error } = await supabase.from("trip_activities").update({ is_completed }).eq("id", id);
      if (error) throw error;
      return trip_id;
    },
    onSuccess: (trip_id) => {
      queryClient.invalidateQueries({ queryKey: ["trip_activities", trip_id] });
    },
  });
};
