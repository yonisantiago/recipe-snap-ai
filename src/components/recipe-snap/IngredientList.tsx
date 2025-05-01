import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { List } from 'lucide-react';

interface IngredientListProps {
  ingredients: string[];
}

export function IngredientList({ ingredients }: IngredientListProps) {
  if (!ingredients || ingredients.length === 0) {
    return null; // Don't render anything if no ingredients
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
           <List className="h-5 w-5 text-primary" />
           Identified Ingredients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ingredient, index) => (
            <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
              {ingredient}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
