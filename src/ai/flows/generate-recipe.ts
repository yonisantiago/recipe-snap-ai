'use server';

/**
 * @fileOverview Generates a recipe based on a list of ingredients.
 *
 * - generateRecipe - A function that handles the recipe generation process.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  ingredients: z
    .array(z.string())
    .describe('A list of ingredients to generate a recipe from.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
  instructions: z.array(z.string()).describe('The step by step instructions for the recipe'),
  alternateIngredients: z
    .array(z.string())
    .describe('A list of alternate ingredients to consider.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

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

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const provideAlternateIngredients = ai.defineTool({
  name: 'provideAlternateIngredients',
  description: 'Suggests possible alternate ingredients given a list of original ingredients.',
  inputSchema: z.object({
    ingredients: z
      .array(z.string())
      .describe('The list of ingredients that the user has available.'),
  }),
  outputSchema: z.array(z.string()).describe('A list of alternate ingredients to consider'),
}, async input => {
  // Placeholder implementation - in a real scenario, this might call another LLM or use a database
  console.log("Tool provideAlternateIngredients called with:", input.ingredients);
  // Suggest some common pantry staples as alternatives or additions
  const commonAlternates = ["olive oil", "butter", "salt", "black pepper", "garlic powder", "onion powder"];
  // Filter out alternates already present in the input ingredients
  const suggestions = commonAlternates.filter(alt => !input.ingredients.includes(alt.toLowerCase()));
  // Return a limited number of suggestions
  return suggestions.slice(0, 3);
})

const provideAlternateSteps = ai.defineTool({
  name: 'provideAlternateSteps',
  description: 'Suggests possible alternate cooking steps or techniques given an original set of steps.',
  inputSchema: z.object({
    steps: z
      .array(z.string())
      .describe('The list of original cooking steps.'),
  }),
  outputSchema: z.array(z.string()).describe('A list of alternate steps or techniques to consider'),
}, async input => {
   // Placeholder implementation
   console.log("Tool provideAlternateSteps called with:", input.steps);
   // Suggest a generic alternative technique
   if (input.steps.some(step => step.toLowerCase().includes("fry") || step.toLowerCase().includes("saute"))) {
     return ["Consider baking or grilling as a healthier alternative."];
   }
   return ["Season to taste before serving."]; // Generic fallback suggestion
})


const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {
    schema: z.object({
      ingredients: z
        .array(z.string())
        .describe('A list of ingredients to generate a recipe from.'),
    }),
  },
  output: {
    schema: z.object({
      recipeName: z.string().describe('The name of the recipe.'),
      instructions: z.array(z.string()).describe('The step by step instructions for the recipe'),
      alternateIngredients: z
        .array(z.string())
        .describe('A list of alternate ingredients to consider.'),
    }),
  },
  prompt: `You are a world-class chef. Given the following ingredients, generate a cohesive recipe including a creative name and clear, step-by-step cooking instructions.

Ingredients:
{{#each ingredients}}
- {{{this}}}
{{/each}}

Generate the recipe name and instructions.`,
  tools: [provideAlternateIngredients, provideAlternateSteps],
  system: `You are a recipe generating machine. Generate a recipe including a list of cooking steps. If appropriate based on the provided ingredients, use the 'provideAlternateIngredients' tool to suggest relevant alternative ingredients. Only use the tool if it makes sense; don't force it. Do not use the provideAlternateSteps tool.`
});


const generateRecipeFlow = ai.defineFlow<
  typeof GenerateRecipeInputSchema,
  typeof GenerateRecipeOutputSchema
>(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    let retries = 0;
    const maxRetries = 3;
    const initialDelay = 1000; // 1 second

    while (retries < maxRetries) {
      try {
        console.log(`Attempt ${retries + 1} for generateRecipePrompt`);
        const {output} = await prompt(input);
         if (!output) {
           throw new Error('Received null output from generateRecipePrompt');
         }
        return output; // Ensure non-null return
      } catch (error) {
        console.error(`Error in generateRecipeFlow (Attempt ${retries + 1}):`, error);
        if (isServiceUnavailableError(error) && retries < maxRetries - 1) {
          retries++;
          const waitTime = initialDelay * Math.pow(2, retries - 1); // Exponential backoff
          console.warn(`Service unavailable (503). Retrying in ${waitTime}ms...`);
          await delay(waitTime);
        } else {
          // If it's not a 503 error or max retries reached, throw the error
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during recipe generation.";
          throw new Error(`Failed to generate recipe after ${retries + 1} attempts: ${errorMessage}`);
        }
      }
    }
     // Should not be reached if logic is correct, but acts as a safeguard
    throw new Error(`Failed to generate recipe after ${maxRetries} attempts due to persistent errors.`);
  }
);

