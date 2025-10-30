'use server';

/**
 * @fileOverview Extracts data from a timegrapher image using OCR.
 *
 * - extractTimegrapherData - A function that handles the data extraction process.
 * - ExtractTimegrapherDataInput - The input type for the extractTimegrapherData function.
 * - ExtractTimegrapherDataOutput - The return type for the extractTimegrapherData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { POSITIONS } from '@/types';

const ExtractTimegrapherDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a timegrapher, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTimegrapherDataInput = z.infer<typeof ExtractTimegrapherDataInputSchema>;

const ExtractTimegrapherDataOutputSchema = z.object({
  rate: z.string().describe('The rate reading from the timegrapher (s/d).'),
  amplitude: z.string().describe('The amplitude reading from the timegrapher (°).'),
  beatError: z.string().describe('The beat error reading from the timegrapher (ms).'),
  position: z.enum(POSITIONS).describe('The position of the watch on the timegrapher. This may be written near the watch on a piece of paper or on the case. Positions can be: Dial Up, Dial Down, Crown Up, Crown Down, Crown Left, Crown Right. If you cannot determine the position, return "Unknown".'),
});
export type ExtractTimegrapherDataOutput = z.infer<typeof ExtractTimegrapherDataOutputSchema>;

export async function extractTimegrapherData(
  input: ExtractTimegrapherDataInput
): Promise<ExtractTimegrapherDataOutput> {
  return extractTimegrapherDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTimegrapherDataPrompt',
  input: {schema: ExtractTimegrapherDataInputSchema},
  output: {schema: ExtractTimegrapherDataOutputSchema},
  prompt: `You are an expert watchmaker's assistant. Extract the rate, amplitude, beat error, and movement position from the timegrapher image. The position might be written on a piece of paper next to the watch or on the watch case itself.

Valid positions are: ${POSITIONS.join(', ')}.

If any value is not clearly visible, leave it as an empty string. If the position is not visible, return "Unknown".

Return the data in JSON format.

Timegrapher Image: {{media url=photoDataUri}}`,
});

const extractTimegrapherDataFlow = ai.defineFlow(
  {
    name: 'extractTimegrapherDataFlow',
    inputSchema: ExtractTimegrapherDataInputSchema,
    outputSchema: ExtractTimegrapherDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
