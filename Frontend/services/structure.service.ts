// services/structure.service.ts
import apiClient from '@/lib/api';
import { StructureFlatDto, CreateStructureRequest, EmployeFlatDto } from '@/types/structure';

const STRUCTURES_ENDPOINT = '/structures';
const EMPLOYES_ENDPOINT = '/employes';

export const structureService = {
  getAllFlat: async (): Promise<StructureFlatDto[]> => {
    const { data } = await apiClient.get(`${STRUCTURES_ENDPOINT}/flat`);
    return data;
  },

  getAllEmployesFlat: async (): Promise<EmployeFlatDto[]> => {
    const { data } = await apiClient.get(`${EMPLOYES_ENDPOINT}/flat`);
    return data;
  },

  create: async (request: CreateStructureRequest): Promise<StructureFlatDto> => {
    const { data } = await apiClient.post(STRUCTURES_ENDPOINT, request);
    return data;
  },

  update: async (id: number, request: CreateStructureRequest): Promise<StructureFlatDto> => {
    const { data } = await apiClient.put(`${STRUCTURES_ENDPOINT}/${id}`, request);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${STRUCTURES_ENDPOINT}/${id}`);
  },
};