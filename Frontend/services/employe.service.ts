// services/employe.service.ts
import apiClient from '@/lib/api';

export interface ProfilResponse {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  service: string;
  site: string;       
  matricule: string;
  responsable: string;
  niveauAcces: string;
  badge: string;
  derniereConnexion: string;
}

export const employeService = {
  getProfil: async (): Promise<ProfilResponse> => {
    try {
      const { data } = await apiClient.get('/employes/profil');
      return data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur lors du chargement du profil";
      throw new Error(message);
    }
  },
  updateTelephone: async (telephone: string): Promise<void> => {
    try {
      await apiClient.put('/employes/profil/telephone', { telephone });
    } catch (error: any) {
      const message = error.response?.data?.message || "Erreur lors de la mise à jour";
      throw new Error(message);
    }
  },
};