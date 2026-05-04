import apiClient from '@/lib/api';

export interface LigneDemande {
  produitId: number;
  quantite: number;
}

export interface CreerDemandeRequest {
  motif: string;
  priorite: string;
  lignes: LigneDemande[];
}

// Interface pour une ligne de réponse (détaillée)
export interface LigneResponse {
  ligneId: number;
  produitId: number;
  produitDesignation: string;
  produitReference: string;
  quantiteDemandee: number;
  quantiteAccordee: number;
}

export interface DemandeResponse {
  id: number;
  numeroDemande: string;
  statut: string;
  priorite: string;
  motif: string;
  dateDemande: string;
  employeNom: string;
  structureNom: string;
  lignes: LigneResponse[];
  validePar: string | null;
  dateValidation: string | null;
  motifRefus: string | null;
  annotation: string | null;   // ajout pour les annotations
}

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