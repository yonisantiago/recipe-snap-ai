'use server';
/**
 * @fileOverview This file defines a Genkit flow that identifies ingredients from a photo of food.
 *
 * - identifyIngredients - A function that takes a photo of food as input and returns a list of identified ingredients.
 * - IdentifyIngredientsInput - The input type for the identifyIngredientsInput function.
 * - IdentifyIngredientsOutput - The return type for the identifyIngredientsInput function.
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

// Simple delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function to check if the error is a 503 error
const isServiceUnavailableError = (error: any): boolean => {
  // Check based on common error structures or messages for 503
  const message = error?.message || '';
  const cause = error?.cause as any; // Type assertion for potential cause property
  const status = cause?.status || error?.status; // Check status in cause or error itself

  return status === 503 || message.includes('503') || message.includes('Service Unavailable') || message.includes('overloaded');
};


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
    let retries = 0;
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second

    while (retries < maxRetries) {
      try {
        console.log(`Attempt ${retries + 1} for identifyIngredientsPrompt`);
        const {output} = await identifyIngredientsPrompt(input);
        return output!;
      } catch (error) {
        console.error(`Error in identifyIngredientsFlow (Attempt ${retries + 1}):`, error);
        if (isServiceUnavailableError(error) && retries < maxRetries - 1) {
          retries++;
          const waitTime = initialDelay * Math.pow(2, retries - 1); // Exponential backoff
          console.warn(`Service unavailable (503). Retrying in ${waitTime}ms...`);
          await delay(waitTime);
        } else {
           // If it's not a 503 error or max retries reached, throw the error
           const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during ingredient identification.";
           throw new Error(`Failed to identify ingredients after ${retries + 1} attempts: ${errorMessage}`);
        }
      }
    }
     // Should not be reached if logic is correct, but acts as a safeguard
    throw new Error(`Failed to identify ingredients after ${maxRetries} attempts due to persistent errors.`);
  }
);

