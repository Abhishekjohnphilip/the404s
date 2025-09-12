'use server';

/**
 * @fileOverview Implements content moderation for user-submitted birthday wishes.
 *
 * - moderateWish - An async function that takes user-submitted content and flags it as inappropriate if necessary.
 * - ModerateWishInput - The input type for the moderateWish function.
 * - ModerateWishOutput - The return type for the moderateWish function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateWishInputSchema = z.object({
  text: z.string().describe('The text of the birthday wish.'),
});
export type ModerateWishInput = z.infer<typeof ModerateWishInputSchema>;

const ModerateWishOutputSchema = z.object({
  isAppropriate: z
    .boolean()
    .describe(
      'True if the content is appropriate; false if it violates content policy.'
    ),
  reason: z
    .string()
    .optional()
    .describe('The reason why the content was flagged as inappropriate.'),
});
export type ModerateWishOutput = z.infer<typeof ModerateWishOutputSchema>;

export async function moderateWish(input: ModerateWishInput): Promise<ModerateWishOutput> {
  return moderateWishFlow(input);
}

const moderateWishPrompt = ai.definePrompt({
  name: 'moderateWishPrompt',
  input: {schema: ModerateWishInputSchema},
  output: {schema: ModerateWishOutputSchema},
  prompt: `You are a content moderator for a birthday wish website.  Your job is to determine if user-submitted content is appropriate and respectful.

  Content that violates the content policy should be flagged as inappropriate.

  Here is the content to review:
  {{text}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const moderateWishFlow = ai.defineFlow(
  {
    name: 'moderateWishFlow',
    inputSchema: ModerateWishInputSchema,
    outputSchema: ModerateWishOutputSchema,
  },
  async input => {
    const {output} = await moderateWishPrompt(input);
    return output!;
  }
);
