import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, days, budget, travelers, preferences } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Generate a detailed ${days}-day travel itinerary for ${destination}.
Budget: ₹${budget || "flexible"} for ${travelers || 1} traveler(s).
Preferences: ${preferences || "general sightseeing"}.

Return a JSON object using the tool provided. Each activity should include a realistic estimated_cost in INR. Include a mix of sightseeing, food experiences, and local activities. Ensure time_slots are logical (morning, afternoon, evening). Add brief but helpful descriptions and exact location names.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are an expert travel planner specializing in Indian and international destinations. Generate structured, realistic itineraries with accurate cost estimates in INR.",
          },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_itinerary",
              description: "Create a structured travel itinerary",
              parameters: {
                type: "object",
                properties: {
                  activities: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        day_number: { type: "number" },
                        time_slot: { type: "string", enum: ["morning", "afternoon", "evening"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        location: { type: "string" },
                        estimated_cost: { type: "number" },
                      },
                      required: ["day_number", "time_slot", "title", "description", "location", "estimated_cost"],
                    },
                  },
                  total_estimated_cost: { type: "number" },
                  tips: { type: "array", items: { type: "string" } },
                },
                required: ["activities", "total_estimated_cost", "tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_itinerary" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate itinerary" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No itinerary generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itinerary = JSON.parse(toolCall.function.arguments);
    const pexelsApiKey = Deno.env.get("PEXELS_API_KEY");
    if (Array.isArray(itinerary.activities)) {
      for (const activity of itinerary.activities) {
        activity.photo_url = null;
        if (!pexelsApiKey || !activity?.title) continue;
        const searchQuery = `${activity.title} ${destination}`.trim();
        const searchUrl =
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`;
        try {
          const pexelsRes = await fetch(searchUrl, {
            headers: { Authorization: pexelsApiKey },
          });
          if (!pexelsRes.ok) continue;
          const pexelsData = (await pexelsRes.json()) as {
            photos?: Array<{ src?: { large?: string; medium?: string } }>;
          };
          const src = pexelsData.photos?.[0]?.src;
          activity.photo_url = src?.large ?? src?.medium ?? null;
        } catch {
          /* keep photo_url null */
        }
      }
    }
    return new Response(JSON.stringify(itinerary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("itinerary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
