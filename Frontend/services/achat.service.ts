import apiClient from '@/lib/api';

// Types alignés sur le backend
export interface LigneCommandeResponse {
  id: number;
  codeArticle?: string;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  totalHT: number;
  totalTTC: number;
}

export interface DocumentJointResponse {
  id: number;
  nom: string;
  type: string; // 'BON_COMMANDE' | 'FACTURE' | 'BON_LIVRAISON' | 'AUTRE'
  dataUrl: string;
  dateAjout: string;
}

export interface CommandeAchatResponse {
  id: number;
  reference: string;
  description?: string;
  objetMarche?: string;
  fournisseur: string;
  methode: string;
  numeroMarche?: string;
  montantMarche?: number;
  dateCommande?: string;
  statut: string;
  motifAnnulation?: string;
  montantHT: number;
  montantTTC: number;
  createdAt: string;
  lignes: LigneCommandeResponse[];
  documents: DocumentJointResponse[];
}

export interface StatsCommandesResponse {
  total: number;
  enCours: number;
  recues: number;
  annulees: number;
  nbMarchePublic: number;
  nbBonCommande: number;
  montantEnCours: number;
  montantRecues: number;
}

export interface CommandeAchatRequest {
  description?: string;
  objetMarche?: string;
  fournisseur: string;
  methode: string;
  numeroMarche?: string;
  montantMarche?: number;
  dateCommande?: string;
  statut?: string;
  lignes: {
    codeArticle?: string;
    designation: string;
    quantite: number;
    prixUnitaireHT: number;
    tauxTVA: number;
  }[];
  documents?: {
    nom: string;
    type: string;
    dataUrl: string;
  }[];
}

const BASE = '/achats';

export const achatService = {
  // Liste paginée et filtrée
  getAll: async (params: Record<string, any>) => {
    const { data } = await apiClient.get(BASE, { params });
    return data; // Page<CommandeAchatResponse>
  },

  // Statistiques globales
  getStats: async (): Promise<StatsCommandesResponse> => {
    const { data } = await apiClient.get(`${BASE}/stats`);
    return data;
  },

  // Détail
  getOne: async (id: number): Promise<CommandeAchatResponse> => {
    const { data } = await apiClient.get(`${BASE}/${id}`);
    return data;
  },

  // Création
  create: async (body: CommandeAchatRequest): Promise<CommandeAchatResponse> => {
    const { data } = await apiClient.post(BASE, body);
    return data;
  },

  // Modification
  update: async (id: number, body: CommandeAchatRequest): Promise<CommandeAchatResponse> => {
    const { data } = await apiClient.put(`${BASE}/${id}`, body);
    return data;
  },

  // Annulation
  annuler: async (id: number, motif: string): Promise<CommandeAchatResponse> => {
    const { data } = await apiClient.put(`${BASE}/${id}/annuler?motif=${encodeURIComponent(motif)}`);
    return data;
  },

  // Réception
  recevoir: async (id: number): Promise<CommandeAchatResponse> => {
    const { data } = await apiClient.put(`${BASE}/${id}/recevoir`);
    return data;
  },

  // Import de fichier
  importFile: async (file: File): Promise<CommandeAchatResponse[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`${BASE}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};