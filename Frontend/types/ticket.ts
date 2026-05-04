export interface CreerTicketRequest {
  categorie: string;
  sujet: string;
  description: string;
  priorite?: string;
}

export interface TicketResponse {
  id: number;
  sujet: string;
  description: string;
  priorite: string;
  statut: string;
  categorie: string;
  dateCreation: string;
  reponse: string | null;
  dateReponse: string | null;
  utilisateurNom?: string;
  utilisateurEmail?: string;
  utilisateurTelephone?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}