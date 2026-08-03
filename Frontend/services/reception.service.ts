// services/reception.service.ts

import apiClient from '@/lib/api';
import type {
  ReceptionDto,
  ReceptionCreateRequest,
  ReliquatDto,
  StatsReceptionsDto,
  BonEntreeSignaturesDto,
  DocumentJointDto,            // ← AJOUTER CE IMPORT
} from '@/types/reception';

const BASE = '/receptions';

export const receptionService = {
  getAll: async (params: Record<string, any>): Promise<{ content: ReceptionDto[]; totalElements: number }> => {
    const { data } = await apiClient.get(BASE, { params });
    return data;
  },

  getStats: async (): Promise<StatsReceptionsDto> => {
    const { data } = await apiClient.get(`${BASE}/stats`);
    return data;
  },

  getOne: async (id: number): Promise<ReceptionDto> => {
    const { data } = await apiClient.get(`${BASE}/${id}`);
    return data;
  },

  create: async (body: ReceptionCreateRequest): Promise<ReceptionDto> => {
    const { data } = await apiClient.post(BASE, body);
    return data;
  },

  update: async (id: number, body: Partial<ReceptionCreateRequest>): Promise<ReceptionDto> => {
    const { data } = await apiClient.put(`${BASE}/${id}`, body);
    return data;
  },

  confirmer: async (id: number): Promise<ReceptionDto> => {
    const { data } = await apiClient.put(`${BASE}/${id}/confirmer`);
    return data;
  },

  saveSignatures: async (id: number, sigs: BonEntreeSignaturesDto): Promise<ReceptionDto> => {
    const { data } = await apiClient.put(`${BASE}/${id}/signatures`, sigs);
    return data;
  },

  uploadDocument: async (id: number, file: File): Promise<DocumentJointDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post(`${BASE}/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteDocument: async (receptionId: number, documentId: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${receptionId}/documents/${documentId}`);
  },
};

export const reliquatService = {
  getAll: async (params?: Record<string, any>): Promise<ReliquatDto[]> => {
    const { data } = await apiClient.get('/receptions/reliquats', { params });
    return data;
  },
};

export const documentService = {
uploadDocument: async (id: number, file: File): Promise<DocumentJointDto> => {
    const formData = new FormData();
    formData.append('file', file);
    // ⚠️ Ne PAS ajouter de headers – Axios ajoute automatiquement le Content-Type multipart
    const { data } = await apiClient.post(`${BASE}/${id}/documents`, formData);
    return data;
},
};