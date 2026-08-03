import apiClient from '@/lib/api';

export interface AlerteStockDTO {
  id: number;
  type: 'CRITIQUE' | 'FAIBLE' | 'SURVEILLANCE';
  message: string;
  dateCreation: string; // ISO string
  traitee: boolean;
  ignoree: boolean;
  produitId: number;
  produitCode: string;
  produitDesignation: string;
  stockDisponible: number;
  uniteMesure: string;
}

export const alerteService = {
  getAll: async (params?: Record<string, string | boolean>): Promise<AlerteStockDTO[]> => {
    const { data } = await apiClient.get('/alertes', { params });
    return data;
  },

  traiter: async (id: number): Promise<AlerteStockDTO> => {
    const { data } = await apiClient.put(`/alertes/${id}/traiter`);
    return data;
  },

  ignorer: async (id: number): Promise<AlerteStockDTO> => {
    const { data } = await apiClient.put(`/alertes/${id}/ignorer`);
    return data;
  },

  reactiver: async (id: number): Promise<AlerteStockDTO> => {
    const { data } = await apiClient.put(`/alertes/${id}/reactiver`);
    return data;
  },
};