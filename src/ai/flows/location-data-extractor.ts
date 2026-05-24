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
    - Raw latitude and longitude coordinates (e.g., "-6.175, 106.827")
    - A descriptive address string
    - A Google Maps URL`
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
  prompt: `You are an expert location data parser specializing in Indonesian geography. Your primary task is to extract precise latitude and longitude coordinates.

CRITICAL INSTRUCTIONS:
1. COORDINATE PRIORITY: If raw numbers are present, prioritize them as (Latitude, Longitude). In Indonesia, Latitude is typically between -11 and 6, and Longitude is between 94 and 142.
2. RAW EXTRACTION: Look for pairs of numbers separated by commas or spaces.
3. ERROR PREVENTION: Ensure Latitude is NOT swapped with Longitude. Latitude is first in a pair of (Lat, Lng).
4. FALLBACK: If only a place name is provided, use your knowledge of Indonesian geography (Papua, Maluku, Sulawesi, NTT) to provide the center coordinates for that place.

Strictly return the response in JSON format according to the provided schema.

locationInput: {{{locationInput}}}`
});

export async function extractLocationData(input: LocationDataExtractorInput): Promise<LocationDataExtractorOutput> {
  const {output} = await extractLocationPrompt(input);
  if (!output) {
    throw new Error('Gagal mengekstrak data lokasi.');
  }
  return output;
}
