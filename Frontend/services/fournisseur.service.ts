// services/fournisseur.service.ts

import apiClient from '@/lib/api';
import type {
  Fournisseur,
  CreateFournisseurDTO,
  UpdateFournisseurDTO,
} from '@/types/fournisseur';

const BASE_URL = '/fournisseurs';

export const fournisseurService = {
  /**
   * Récupère la liste complète des fournisseurs
   */
  getAll: async (): Promise<Fournisseur[]> => {
    const { data } = await apiClient.get<Fournisseur[]>(BASE_URL);
    return data;
  },

  /**
   * Récupère un fournisseur par son ID
   */
  getById: async (id: string): Promise<Fournisseur> => {
    const { data } = await apiClient.get<Fournisseur>(`${BASE_URL}/${id}`);
    return data;
  },

  /**
   * Crée un nouveau fournisseur
   */
  create: async (dto: CreateFournisseurDTO): Promise<Fournisseur> => {
    const { data } = await apiClient.post<Fournisseur>(BASE_URL, dto);
    return data;
  },

  /**
   * Met à jour un fournisseur existant
   */
  update: async (id: string, dto: UpdateFournisseurDTO): Promise<Fournisseur> => {
    const { data } = await apiClient.put<Fournisseur>(`${BASE_URL}/${id}`, dto);
    return data;
  },

  /**
   * Supprime un fournisseur
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Supprime une liste de fournisseurs (bulk delete)
   */
  bulkDelete: async (ids: string[]): Promise<void> => {
    await apiClient.post(`${BASE_URL}/bulk-delete`, { ids });
  },

  /**
   * Crée plusieurs fournisseurs en une seule requête
   */
  bulkCreate: async (dtos: CreateFournisseurDTO[]): Promise<Fournisseur[]> => {
    const { data } = await apiClient.post<Fournisseur[]>(`${BASE_URL}/bulk`, dtos);
    return data;
  },

  /**
   * Import depuis un fichier Excel/CSV (envoi du fichier au backend)
   */
  import: async (file: File): Promise<Fournisseur[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<Fournisseur[]>(`${BASE_URL}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};