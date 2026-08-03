// services/ticket.service.ts
import apiClient from '@/lib/api';
import { CreerTicketRequest, TicketResponse, PageResponse } from "@/types/ticket";


export const ticketService = {
  // Employé
  creerTicket: async (data: CreerTicketRequest): Promise<TicketResponse> => {
    const { data: response } = await apiClient.post('/support/tickets', data);
    return response;
  },
  getMesTickets: async (): Promise<TicketResponse[]> => {
    const { data } = await apiClient.get('/support/tickets');
    return data;
  },

  // Admin
  getAllTickets: async (): Promise<TicketResponse[]> => {
    const { data } = await apiClient.get('/support/admin/tickets');
    return data;
  },
  rechercherTickets: async (params: URLSearchParams): Promise<PageResponse<TicketResponse>> => {
    const { data } = await apiClient.get(`/support/admin/tickets/recherche?${params.toString()}`);
    return data;
  },
  repondreTicket: async (id: number, reponse: string): Promise<TicketResponse> => {
    const { data } = await apiClient.put(`/support/admin/tickets/${id}/repondre`, { reponse });
    return data;
  },
  changerStatut: async (id: number, statut: string): Promise<TicketResponse> => {
    const { data } = await apiClient.put(`/support/admin/tickets/${id}/statut`, { statut });
    return data;
  },
 modifierReponse: async (id: number, reponse: string): Promise<TicketResponse> => {
  const { data } = await apiClient.put(`/support/admin/tickets/${id}/reponse`, { reponse });
  return data;
},
supprimerReponse: async (id: number): Promise<void> => {
  await apiClient.delete(`/support/admin/tickets/${id}/reponse`);
},
};