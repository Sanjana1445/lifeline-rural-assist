
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, language = "english" } = await req.json();
    
    if (!text) {
      throw new Error("No text provided");
    }
    
    // Map languages to Google Cloud TTS language codes
    const languageMap: Record<string, { languageCode: string, name: string }> = {
      "english": { languageCode: "en-US", name: "en-US-Neural2-F" },
      "hindi": { languageCode: "hi-IN", name: "hi-IN-Neural2-A" },
      "tamil": { languageCode: "ta-IN", name: "ta-IN-Neural2-A" },
      "telugu": { languageCode: "te-IN", name: "te-IN-Neural2-A" },
      "kannada": { languageCode: "kn-IN", name: "kn-IN-Neural2-A" },
      "marathi": { languageCode: "mr-IN", name: "mr-IN-Neural2-A" },
    };
    
    // Default to English if language not supported
    const voiceConfig = languageMap[language.toLowerCase()] || languageMap["english"];
    
    // Call Google Cloud Text-to-Speech API
    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GOOGLE_API_TOKEN")}`,
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
        },
        audioConfig: { 
          audioEncoding: "MP3",
          speakingRate: 0.95,
          pitch: 0
        },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Text-to-Speech API error:", errorData);
      throw new Error(errorData.error?.message || "Text-to-speech conversion failed");
    }
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify({ audioBase64: data.audioContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to convert text to speech" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
