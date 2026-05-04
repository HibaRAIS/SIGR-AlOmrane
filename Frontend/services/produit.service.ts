import apiClient from '@/lib/api';

export interface Produit {
  id: number;
  codeArticle: string;
  designation: string;
  description: string;
  uniteMesure: string;
  categorieId?: number;
  imageUrl?: string;
  poidsUnitaire?: number;
  dimensions?: string;
  materiau?: string;
  instructionsSecurite?: string;
}

export const produitService = {
  getCatalogue: async (): Promise<Produit[]> => {
    const { data } = await apiClient.get('/produits/public');
    return data;
  },
};