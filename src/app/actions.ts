"use server";

import { extractTimegrapherData } from "@/ai/flows/extract-timegrapher-data";

export async function analyzeImage(photoDataUri: string) {
  try {
    if (!photoDataUri) {
      throw new Error("Image data is missing.");
    }
    const result = await extractTimegrapherData({ photoDataUri });
    if (!result.rate && !result.amplitude && !result.beatError) {
      return { data: { ...result, position: result.position || 'Unknown' }, error: "Could not extract all data fields, but some were found." };
    }
    return { data: result, error: null };
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred.";
    console.error("Error analyzing image:", errorMessage);
    return { data: null, error: `Failed to analyze image: ${errorMessage}` };
  }
}
