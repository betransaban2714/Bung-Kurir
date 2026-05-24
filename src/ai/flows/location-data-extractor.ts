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
    - A WhatsApp share link (often containing a Google Maps link or raw coordinates)
    - A descriptive address string (e.g., "Jl. Merdeka Barat No. 11, Gambir, Jakarta Pusat")
    - Raw latitude and longitude coordinates (e.g., "-6.1753924, 106.8271528")`
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
  prompt: `You are an expert location data parser. Your task is to extract precise latitude and longitude coordinates from various forms of location input.
The input can be a Google Maps URL, a WhatsApp share link, a descriptive address, or raw coordinates.

Follow these steps:
1.  Examine the 'locationInput' carefully.
2.  If it's a URL (Google Maps or WhatsApp share link), extract the latitude and longitude from the URL parameters or path. Prioritize precise coordinates from URLs.
3.  If it's a descriptive address, use your knowledge to infer the most accurate latitude and longitude for that address.
4.  If raw coordinates are provided (e.g., "latitude, longitude"), parse them directly.
5.  Also, provide a 'parsedAddress' string. If the input was a descriptive address, use that. If it was a URL or raw coordinates, provide a concise, human-readable address that corresponds to the extracted coordinates based on your knowledge.

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
      throw new Error('Failed to extract location data.');
    }
    return output;
  }
);

export async function extractLocationData(input: LocationDataExtractorInput): Promise<LocationDataExtractorOutput> {
  return extractLocationDataFlow(input);
}
