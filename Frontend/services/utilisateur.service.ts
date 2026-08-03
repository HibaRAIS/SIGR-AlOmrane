import apiClient from '@/lib/api';
import type { UtilisateurDto, CreateUtilisateurRequest } from '@/types/utilisateur';

const ENDPOINT = '/utilisateurs';

export const utilisateurService = {
  getAll: async (): Promise<UtilisateurDto[]> => {
    const { data } = await apiClient.get(ENDPOINT);
    return data;
  },
  create: async (request: CreateUtilisateurRequest): Promise<UtilisateurDto> => {
    const { data } = await apiClient.post(ENDPOINT, request);
    return data;
  },
  update: async (id: number, request: CreateUtilisateurRequest): Promise<UtilisateurDto> => {
    const { data } = await apiClient.put(`${ENDPOINT}/${id}`, request);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
  bulkDelete: async (ids: number[]): Promise<void> => {
    await apiClient.post(`${ENDPOINT}/bulk-delete`, ids);
  },
  bulkStatus: async (ids: number[], actif: boolean): Promise<void> => {
    await apiClient.post(`${ENDPOINT}/bulk-status?actif=${actif}`, ids);
  },
  syncLdap: async (): Promise<void> => {
    // Si votre backend a un service de synchronisation
    await apiClient.post(`${ENDPOINT}/sync-ldap`);
  },
};