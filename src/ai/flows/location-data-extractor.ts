'use server';
/**
 * @fileOverview A Genkit flow for extracting latitude and longitude coordinates from various location inputs.
 * 
 * - extractLocationData - A function that handles the extraction process.
 * - LocationDataExtractorInput - The input type for the extractLocationData function.
 * - LocationDataExtractorOutput - The return type for the extractLocationData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationDataExtractorInputSchema = z.object({
  locationInput: z.string().describe(
    `The location information provided by the user. This can be:
    - A Google Maps URL (e.g., "https://www.google.com/maps/place/Monumen+Nasional/@-6.1753924,106.8271528,17z")
    - A WhatsApp share link
    - A descriptive address string
    - Raw latitude and longitude coordinates`
  ),
});
export type LocationDataExtractorInput = z.infer<typeof LocationDataExtractorInputSchema>;

const LocationDataExtractorOutputSchema = z.object({
  latitude: z.number().describe('The extracted latitude coordinate.'),
  longitude: z.number().describe('The extracted longitude coordinate.'),
  parsedAddress: z.string().optional().describe('The parsed address string, if one was identifiable or inferred from the input.'),
});
export type LocationDataExtractorOutput = z.infer<typeof LocationDataExtractorOutputSchema>;

/**
 * Helper to resolve short URLs like maps.app.goo.gl to get the final coordinates.
 */
async function resolveUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return response.url;
  } catch (error) {
    console.error('Gagal resolve URL:', error);
    return url;
  }
}

const extractLocationPrompt = ai.definePrompt({
  name: 'extractLocationPrompt',
  input: {schema: LocationDataExtractorInputSchema},
  output: {schema: LocationDataExtractorOutputSchema},
  prompt: `You are an expert location data parser specializing in Indonesian geography. Your task is to extract precise latitude and longitude coordinates.

CRITICAL INSTRUCTIONS:
1. INDONESIA CONTEXT: This app is for "Bung'Kurir" in Eastern Indonesia (Papua, Maluku, Sulawesi, NTT). Always prioritize Indonesian coordinates.
2. URL PARSING:
   - For Google Maps URLs, look for the pattern "@latitude,longitude" (e.g., @-6.175,106.827) or "!3d[lat]!4d[lng]". These are the most accurate.
   - If the URL contains coordinates, extract them directly.
3. RAW COORDINATES: If the user provides raw numbers, Latitude (Indonesia) is usually between -11 and 6, and Longitude is between 94 and 142.
4. COORDINATE FORMAT: Ensure Latitude is NOT swapped with Longitude. Latitude is first in a pair of (Lat, Lng).
5. ERROR PREVENTION: If the input contains a place name but no clear coordinates, use your knowledge of Indonesian geography to provide a highly probable center for that place.

Strictly return the response in JSON format according to the provided schema.

locationInput: {{{locationInput}}}`
});

const extractLocationDataFlow = ai.defineFlow(
  {
    name: 'extractLocationDataFlow',
    inputSchema: LocationDataExtractorInputSchema,
    outputSchema: LocationDataExtractorOutputSchema,
  },
  async (input) => {
    let finalInput = input.locationInput;

    // Check if input contains a short Google Maps URL and try to resolve it
    const urlMatch = input.locationInput.match(/https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)\/\S+/);
    if (urlMatch) {
      const resolved = await resolveUrl(urlMatch[0]);
      finalInput = input.locationInput.replace(urlMatch[0], resolved);
    }

    const {output} = await extractLocationPrompt({ locationInput: finalInput });
    if (!output) {
      throw new Error('Gagal mengekstrak data lokasi.');
    }
    
    // Basic validation for Indonesia coordinates roughly
    const isWithinIndo = output.latitude >= -12 && output.latitude <= 8 && 
                         output.longitude >= 94 && output.longitude <= 142;
    
    if (!isWithinIndo) {
      console.warn('Coordinates detected outside Indonesia, AI might have hallucinated:', output);
    }

    return output;
  }
);

export async function extractLocationData(input: LocationDataExtractorInput): Promise<LocationDataExtractorOutput> {
  return extractLocationDataFlow(input);
}
