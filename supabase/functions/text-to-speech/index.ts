
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
    const { text, language = "en" } = await req.json();
    
    if (!text) {
      throw new Error("No text provided");
    }
    
    // Map languages to voice settings
    const languageVoiceMap: Record<string, { languageCode: string, name: string, ssmlGender: string }> = {
      "en": { languageCode: "en-US", name: "en-US-Neural2-F", ssmlGender: "FEMALE" },
      "hi": { languageCode: "hi-IN", name: "hi-IN-Neural2-A", ssmlGender: "FEMALE" },
      "te": { languageCode: "te-IN", name: "te-IN-Standard-A", ssmlGender: "FEMALE" },
      "ta": { languageCode: "ta-IN", name: "ta-IN-Standard-A", ssmlGender: "FEMALE" },
      "kn": { languageCode: "kn-IN", name: "kn-IN-Standard-A", ssmlGender: "FEMALE" },
      "mr": { languageCode: "mr-IN", name: "mr-IN-Standard-A", ssmlGender: "FEMALE" },
      "english": { languageCode: "en-US", name: "en-US-Neural2-F", ssmlGender: "FEMALE" },
      "hindi": { languageCode: "hi-IN", name: "hi-IN-Neural2-A", ssmlGender: "FEMALE" },
      "telugu": { languageCode: "te-IN", name: "te-IN-Standard-A", ssmlGender: "FEMALE" },
      "tamil": { languageCode: "ta-IN", name: "ta-IN-Standard-A", ssmlGender: "FEMALE" },
      "kannada": { languageCode: "kn-IN", name: "kn-IN-Standard-A", ssmlGender: "FEMALE" },
      "marathi": { languageCode: "mr-IN", name: "mr-IN-Standard-A", ssmlGender: "FEMALE" },
    };
    
    const voiceSettings = languageVoiceMap[language.toLowerCase()] || languageVoiceMap["en"];
    
    // Call Google Text-to-Speech API
    const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GOOGLE_API_TOKEN")}`,
      },
      body: JSON.stringify({
        input: { text },
        voice: voiceSettings,
        audioConfig: { audioEncoding: "MP3" },
      }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Text-to-speech conversion failed");
    }
    
    // Return the audio content as a data URL
    return new Response(
      JSON.stringify({ 
        audioUrl: `data:audio/mp3;base64,${data.audioContent}` 
      }),
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
