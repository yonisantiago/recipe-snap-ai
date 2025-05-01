import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, ChefHat, Soup } from 'lucide-react';
import type { RecipeResult } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface RecipeDisplayProps {
  recipe: RecipeResult;
}

export function RecipeDisplay({ recipe }: RecipeDisplayProps) {
  if (!recipe) {
    return null; // Don't render if no recipe
  }

  const { recipeName, instructions, alternateIngredients } = recipe;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg mt-8 mb-8">
       <CardHeader className="text-center">
        <ChefHat className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-3xl font-bold text-primary">{recipeName}</CardTitle>
         <CardDescription className="text-muted-foreground">
          A delicious recipe based on your ingredients!
        </CardDescription>
      </CardHeader>

      <CardContent className="px-6 py-4 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-primary">
             <Soup className="h-5 w-5" />
            Instructions
          </h3>
          <Separator className="mb-4" />
          <ol className="list-decimal list-inside space-y-3 text-foreground/90 pl-2">
            {instructions.map((step, index) => (
              <li key={index} className="flex items-start">
                 <span className="font-semibold mr-2 text-primary">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {alternateIngredients && alternateIngredients.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center gap-2 text-accent-foreground/80">
              <CheckCircle className="h-5 w-5 text-accent"/>
              Alternate Ingredients
            </h3>
            <Separator className="mb-4 border-accent/50" />
             <div className="flex flex-wrap gap-2">
                {alternateIngredients.map((altIngredient, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3 border-accent text-accent-foreground/90">
                    {altIngredient}
                    </Badge>
                ))}
             </div>
          </div>
        )}
      </CardContent>
       <CardFooter className="text-center text-muted-foreground text-sm justify-center pt-4">
         Enjoy your meal!
      </CardFooter>
    </Card>
  );
}
