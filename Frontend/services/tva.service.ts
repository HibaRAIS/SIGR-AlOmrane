import apiClient from '@/lib/api';
import type { Tva } from '@/types/tva';

export const tvaService = {
  getAll: async (): Promise<Tva[]> => {
    const { data } = await apiClient.get('/tvas');
    return data;
  },
  create: async (payload: Omit<Tva, 'id'>): Promise<Tva> => {
    const { data } = await apiClient.post('/tvas', payload);
    return data;
  },
  update: async (id: number, payload: Partial<Tva>): Promise<Tva> => {
    const { data } = await apiClient.put(`/tvas/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tvas/${id}`);
  },
};