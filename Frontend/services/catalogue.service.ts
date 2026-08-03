import apiClient from '@/lib/api';
import { Product, PageResponse } from '@/types/catalogue';

export interface ProduitFormRequest {
  code: string;
  name: string;
  categoryPath: string;
  location: string;
  currentStock: number;
  minThreshold: number;
  prixUnitaireHT: number;
  tvaPercent: number;
  pmp: number;
  imageUrl: string;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  consignable: boolean;
  supplier: string;
  warrantyMonths: number;
  motif?: string;
  prixAchatHT?: number;
}

export interface AjustementRequest {
  nouvelleQuantite: number;
  motif: string;
  prixUnitaire?: number;
}

const CATALOGUE_ENDPOINT = '/catalogue';

export const catalogueService = {
  getAll: async (params: Record<string, string | number>): Promise<PageResponse<Product>> => {
    const { data } = await apiClient.get(CATALOGUE_ENDPOINT, { params });
    return data;
  },

  getDetail: async (id: number): Promise<Product> => {
    const { data } = await apiClient.get(`${CATALOGUE_ENDPOINT}/${id}`);
    return data;
  },

  create: async (form: ProduitFormRequest): Promise<Product> => {
    const { data } = await apiClient.post(CATALOGUE_ENDPOINT, form);
    return data;
  },

  update: async (id: number, form: ProduitFormRequest): Promise<Product> => {
    const { data } = await apiClient.put(`${CATALOGUE_ENDPOINT}/${id}`, form);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${CATALOGUE_ENDPOINT}/${id}`);
  },

  ajuster: async (id: number, request: AjustementRequest): Promise<void> => {
    await apiClient.post(`${CATALOGUE_ENDPOINT}/${id}/ajustement`, request);
  },

  getEmplacements: async (): Promise<string[]> => {
    const { data } = await apiClient.get(`${CATALOGUE_ENDPOINT}/emplacements`);
    return data;
  },


  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post('/catalogue/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data; // l'URL retournée par le backend
  },
};