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
    - Raw decimal coordinates (e.g., "-0.6980957, 127.4651223")
    - DMS (Degrees, Minutes, Seconds) coordinates (e.g., "0° 41′ 53.14452″ N, 127° 27′ 54.44028″ E")
    - A descriptive address or Google Maps URL`
  ),
});
export type LocationDataExtractorInput = z.infer<typeof LocationDataExtractorInputSchema>;

const LocationDataExtractorOutputSchema = z.object({
  latitude: z.number().describe('The extracted latitude coordinate in decimal format.'),
  longitude: z.number().describe('The extracted longitude coordinate in decimal format.'),
  parsedAddress: z.string().optional().describe('A formatted string representing the coordinate or address.'),
});
export type LocationDataExtractorOutput = z.infer<typeof LocationDataExtractorOutputSchema>;

const extractLocationPrompt = ai.definePrompt({
  name: 'extractLocationPrompt',
  input: {schema: LocationDataExtractorInputSchema},
  output: {schema: LocationDataExtractorOutputSchema},
  prompt: `You are an expert geographical data parser. Your primary mission is to extract decimal latitude and longitude from the user's input.

CRITICAL INSTRUCTIONS:
1. COORDINATE FORMATS:
   - DECIMAL: If the input is like "-0.6980957, 127.4651223", extract them directly.
   - DMS: If the input is like "0° 41′ 53.14452″ N, 127° 27′ 54.44028″ E", convert it to decimal format. 
     (Formula: Degrees + Minutes/60 + Seconds/3600. South (S) and West (W) should be negative).
   - URL: If it's a Google Maps link, look for the @lat,lng pattern.

2. PRIORITY:
   - Always prioritize raw coordinates (Decimal or DMS) over text addresses or URLs.
   - Ensure Latitude is the first number and Longitude is the second.

3. INDONESIA CONTEXT:
   - Most coordinates will be within the Indonesia region (Latitude: -11 to 6, Longitude: 94 to 142).

Strictly return the response in JSON format according to the provided schema.

locationInput: {{{locationInput}}}`
});

export async function extractLocationData(input: LocationDataExtractorInput): Promise<LocationDataExtractorOutput> {
  const {output} = await extractLocationPrompt(input);
  if (!output) {
    throw new Error('Gagal mengekstrak data lokasi. Pastikan format koordinat benar.');
  }
  return output;
}
