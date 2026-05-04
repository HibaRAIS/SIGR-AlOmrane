// services/categorie.service.ts
import apiClient from '@/lib/api';

export interface CategorieArborescence {
  id: number;
  nom: string;
  sousCategories?: CategorieArborescence[];
}

export const categorieService = {
  getArborescence: async (): Promise<CategorieArborescence[]> => {
    const { data } = await apiClient.get('/categories');
    return data;
  },
};