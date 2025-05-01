'use server';
/**
 * @fileOverview This file defines a Genkit flow that identifies ingredients from a photo of food.
 *
 * - identifyIngredients - A function that takes a photo of food as input and returns a list of identified ingredients.
 * - IdentifyIngredientsInput - The input type for the identifyIngredients function.
 * - IdentifyIngredientsOutput - The return type for the identifyIngredients function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const IdentifyIngredientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type IdentifyIngredientsInput = z.infer<typeof IdentifyIngredientsInputSchema>;

const IdentifyIngredientsOutputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients identified in the photo.'),
});
export type IdentifyIngredientsOutput = z.infer<typeof IdentifyIngredientsOutputSchema>;

export async function identifyIngredients(input: IdentifyIngredientsInput): Promise<IdentifyIngredientsOutput> {
  return identifyIngredientsFlow(input);
}

const identifyIngredientsPrompt = ai.definePrompt({
  name: 'identifyIngredientsPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          'A photo of food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
        ),
    }),
  },
  output: {
    schema: z.object({
      ingredients: z
        .array(z.string())
        .describe('A list of ingredients identified in the photo.'),
    }),
  },
  prompt: `You are an expert food ingredient identifier.  You will be provided a photo of food, and you will identify the ingredients in the photo.

    Return a list of ingredients.

    Photo: {{media url=photoDataUri}}
    `,
});

const identifyIngredientsFlow = ai.defineFlow<
  typeof IdentifyIngredientsInputSchema,
  typeof IdentifyIngredientsOutputSchema
>(
  {
    name: 'identifyIngredientsFlow',
    inputSchema: IdentifyIngredientsInputSchema,
    outputSchema: IdentifyIngredientsOutputSchema,
  },
  async input => {
    const {output} = await identifyIngredientsPrompt(input);
    return output!;
  }
);
