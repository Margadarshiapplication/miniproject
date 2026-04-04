import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Re-export from split modules for backward compatibility
export type { TripActivity } from "./useActivities";
export type { PackingItem, DocumentItem } from "./useChecklist";
export { useTripActivities, useAddActivity, useToggleActivity } from "./useActivities";
export {
  usePackingItems,
  useDocumentChecklist,
  useAddPackingItem,
  useTogglePackingItem,
  useAddDocument,
  useToggleDocument,
} from "./useChecklist";

export interface Trip {
  id: string;
  user_id: string;
  destination: string;
  destination_id: string | null;
  start_date: string;
  end_date: string;
  travelers: number;
  budget: number | null;
  budget_currency: string;
  status: "draft" | "planned" | "ongoing" | "completed" | "cancelled";
  notes: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export const useTrips = (status?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["trips", user?.id, status],
    queryFn: async () => {
      let query = supabase.from("trips").select("*").order("created_at", { ascending: false });
      if (status && status !== "all") {
        query = query.eq("status", status as Trip["status"]);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Trip[];
    },
    enabled: !!user,
  });
};

export const useTrip = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("trips").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Trip;
    },
    enabled: !!user && !!id,
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (trip: {
      destination: string;
      destination_id?: string;
      start_date: string;
      end_date: string;
      travelers: number;
      budget?: number;
      notes?: string;
      cover_image?: string;
    }) => {
      const { data, error } = await supabase
        .from("trips")
        .insert({ ...trip, user_id: user!.id, status: "planned" })
        .select()
        .single();
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};

export const useUpdateTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trip> & { id: string }) => {
      const { data, error } = await supabase.from("trips").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data as Trip;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", data.id] });
    },
  });
};

export const useDeleteTrip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};
