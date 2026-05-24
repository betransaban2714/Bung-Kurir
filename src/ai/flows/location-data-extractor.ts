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

const extractLocationPrompt = ai.definePrompt({
  name: 'extractLocationPrompt',
  input: {schema: LocationDataExtractorInputSchema},
  output: {schema: LocationDataExtractorOutputSchema},
  prompt: `You are an expert location data parser specializing in Indonesian geography. Your task is to extract precise latitude and longitude coordinates.

CRITICAL INSTRUCTIONS:
1. INDONESIA CONTEXT: This app is for "Bung'Kurir" in Eastern Indonesia (Papua, Maluku, Sulawesi, NTT). If the input is an address without a country, ALWAYS prioritize locations within Indonesia.
2. URL PARSING:
   - For Google Maps URLs, look for the pattern "@latitude,longitude" (e.g., @-6.175,106.827). These are the most accurate.
   - For links without explicit coordinates (short links like maps.app.goo.gl), infer the location from the place name or descriptive text provided.
3. RAW COORDINATES: If the user provides raw numbers, ensure you don't swap Latitude and Longitude. Latitude is usually between -11 and 6 for Indonesia, and Longitude is between 95 and 141.
4. ERROR PREVENTION: Never return 0,0 or coordinates in America/Europe unless explicitly specified. If you are unsure, provide the most likely coordinates for that name in Indonesia.

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
    const {output} = await extractLocationPrompt(input);
    if (!output) {
      throw new Error('Gagal mengekstrak data lokasi.');
    }
    
    // Basic validation for Indonesia coordinates roughly
    const isWithinIndo = output.latitude >= -12 && output.latitude <= 7 && 
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
