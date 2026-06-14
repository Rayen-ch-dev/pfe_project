import { api } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Ingredient = {
  name: string;
  qty: number;
  unit: string;
};

export type Recipe = {
  id?: string;
  label: string;
  type: 'MAIN' | 'SALAD' | 'DESSERT';
  ingredients: Ingredient[];
};

export type ReservationCounts = {
  lunch: number;
  dinner: number;
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const recipeService = {
  // Get all recipes
  getAllRecipes: async (): Promise<Recipe[]> => {
    try {
      const response = await api.get<Recipe[]>('/api/admin/recipes');
      return response;
    } catch (error: any) {
      console.error('Failed to fetch recipes:', error);
      throw error;
    }
  },

  // Get recipe by ID
  getRecipeById: async (id: string): Promise<Recipe> => {
    try {
      const response = await api.get<Recipe>(`/api/admin/recipes/${id}`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch recipe:', error);
      throw error;
    }
  },

  // Create new recipe
  createRecipe: async (recipe: Recipe): Promise<Recipe> => {
    try {
      const response = await api.post<Recipe>('/api/admin/recipes', recipe);
      return response;
    } catch (error: any) {
      console.error('Failed to create recipe:', error);
      throw error;
    }
  },

  // Update recipe
  updateRecipe: async (id: string, recipe: Recipe): Promise<Recipe> => {
    try {
      const response = await api.put<Recipe>(`/api/admin/recipes/${id}`, recipe);
      return response;
    } catch (error: any) {
      console.error('Failed to update recipe:', error);
      throw error;
    }
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<void> => {
    try {
      await api.delete(`/api/admin/recipes/${id}`);
    } catch (error: any) {
      console.error('Failed to delete recipe:', error);
      throw error;
    }
  },

  // Get reservation counts by date
  getReservationCountsByDate: async (date: string): Promise<ReservationCounts> => {
    try {
      const response = await api.get<ReservationCounts>(
        `/api/admin/recipes/reservations/counts/${date}`
      );
      return response;
    } catch (error: any) {
      console.error('Failed to fetch reservation counts:', error);
      return { lunch: 0, dinner: 0 };
    }
  },
};