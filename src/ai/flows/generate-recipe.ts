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
  return ["salt", "pepper"];
})

const provideAlternateSteps = ai.defineTool({
  name: 'provideAlternateSteps',
  description: 'Suggests possible alternate steps given an original set of steps.',
  inputSchema: z.object({
    steps: z
      .array(z.string())
      .describe('The list of original steps.'),
  }),
  outputSchema: z.array(z.string()).describe('A list of alternate steps to consider'),
}, async input => {
  return ["step 1", "step 2"];
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
  prompt: `You are a world-class chef.  Given the following ingredients, generate a cohesive recipe including a name and cooking steps.\n\nIngredients: {{{ingredients}}}`, // Removed unnecessary line break
  tools: [provideAlternateIngredients, provideAlternateSteps],
  system: `You are a recipe generating machine. Generate a recipe including a list of cooking steps. If you are able to, use provideAlternateIngredients to provide a list of alternative ingredients.`
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
    const {output} = await prompt(input);
    return output!;
  }
);
