'use server';

/**
 * @fileOverview A flow to improve the accuracy of OCR processing for timegrapher images using AI.
 *
 * - improveOcrAccuracy - A function that enhances OCR accuracy using AI. Accepts an image and optionally previous OCR results.
 * - ImproveOcrAccuracyInput - The input type for the improveOcrAccuracy function.
 * - ImproveOcrAccuracyOutput - The return type for the improveOcrAccuracy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveOcrAccuracyInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a timegrapher image as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
  previousOcrResults: z
    .string()
    .optional()
    .describe('The previous OCR results, if available.'),
});

export type ImproveOcrAccuracyInput = z.infer<typeof ImproveOcrAccuracyInputSchema>;

const ImproveOcrAccuracyOutputSchema = z.object({
  correctedOcrResults: z
    .string()
    .describe('The corrected OCR results after AI processing.'),
});

export type ImproveOcrAccuracyOutput = z.infer<typeof ImproveOcrAccuracyOutputSchema>;

export async function improveOcrAccuracy(input: ImproveOcrAccuracyInput): Promise<ImproveOcrAccuracyOutput> {
  return improveOcrAccuracyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveOcrAccuracyPrompt',
  input: {schema: ImproveOcrAccuracyInputSchema},
  output: {schema: ImproveOcrAccuracyOutputSchema},
  prompt: `You are an expert in improving OCR accuracy for timegrapher images.  You will be provided with an image and, if available, previous OCR results.  Your goal is to correct any errors in the OCR results and provide the most accurate text extraction possible.

Instructions:
1.  Analyze the image {{media url=photoDataUri}} to identify the key readings (rate, amplitude, beat error, etc.).
2.  If provided, review the previous OCR results: {{{previousOcrResults}}}.
3.  Correct any errors in the OCR results, paying close attention to common OCR mistakes (e.g., misreading characters, incorrect spacing).
4.  Output the corrected OCR results as a single string.

Output Format:
Corrected OCR Results: <corrected_ocr_results_here>`,
});

const improveOcrAccuracyFlow = ai.defineFlow(
  {
    name: 'improveOcrAccuracyFlow',
    inputSchema: ImproveOcrAccuracyInputSchema,
    outputSchema: ImproveOcrAccuracyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
