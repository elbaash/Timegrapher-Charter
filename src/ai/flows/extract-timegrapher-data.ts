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

const ExtractTimegrapherDataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a timegrapher, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTimegrapherDataInput = z.infer<typeof ExtractTimegrapherDataInputSchema>;

const ExtractTimegrapherDataOutputSchema = z.object({
  rate: z.string().describe('The rate reading from the timegrapher.'),
  amplitude: z.string().describe('The amplitude reading from the timegrapher.'),
  beatError: z.string().describe('The beat error reading from the timegrapher.'),
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
  prompt: `Extract the rate, amplitude, and beat error from the timegrapher image. Return the data in JSON format.

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
