import apiClient from '@/lib/api';
import {
  DemandeResponse,
  DemandeResponseResponsable,  // ← ajout
  DemandeDetailResponse,
  BonSortieDetailResponse,
  PreparationRequest,
  LivraisonRequest,
  SignatureRequest,
  AccuseResponse,
  ArticleStock,
} from '@/types/sortie';
import { catalogueService } from '@/services/catalogue.service';

export const sortieService = {

  // Liste des demandes du responsable (tous sauf EN_VALIDATION)
  getDemandes: async (params?: {
    statut?: string;
    priorite?: string;
    search?: string;
  }): Promise<DemandeResponseResponsable[]> => {
    const { data } = await apiClient.get('/responsable/demandes', { params });
    return data;
  },

  // Détail complet d'une demande (avec stocks, PMP, validations)
  getDemandeDetail: async (id: number): Promise<DemandeDetailResponse> => {
    const { data } = await apiClient.get(`/responsable/demandes/${id}/details`);
    return data;
  },

  // Refuser une demande VALIDEE
  refuserDemande: async (id: number, motif: string): Promise<DemandeResponse> => {
    const { data } = await apiClient.post(`/responsable/demandes/${id}/refuser`, { motif });
    return data;
  },

  // Créer un BonSortie (lance la préparation)
  preparerSortie: async (demandeId: number): Promise<BonSortieDetailResponse> => {
    const { data } = await apiClient.post(`/responsable/sorties/preparer/${demandeId}`);
    return data;
  },

  // Récupérer le bon de sortie (préparation)
  getBonSortie: async (bonId: number): Promise<BonSortieDetailResponse> => {
    const { data } = await apiClient.get(`/responsable/sorties/${bonId}`);
    return data;
  },

  // Sauvegarder les lignes de préparation
  sauvegarderPreparation: async (
    bonId: number,
    request: PreparationRequest
  ): Promise<BonSortieDetailResponse> => {
    const { data } = await apiClient.put(`/responsable/sorties/${bonId}/lignes`, request);
    return data;
  },

  // Enregistrer les signatures (brouillon)
  enregistrerSignatures: async (
    bonId: number,
    signatures: SignatureRequest[]
  ): Promise<BonSortieDetailResponse> => {
    const { data } = await apiClient.post(`/responsable/sorties/${bonId}/signatures`, signatures);
    return data;
  },

  // Livrer définitivement
  livrerSortie: async (bonId: number, request: LivraisonRequest): Promise<AccuseResponse> => {
    const { data } = await apiClient.post(`/responsable/sorties/${bonId}/livrer`, request);
    return data;
  },

  // Récupérer les données de l’accusé
  getAccuse: async (demandeId: number): Promise<AccuseResponse> => {
    const { data } = await apiClient.get(`/responsable/demandes/${demandeId}/accuse`);
    return data;
  },

  // Upload scan d’accusé
  uploadScanAccuse: async (demandeId: number, file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post(`/responsable/demandes/${demandeId}/scan`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Récupérer la liste des articles en stock (pour le responsable)
  getStocks: async (): Promise<ArticleStock[]> => {
    const page = await catalogueService.getAll({ page: 0, size: 9999 });
    return page.content.map((p: any) => ({
      codeArticle: p.code,
      designation: p.name,
      quantiteDisponible: p.quantiteTheorique ?? 0,
      pmp: p.avgPrice ?? 0,
    }));
  },
};