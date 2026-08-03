import apiClient from '@/lib/api';
import { LigneDemande, CreerDemandeRequest, LigneResponse, DemandeResponse  } from '@/types/demande';



export const demandeService = {
  creer: async (data: CreerDemandeRequest): Promise<DemandeResponse> => {
    const { data: response } = await apiClient.post('/demandes', data);
    return response;
  },
  getMesDemandes: async (): Promise<DemandeResponse[]> => {
    try {
      const { data } = await apiClient.get('/demandes/mes-demandes');
      return data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error('Accès interdit : vérifiez votre rôle (EMPLOYE requis)');
      }
      throw error;
    }
  },
  getDemandesAValider: async (): Promise<DemandeResponse[]> => {
    const { data } = await apiClient.get('/chef/demandes/en-attente');
    return data;
  },
  approuver: async (id: number): Promise<DemandeResponse> => {
    const { data } = await apiClient.put(`/chef/demandes/${id}/approuver`);
    return data;
  },
  rejeter: async (id: number, motifRefus: string): Promise<DemandeResponse> => {
    const { data } = await apiClient.put(`/chef/demandes/${id}/rejeter`, { motifRefus });
    return data;
  },
  ajuster: async (id: number, lignes: { ligneId: number; quantiteAccordee: number }[]): Promise<DemandeResponse> => {
    const { data } = await apiClient.put(`/chef/demandes/${id}/ajuster`, { lignes });
    return data;
  },
  annoter: async (id: number, annotation: string): Promise<DemandeResponse> => {
    const { data } = await apiClient.put(`/chef/demandes/${id}/annoter`, { annotation });
    return data;
  },
  getDemandesPourChef: async (statut?: string): Promise<DemandeResponse[]> => {
    const params = statut ? { statut } : {};
    const { data } = await apiClient.get('/chef/demandes', { params });
    return data;
  },
  updateDemande: async (id: number, data: CreerDemandeRequest): Promise<DemandeResponse> => {
    const { data: response } = await apiClient.put(`/demandes/${id}`, data);
    return response;
  },
  deleteDemande: async (id: number): Promise<void> => {
    await apiClient.delete(`/demandes/${id}`);
  },
};