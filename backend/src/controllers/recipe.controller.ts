import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

// Recipe interface
interface Ingredient {
  name: string;
  qty: number;
  unit: string;
}

interface RecipeData {
  label: string;
  type: 'MAIN' | 'SALAD' | 'DESSERT';
  ingredients: Ingredient[];
}

// Get all recipes with ingredients
export const getAllRecipes = async (req: AuthRequest, res: Response) => {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        ingredients: true
      },
      orderBy: { label: 'asc' }
    });
    
    // Transform to match frontend format
    const transformedRecipes = recipes.map(recipe => ({
      id: recipe.id,
      label: recipe.label,
      type: recipe.type.toLowerCase() as 'main' | 'salad' | 'dessert',
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit
      }))
    }));
    
    res.json(transformedRecipes);
  } catch (error: any) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
};

// Get recipe by ID
export const getRecipeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true
      }
    });
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    const transformed = {
      id: recipe.id,
      label: recipe.label,
      type: recipe.type.toLowerCase() as 'main' | 'salad' | 'dessert',
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit
      }))
    };
    
    res.json(transformed);
  } catch (error: any) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Failed to fetch recipe' });
  }
};

// Create new recipe
export const createRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const { label, type, ingredients }: RecipeData = req.body;
    
    if (!label || !type || !ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ message: 'Invalid recipe data' });
    }
    
    const recipeType = type.toUpperCase() as 'MAIN' | 'SALAD' | 'DESSERT';
    
    const recipe = await prisma.recipe.create({
      data: {
        label,
        type: recipeType,
        ingredients: {
          create: ingredients.map(ing => ({
            name: ing.name,
            qty: ing.qty,
            unit: ing.unit
          }))
        }
      },
      include: {
        ingredients: true
      }
    });
    
    const transformed = {
      id: recipe.id,
      label: recipe.label,
      type: recipe.type.toLowerCase() as 'main' | 'salad' | 'dessert',
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit
      }))
    };
    
    res.status(201).json(transformed);
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'Failed to create recipe' });
  }
};

// Update recipe
export const updateRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { label, type, ingredients }: RecipeData = req.body;
    
    const recipeType = type.toUpperCase() as 'MAIN' | 'SALAD' | 'DESSERT';
    
    // Delete existing ingredients
    await prisma.recipeIngredient.deleteMany({
      where: { recipeId: id }
    });
    
    const recipe = await prisma.recipe.update({
      where: { id },
      data: {
        label,
        type: recipeType,
        ingredients: {
          create: ingredients.map(ing => ({
            name: ing.name,
            qty: ing.qty,
            unit: ing.unit
          }))
        }
      },
      include: {
        ingredients: true
      }
    });
    
    const transformed = {
      id: recipe.id,
      label: recipe.label,
      type: recipe.type.toLowerCase() as 'main' | 'salad' | 'dessert',
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit
      }))
    };
    
    res.json(transformed);
  } catch (error: any) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ message: 'Failed to update recipe' });
  }
};

// Delete recipe
export const deleteRecipe = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    await prisma.recipe.delete({
      where: { id }
    });
    
    res.json({ message: 'Recipe deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'Failed to delete recipe' });
  }
};

// Get reservation counts by date
export const getReservationCountsByDate = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }
    
    // Parse the date and get start/end of day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Get all reservations for the date
    const reservations = await prisma.reservation.findMany({
      where: {
        meal: {
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        status: { in: ['CONFIRMED', 'USED'] }
      },
      include: {
        meal: true
      }
    });
    
    // Count lunch and dinner reservations
    const lunchCount = reservations.filter(r => r.meal?.type === 'LUNCH').length;
    const dinnerCount = reservations.filter(r => r.meal?.type === 'DINNER').length;
    
    res.json({
      lunch: lunchCount,
      dinner: dinnerCount
    });
  } catch (error: any) {
    console.error('Error fetching reservation counts:', error);
    res.status(500).json({ message: 'Failed to fetch reservation counts' });
  }
};
