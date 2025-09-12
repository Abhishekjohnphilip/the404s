'use server';

/**
 * @fileOverview Implements a flow to generate a hint for an image.
 *
 * - generateImageHint - An async function that takes image data and returns a hint.
 * - GenerateImageHintInput - The input type for the generateImageHint function.
 * - GenerateImageHintOutput - The return type for the generateImageHint function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageHintInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of something, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageHintInput = z.infer<
  typeof GenerateImageHintInputSchema
>;

const GenerateImageHintOutputSchema = z.object({
  hint: z
    .string()
    .describe('A two-word hint describing the main subject of the image.'),
});
export type GenerateImageHintOutput = z.infer<
  typeof GenerateImageHintOutputSchema
>;

export async function generateImageHint(
  input: GenerateImageHintInput
): Promise<GenerateImageHintOutput> {
  return generateImageHintFlow(input);
}

const generateImageHintPrompt = ai.definePrompt({
  name: 'generateImageHintPrompt',
  input: { schema: GenerateImageHintInputSchema },
  output: { schema: GenerateImageHintOutputSchema },
  prompt: `Generate a two-word hint (e.g., "woman smiling", "man hiking") that describes the main subject of the provided image.

Photo: {{media url=photoDataUri}}`,
});

const generateImageHintFlow = ai.defineFlow(
  {
    name: 'generateImageHintFlow',
    inputSchema: GenerateImageHintInputSchema,
    outputSchema: GenerateImageHintOutputSchema,
  },
  async (input) => {
    const { output } = await generateImageHintPrompt(input);
    return output!;
  }
);
