
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { audioData } = await req.json();
    
    if (!audioData) {
      throw new Error("No audio data provided");
    }

    // Call Gemini API for speech-to-text
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Transcribe this audio and detect what language it is in. Return result in JSON format with fields: 'transcript' and 'language'."
                },
                {
                  inline_data: {
                    mime_type: "audio/webm",
                    data: audioData.split(",")[1]
                  }
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error in speech recognition");
    }

    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse the JSON from the text response
    let parsedResult;
    try {
      // Try to extract JSON from the text response
      const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/) || result.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : result;
      parsedResult = JSON.parse(jsonStr);
    } catch (e) {
      // If parsing fails, create a simple object with the transcript
      parsedResult = { transcript: result, language: "unknown" };
    }

    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
