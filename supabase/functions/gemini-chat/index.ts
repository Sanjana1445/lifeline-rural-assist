
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, image, language } = await req.json();

    // Configure the request based on whether an image is provided
    let body: any = {
      contents: [
        {
          parts: [
            {
              text: `You are an AI medical assistant that only responds to medical queries. 
              If the query is not medical-related, respond with "I am only trained on medical data, so I can't answer your question."
              ${language ? `Please respond in ${language} language.` : ""}
              ${prompt}`
            }
          ]
        }
      ]
    };

    // Add image to the request if provided
    if (image) {
      body.contents[0].parts.unshift({
        inline_data: {
          mime_type: "image/jpeg",
          data: image.replace(/^data:image\/[a-z]+;base64,/, "")
        }
      });
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || "Error calling Gemini API");
    }

    // Extract the response text
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request.";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
