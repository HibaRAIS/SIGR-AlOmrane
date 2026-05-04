// src/types/notification.ts
export interface Notification {
  id: number;
  type: 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR';
  titre: string;
  message: string;
  details: string | null;
  lien: string | null;
  lu: boolean;
  dateCreation: string;
  tempsRelatif?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}