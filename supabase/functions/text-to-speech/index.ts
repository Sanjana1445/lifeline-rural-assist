
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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
    // Return a stub response
    return new Response(
      JSON.stringify({ 
        audioBase64: "",
        status: "feature_disabled",
        message: "Text-to-speech functionality is temporarily disabled"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: "Text-to-speech functionality is temporarily disabled",
      }),
      {
        status: 200, // Return 200 to prevent frontend crashes
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
