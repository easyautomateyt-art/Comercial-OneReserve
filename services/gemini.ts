import { GoogleGenAI, Type } from "@google/genai";
import { Place } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Search for places nearby using Gemini Maps Grounding
export const searchNearbyPlaces = async (
  query: string,
  lat: number,
  lng: number
): Promise<Place[]> => {
  try {
    const model = "gemini-2.5-flash"; 
    
    // Explicitly ask for specific fields to ensure we get addresses
    const response = await ai.models.generateContent({
      model,
      contents: `Find 10 places matching "${query}" near location ${lat}, ${lng}. 
      Return a detailed list including the full specific address for each.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    latitude: lat,
                    longitude: lng
                }
            }
        }
      },
    });

    const secondPass = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Based on the following search results from Google Maps, format them into a valid JSON array.
        Each object must have: 'name', 'address' (full street address), 'type' (category).
        
        Search Context: ${response.text}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        address: { type: Type.STRING },
                        type: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const parsed = JSON.parse(secondPass.text || "[]");
    return parsed.map((p: any, i: number) => ({
        id: `place-${Date.now()}-${i}`,
        name: p.name,
        address: p.address,
        type: p.type,
        location: { 
            // Add slight random jitter to separate markers visually if exact coords aren't available
            lat: lat + (Math.random() - 0.5) * 0.01, 
            lng: lng + (Math.random() - 0.5) * 0.01 
        } 
    }));

  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
};

export const getAddressSuggestions = async (input: string, lat: number, lng: number): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `The user is manually typing an address: "${input}". 
            The user is currently near Lat: ${lat}, Lng: ${lng}.
            Provide 5 distinct, specific, real-world address suggestions that complete what they are typing. 
            Include street names and numbers.
            Return ONLY a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Address suggestion error", e);
        return [];
    }
}

export const getCoordinatesForAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
        // Step 1: Search using Google Maps tool (Cannot return JSON directly)
        const searchResponse = await ai.models.generateContent({
             model: "gemini-2.5-flash",
             contents: `Find the exact geographic coordinates (latitude and longitude) for this specific address: "${address}".`,
             config: {
                 tools: [{ googleMaps: {} }]
             }
        });

        // Step 2: Extract structured data from the search result using a standard model call
        const extractionResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Extract the latitude and longitude from this text. Return a JSON object with "lat" and "lng" keys.
            
            Text: ${searchResponse.text}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        lat: { type: Type.NUMBER },
                        lng: { type: Type.NUMBER }
                    }
                }
            }
        });

        const data = JSON.parse(extractionResponse.text || "{}");
        if (typeof data.lat === 'number' && typeof data.lng === 'number') {
             return { lat: data.lat, lng: data.lng };
        }
        return null;
    } catch (e) {
        console.error("Geocoding error", e);
        return null;
    }
}

export const analyzeSentiment = async (feedback: string): Promise<'positive' | 'neutral' | 'negative'> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the sentiment of this sales visit feedback. Return ONLY one word: "positive", "neutral", or "negative".
            
            Feedback: "${feedback}"`
        });
        const text = response.text?.toLowerCase().trim();
        if (text?.includes('positive')) return 'positive';
        if (text?.includes('negative')) return 'negative';
        return 'neutral';
    } catch (e) {
        return 'neutral';
    }
}