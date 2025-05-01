'use client';

import React, { useState } from 'react';
import { identifyIngredients } from '@/ai/flows/identify-ingredients';
import { generateRecipe } from '@/ai/flows/generate-recipe';
import { ImageUploader } from '@/components/recipe-snap/ImageUploader';
import { IngredientList } from '@/components/recipe-snap/IngredientList';
import { RecipeDisplay } from '@/components/recipe-snap/RecipeDisplay';
import { LoadingSpinner } from '@/components/recipe-snap/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, UtensilsCrossed } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { IngredientsResult, RecipeResult } from '@/lib/types';

export default function Home() {
  const [ingredientsResult, setIngredientsResult] = useState<IngredientsResult | null>(null);
  const [recipeResult, setRecipeResult] = useState<RecipeResult | null>(null);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = async (dataUri: string) => {
    setError(null);
    setIngredientsResult(null);
    setRecipeResult(null);
    setIsLoadingIngredients(true);
    setIsLoadingRecipe(false); // Ensure recipe loading stops if re-uploading

    try {
      console.log("Identifying ingredients...");
      const identifiedData = await identifyIngredients({ photoDataUri: dataUri });
      console.log("Ingredients identified:", identifiedData);

      if (!identifiedData || !identifiedData.ingredients || identifiedData.ingredients.length === 0) {
         throw new Error("Could not identify any ingredients. Please try a different photo.");
      }

      setIngredientsResult(identifiedData);
      toast({
        title: "Ingredients Identified!",
        description: `Found ${identifiedData.ingredients.length} ingredients. Generating recipe...`,
      });

      // Automatically trigger recipe generation
      await handleGenerateRecipe(identifiedData.ingredients);

    } catch (err) {
      console.error("Error identifying ingredients:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during ingredient identification.";
      setError(errorMessage);
       toast({
        title: "Identification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingIngredients(false);
    }
  };

  const handleGenerateRecipe = async (ingredients: string[]) => {
    setError(null); // Clear previous errors specific to recipe generation
    setIsLoadingRecipe(true);


    try {
       console.log("Generating recipe for:", ingredients);
       const generatedData = await generateRecipe({ ingredients });
       console.log("Recipe generated:", generatedData);

       if (!generatedData || !generatedData.recipeName || !generatedData.instructions) {
         throw new Error("Failed to generate a valid recipe. The AI might need more distinct ingredients.");
       }

       setRecipeResult(generatedData);
       toast({
         title: "Recipe Generated!",
         description: `Created the "${generatedData.recipeName}" recipe.`,
       });

    } catch (err) {
      console.error("Error generating recipe:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during recipe generation.";
      setError(errorMessage); // Set error specific to recipe generation
      toast({
        title: "Recipe Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecipe(false);
    }
  };

  const isLoading = isLoadingIngredients || isLoadingRecipe;

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 md:p-12 lg:p-24 bg-background font-sans">
       <div className="text-center mb-8 md:mb-12">
         <UtensilsCrossed className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
          Recipe Snap
        </h1>
        <p className="text-lg text-foreground/80">
          Snap a photo of your food, discover ingredients, and get cooking!
        </p>
      </div>

      <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />

       {error && (
        <Alert variant="destructive" className="w-full max-w-lg mx-auto mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoadingIngredients && (
         <div className="mt-6 flex items-center justify-center gap-2 text-primary">
             <LoadingSpinner />
             <span>Identifying ingredients...</span>
        </div>
      )}

      {ingredientsResult && !isLoadingRecipe && (
          <IngredientList ingredients={ingredientsResult.ingredients} />
      )}

       {isLoadingRecipe && (
         <div className="mt-6 flex items-center justify-center gap-2 text-primary">
             <LoadingSpinner />
             <span>Generating recipe...</span>
        </div>
      )}

      {recipeResult && !isLoadingRecipe && (
          <RecipeDisplay recipe={recipeResult} />
      )}

    </main>
  );
}
