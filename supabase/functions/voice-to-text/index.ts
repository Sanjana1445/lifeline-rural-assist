
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
    const { audioData } = await req.json();
    
    if (!audioData) {
      throw new Error("No audio data provided");
    }
    
    // Extract the base64-encoded audio data (remove the data URL prefix if present)
    const base64Audio = audioData.split(',')[1] || audioData;
    
    // Call Google Speech-to-Text API
    const response = await fetch("https://speech.googleapis.com/v1p1beta1/speech:recognize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GOOGLE_API_TOKEN")}`,
      },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode: "en-US",
          alternativeLanguageCodes: ["hi-IN", "te-IN", "ta-IN", "kn-IN", "mr-IN"],
          model: "default",
          enableAutomaticPunctuation: true,
          useEnhanced: true, // Better quality transcription
        },
        audio: {
          content: base64Audio,
        },
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("Speech-to-Text API error:", JSON.stringify(data.error));
      throw new Error(data.error.message || "Speech recognition failed");
    }
    
    const transcript = data.results?.[0]?.alternatives?.[0]?.transcript || "";
    // Get detected language if available
    const language = data.results?.[0]?.languageCode?.split('-')?.[0] || "english";
    
    console.log("Transcription successful. Language:", language, "Text length:", transcript.length);
    
    return new Response(
      JSON.stringify({ transcript, language }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in voice-to-text function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to process audio",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
