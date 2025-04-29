
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
    const { text, language } = await req.json();
    
    if (!text) {
      throw new Error("No text provided");
    }

    // Determine language configuration
    let langCode = "en-US";
    if (language) {
      // Map common language names to BCP-47 codes
      const languageMap: Record<string, string> = {
        "hindi": "hi-IN",
        "telugu": "te-IN",
        "tamil": "ta-IN",
        "bengali": "bn-IN",
        "marathi": "mr-IN",
        "gujarati": "gu-IN",
        "kannada": "kn-IN",
        "malayalam": "ml-IN"
      };
      
      // Try to find a match in our language map
      const lcLanguage = language.toLowerCase();
      langCode = languageMap[lcLanguage] || "en-US";
    }

    // Call Gemini API for text-to-speech (using simulation for now)
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
                  text: `Convert this text to a descriptive speech synthesis format with appropriate pauses and intonations for ${langCode}: "${text}"`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error in text to speech conversion");
    }

    // Since Gemini doesn't directly offer TTS, we're just returning the processed text
    // In a real implementation, you would call a TTS API with this text
    const processedText = data.candidates?.[0]?.content?.parts?.[0]?.text || text;

    return new Response(
      JSON.stringify({ 
        text: processedText, 
        language: langCode,
        // In a real implementation, this would be the audio data
        audioUrl: `data:audio/mp3;base64,SIMULATED_AUDIO_DATA` 
      }),
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
