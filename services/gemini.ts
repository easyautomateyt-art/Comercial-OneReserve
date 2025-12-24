import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Place } from "../types";

// @ts-ignore
const apiKey = (typeof process !== 'undefined' && process.env.API_KEY) || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Search for places nearby using Gemini Maps Grounding
export const searchNearbyPlaces = async (
  query: string,
  lat: number,
  lng: number
): Promise<Place[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
    
    // Explicitly ask for specific fields to ensure we get addresses
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Find 10 places matching "${query}" near location ${lat}, ${lng}. 
      Return a detailed list including the full specific address for each.` }] }],
      tools: [
        {
          // @ts-ignore
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.3,
            },
          },
        },
      ] as any,
    });

    const text = result.response.text();

    const secondPassModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        name: { type: SchemaType.STRING },
                        address: { type: SchemaType.STRING },
                        type: { type: SchemaType.STRING }
                    },
                    required: ["name", "address"]
                }
            }
        }
    });

    const secondPassResult = await secondPassModel.generateContent(`Based on the following search results, format them into a valid JSON array.
        Each object must have: 'name', 'address' (full street address), 'type' (category).
        
        Search Context: ${text}`);

    const parsed = JSON.parse(secondPassResult.response.text() || "[]");
    return parsed.map((p: any, i: number) => ({
        id: `place-${Date.now()}-${i}`,
        name: p.name,
        address: p.address,
        type: p.type,
        location: { 
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
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            }
        });

        const result = await model.generateContent(`The user is manually typing an address: "${input}". 
            The user is currently near Lat: ${lat}, Lng: ${lng}.
            Provide 5 distinct, specific, real-world address suggestions that complete what they are typing. 
            Include street names and numbers.
            Return ONLY a JSON array of strings.`);

        return JSON.parse(result.response.text() || "[]");
    } catch (e) {
        console.error("Address suggestion error", e);
        return [];
    }
}

export const getCoordinatesForAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
             contents: [{ role: "user", parts: [{ text: `Find the exact geographic coordinates (latitude and longitude) for this specific address: "${address}".` }] }],
             tools: [{ 
                 // @ts-ignore
                 googleSearchRetrieval: {} 
             } as any]
        });

        const extractionModel = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        lat: { type: SchemaType.NUMBER },
                        lng: { type: SchemaType.NUMBER }
                    },
                    required: ["lat", "lng"]
                }
            }
        });

        const extractionResult = await extractionModel.generateContent(`Extract the latitude and longitude from this text. Return a JSON object with "lat" and "lng" keys.
            
            Text: ${result.response.text()}`);

        const data = JSON.parse(extractionResult.response.text() || "{}");
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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Analyze the sentiment of this sales visit feedback. Return ONLY one word: "positive", "neutral", or "negative".
            
            Feedback: "${feedback}"`);
        const text = result.response.text()?.toLowerCase().trim();
        if (text?.includes('positive')) return 'positive';
        if (text?.includes('negative')) return 'negative';
        return 'neutral';
    } catch (e) {
        return 'neutral';
    }
}
