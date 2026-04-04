import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { streamChat, type Msg } from "@/lib/streamChat";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!user,
  });
};

export const useChat = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadConversation = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");
    if (error) throw error;
    setMessages(data.map((m) => ({ role: m.role as Msg["role"], content: m.content })));
    setConversationId(convId);
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  const send = useCallback(
    async (input: string) => {
      if (!user || !input.trim()) return;
      const userMsg: Msg = { role: "user", content: input.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      let convId = conversationId;

      try {
        // Create conversation if needed
        if (!convId) {
          const { data, error } = await supabase
            .from("conversations")
            .insert({ user_id: user.id, title: input.trim().slice(0, 60) })
            .select()
            .single();
          if (error) throw error;
          convId = data.id;
          setConversationId(convId);
        }

        // Save user message (RLS enforces role='user' for client inserts)
        await supabase.from("chat_messages").insert({
          conversation_id: convId,
          user_id: user.id,
          role: "user",
          content: input.trim(),
        });

        let assistantSoFar = "";
        const controller = new AbortController();
        abortRef.current = controller;

        const upsertAssistant = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

        await streamChat({
          messages: [...messages, userMsg],
          conversationId: convId,
          onDelta: upsertAssistant,
          onDone: async () => {
            setIsLoading(false);
            // Assistant message is now saved server-side by the edge function
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          },
          signal: controller.signal,
        });
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AbortError") return;
        console.error(e);
        setIsLoading(false);
        const msg = e instanceof Error ? e.message : "Something went wrong. Please try again.";
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${msg}` }]);
      }
    },
    [user, conversationId, messages, queryClient]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return { messages, isLoading, send, stop, conversationId, loadConversation, startNewChat };
};
