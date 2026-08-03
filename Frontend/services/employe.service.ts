// services/employe.service.ts
import apiClient from '@/lib/api';
import type { EmployeDto, CreateEmployeRequest } from '@/types/employe';

const ENDPOINT = '/employes';

export const employeService = {
  getAll: async (): Promise<EmployeDto[]> => {
    const { data } = await apiClient.get(ENDPOINT);
    return data;
  },
  create: async (request: CreateEmployeRequest): Promise<EmployeDto> => {
    const { data } = await apiClient.post(ENDPOINT, request);
    return data;
  },
  update: async (id: number, request: CreateEmployeRequest): Promise<EmployeDto> => {
    const { data } = await apiClient.put(`${ENDPOINT}/${id}`, request);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${ENDPOINT}/${id}`);
  },
  updateStatus: async (id: number, actif: boolean): Promise<void> => {
    await apiClient.put(`${ENDPOINT}/${id}/status?actif=${actif}`);
  },
};