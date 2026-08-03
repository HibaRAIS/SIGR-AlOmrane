import apiClient from '@/lib/api';
import { Produit } from "@/types/produit";

export const produitService = {
  getCatalogue: async (): Promise<Produit[]> => {
    const { data } = await apiClient.get('/produits/public');
    return data;
  },
};