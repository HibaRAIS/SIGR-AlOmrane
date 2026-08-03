// services/categorie.service.ts
import apiClient from '@/lib/api';
import { CategorieArborescence } from '@/types/categorie';


export const categorieService = {
  getArborescence: async (): Promise<CategorieArborescence[]> => {
    const { data } = await apiClient.get('/categories');
    return data;
  },

  // Nouvelle méthode pour créer une catégorie
  createCategory: async (payload: { nom: string; parentId: number | null }): Promise<CategorieArborescence> => {
    const { data } = await apiClient.post('/categories', payload);
    return data;
  },

  // Mise à jour (nom, etc.)
  updateCategory: async (id: number, payload: { nom?: string; parentId?: number | null }): Promise<CategorieArborescence> => {
    const { data } = await apiClient.put(`/categories/${id}`, payload);
    return data;
  },

  // Suppression
  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },

};