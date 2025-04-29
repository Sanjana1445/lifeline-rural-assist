
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_VISION_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`[GEMINI-CHAT] ${message}:`, JSON.stringify(data).substring(0, 200));
  } else {
    console.log(`[GEMINI-CHAT] ${message}`);
  }
};

const emergencyFallbackResponses = [
  "Stay calm. Make sure you're in a safe position. Help is on the way. Focus on taking slow, deep breaths.",
  "I understand this is an emergency. While we wait for medical help, try to remain still and calm. Are you able to describe your symptoms or situation more clearly?",
  "Help is on the way. Are you in a safe location? If you're experiencing chest pain, sit down, rest, and try to relax until help arrives.",
  "Medical assistance is coming. If you're with someone who is unconscious but breathing, place them in the recovery position - on their side with their top leg and arm bent for support.",
  "I'm here to help while medical responders are on their way. Is there someone with you who can assist until help arrives?"
];

const triageFallbackResponses = [
  "I'm here to help assess your symptoms. Can you tell me what you're experiencing and how long it's been happening?",
  "Based on what you've shared, it sounds like you should consult with a healthcare provider. In the meantime, rest and stay hydrated.",
  "Your symptoms could have several possible causes. A healthcare professional will be able to perform proper tests to determine the exact cause and treatment.",
  "While we wait for a medical professional to help you, try to monitor your symptoms and note any changes. This information will be helpful for your doctor.",
  "I recommend seeking medical attention for a proper diagnosis. Would you like me to explain what might be happening based on your symptoms?"
];

const getRandomFallbackResponse = (isEmergency: boolean): string => {
  const responses = isEmergency ? emergencyFallbackResponses : triageFallbackResponses;
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    debugLog("Received request");
    
    let requestData;
    try {
      requestData = await req.json();
      debugLog("Parsed request data", { 
        hasPrompt: !!requestData.prompt, 
        hasImage: !!requestData.image,
        hasContext: !!requestData.context,
        hasEmergency: !!requestData.isEmergency,
        language: requestData.language || 'english'
      });
    } catch (parseError) {
      debugLog("Error parsing request JSON", parseError);
      throw new Error("Invalid request data: Could not parse JSON");
    }
    
    const { 
      prompt, 
      image, 
      language, 
      history = [], 
      context, 
      isEmergency = false, 
      emergency_description = "" 
    } = requestData;
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      debugLog("GEMINI_API_KEY is not set");
      return new Response(
        JSON.stringify({ 
          text: getRandomFallbackResponse(isEmergency),
          fallback: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Prepare system instructions based on use case
    let systemPrompt = "You are a medical assistant AI. Provide helpful medical guidance based on the user's questions or images. Always advise seeing a doctor for serious concerns.";
    
    // Add emergency context if applicable
    if (isEmergency) {
      systemPrompt = "You are an emergency medical assistant AI. The user has reported an emergency situation. Provide clear, concise, and potentially life-saving guidance while help is on the way. Focus on immediate actions the person can take to stay safe or provide first aid. Keep responses brief, direct, and focused on helping through the emergency. Include emotional reassurance but prioritize practical steps.";
      
      if (emergency_description) {
        systemPrompt += ` The reported emergency is: ${emergency_description}.`;
      }
    }
    
    // Add custom context if provided
    if (context) {
      systemPrompt += ` ${context}`;
    }
    
    // Add language instruction if non-English detected
    if (language && language !== "english") {
      systemPrompt += ` Respond in the ${language} language.`;
    }
    
    // Include conversation history
    const conversationHistory = history.map(msg => {
      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      };
    });
    
    // Add system prompt and current user prompt
    const contents = [
      { role: "model", parts: [{ text: systemPrompt }] },
      ...conversationHistory,
    ];
    
    // Add the current user prompt
    if (prompt || image) {
      const userParts = [];
      
      if (prompt) {
        userParts.push({ text: prompt });
      }
      
      if (image) {
        try {
          // Extract base64 image data (remove prefix)
          const base64Image = image.split(',')[1] || image;
          userParts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          });
        } catch (imageError) {
          debugLog("Error processing image data", imageError);
          // Continue without the image if there's an error
        }
      }
      
      contents.push({ role: "user", parts: userParts });
    } else {
      // If no prompt or image, use a default message
      contents.push({ 
        role: "user", 
        parts: [{ 
          text: isEmergency 
            ? "I need emergency medical assistance" 
            : "I need help with a medical issue" 
        }] 
      });
    }
    
    // Choose endpoint based on content type
    const endpoint = image ? GEMINI_VISION_ENDPOINT : GEMINI_ENDPOINT;
    
    debugLog("Making request to Gemini API", { endpoint });
    
    try {
      // Make request to Gemini API
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: isEmergency ? 0.2 : 0.4, // Lower temperature for emergencies to be more factual
            topP: 0.95,
            topK: 40,
            maxOutputTokens: isEmergency ? 1024 : 2048, // Shorter responses for emergencies
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      });
  
      debugLog("Received Gemini API response", { status: response.status });
      
      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = "Could not read error response";
        }
        
        debugLog("Gemini API error", { status: response.status, error: errorText });
        return new Response(
          JSON.stringify({ 
            text: getRandomFallbackResponse(isEmergency),
            error: `Gemini API error: ${response.status}`,
            fallback: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
  
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        debugLog("Error parsing Gemini API response", jsonError);
        return new Response(
          JSON.stringify({ 
            text: getRandomFallbackResponse(isEmergency),
            error: "Failed to parse Gemini API response",
            fallback: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Check if we have a valid response
      if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
        debugLog("Invalid or empty response from Gemini API", data);
        return new Response(
          JSON.stringify({ 
            text: getRandomFallbackResponse(isEmergency),
            error: "Empty response from Gemini API",
            fallback: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const generatedText = data.candidates[0].content.parts[0].text || "";
      
      debugLog("Generated response", { textLength: generatedText.length });
      
      return new Response(
        JSON.stringify({ text: generatedText }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (apiError) {
      debugLog("Error calling Gemini API", apiError);
      return new Response(
        JSON.stringify({ 
          text: getRandomFallbackResponse(isEmergency),
          error: apiError.message,
          fallback: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    debugLog("Error in gemini-chat function", { message: error.message });
    return new Response(
      JSON.stringify({ 
        text: "I'm having trouble processing your request right now. If this is an emergency, please call emergency services immediately.",
        error: error.message || "Failed to process request",
        fallback: true
      }),
      {
        status: 200, // Return 200 even for errors
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
