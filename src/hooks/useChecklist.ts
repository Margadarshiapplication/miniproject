import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PackingItem {
  id: string;
  trip_id: string;
  user_id: string;
  category: string;
  item_name: string;
  is_packed: boolean;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  trip_id: string;
  user_id: string;
  document_name: string;
  is_ready: boolean;
  notes: string | null;
  created_at: string;
}

export const usePackingItems = (tripId: string | undefined) => {
  return useQuery({
    queryKey: ["packing_items", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packing_items")
        .select("*")
        .eq("trip_id", tripId!)
        .order("category")
        .order("created_at");
      if (error) throw error;
      return data as PackingItem[];
    },
    enabled: !!tripId,
  });
};

export const useDocumentChecklist = (tripId: string | undefined) => {
  return useQuery({
    queryKey: ["document_checklist", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_checklist")
        .select("*")
        .eq("trip_id", tripId!)
        .order("created_at");
      if (error) throw error;
      return data as DocumentItem[];
    },
    enabled: !!tripId,
  });
};

export const useAddPackingItem = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (item: { trip_id: string; category: string; item_name: string }) => {
      const { data, error } = await supabase
        .from("packing_items")
        .insert({ ...item, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as PackingItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["packing_items", data.trip_id] });
    },
  });
};

export const useTogglePackingItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_packed, trip_id }: { id: string; is_packed: boolean; trip_id: string }) => {
      const { error } = await supabase.from("packing_items").update({ is_packed }).eq("id", id);
      if (error) throw error;
      return trip_id;
    },
    onSuccess: (trip_id) => {
      queryClient.invalidateQueries({ queryKey: ["packing_items", trip_id] });
    },
  });
};

export const useAddDocument = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (doc: { trip_id: string; document_name: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("document_checklist")
        .insert({ ...doc, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as DocumentItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document_checklist", data.trip_id] });
    },
  });
};

export const useToggleDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_ready, trip_id }: { id: string; is_ready: boolean; trip_id: string }) => {
      const { error } = await supabase.from("document_checklist").update({ is_ready }).eq("id", id);
      if (error) throw error;
      return trip_id;
    },
    onSuccess: (trip_id) => {
      queryClient.invalidateQueries({ queryKey: ["document_checklist", trip_id] });
    },
  });
};
