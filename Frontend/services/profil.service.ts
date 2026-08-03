import apiClient from '@/lib/api';
import { ProfilResponse } from "@/types/profil";

export const profilService = {
  getProfil: async (): Promise<ProfilResponse> => {
    try {
      const { data } = await apiClient.get('/profil');
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur lors du chargement du profil";
      throw new Error(message);
    }
  },
  updateTelephone: async (telephone: string): Promise<void> => {
    try {
      await apiClient.put('/profil/telephone', { telephone });
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur lors de la mise à jour";
      throw new Error(message);
    }
  },
};