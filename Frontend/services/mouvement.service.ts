import apiClient from '@/lib/api';
import { PageResponse } from '@/types/catalogue';
import { MovementType } from '@/types/mouvement';

export interface MouvementResponse {
  id: number;
  date: string;
  type: MovementType;
  referenceDocument: string;
  codeUnique: string;
  designation: string;
  codeArticle: string;
  uniteMesure: string;
  quantiteMin: number;
  departement: string;
  quantite: number;
  stockInitial: number;
  stockAvant: number;
  stockApres: number;
  pmpSnapshot: number;
  valeurFlux: number;
  utilisateur: string;
  motif?: string;
  hashChaine?: string;              // ← AJOUT
}

const MOUVEMENTS_ENDPOINT = '/mouvements';

export const mouvementService = {
  getAll: async (params: Record<string, string | number>): Promise<PageResponse<MouvementResponse>> => {
    const { data } = await apiClient.get(MOUVEMENTS_ENDPOINT, { params });
    return data;
  },

  verifierIntegrite: async (): Promise<{ integrite: boolean }> => {
    const { data } = await apiClient.get(`${MOUVEMENTS_ENDPOINT}/verifier-integrite`);
    return data;
  },

  verifierMouvement: async (id: number): Promise<{
    id: number; codeUnique: string; integrite: boolean;
    hashStocke: string; hashCalcule: string; previousHash: string;
  }> => {
    const { data } = await apiClient.get(`${MOUVEMENTS_ENDPOINT}/verifier-integrite/${id}`);
    return data;
  },
};