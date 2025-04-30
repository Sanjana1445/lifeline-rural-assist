
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`[TEXT-TO-SPEECH] ${message}:`, JSON.stringify(data).substring(0, 200));
  } else {
    console.log(`[TEXT-TO-SPEECH] ${message}`);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { text, language = "english" } = await req.json();
    
    debugLog("Received request", { textLength: text?.length, language });
    
    if (!text) {
      throw new Error("No text provided");
    }
    
    // Get the Google Cloud API key
    const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
    if (!apiKey) {
      debugLog("Missing Google Cloud API key");
      throw new Error("Google Cloud API key not configured");
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
    
    debugLog("Using voice config", voiceConfig);
    
    // Call Google Cloud Text-to-Speech API
    try {
      const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
            pitch: 0,
            // Use lower audio quality for bandwidth optimization in rural areas
            effectsProfileId: ["telephony-class-application"]
          },
        }),
      });
      
      debugLog("TTS API response status", { status: response.status });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: "Could not read error response" };
        }
        
        debugLog("Text-to-Speech API error:", errorData);
        throw new Error(errorData.error?.message || "Text-to-speech conversion failed");
      }
      
      const data = await response.json();
      
      return new Response(
        JSON.stringify({ audioBase64: data.audioContent }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      debugLog("Error calling Text-to-Speech API", apiError);
      throw apiError;
    }
  } catch (error) {
    debugLog("Error in text-to-speech function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to convert text to speech" }),
      {
        status: 200, // Return 200 to prevent frontend crashes
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
