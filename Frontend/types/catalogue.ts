// types/catalogue.ts

export type StockStatus = 'ok' | 'faible' | 'critique';
export type SortColumn = 'designation' | 'category' | 'location' | 'stock' | 'pmp' | 'status' | 'supplier';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'table' | 'grid';
export type StockFilter = 'all' | StockStatus;
export type ActivePanel = 'catalogue' | 'analyse';
export type RotationScore = 'rapide' | 'normale' | 'lente';

export interface Product {
  id: number;
  code: string;                // codeArticle
  name: string;                // designation
  category: string;
  subcategory: string;
  location: string;
  quantiteTheorique: number;   // stock physique réel (jamais diminué par réservation)
  quantiteReservee: number;    // quantité réservée (demandes validées)
  minThreshold: number;        // seuil d'alerte
  avgPrice: number;            // PMP actuel
  imageUrl: string;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  consignable: boolean;
  lastUpdated: string;
  supplier?: string;
  warrantyMonths?: number;
  createdAt?: string;
  dateDerniereEntree?: string;
  dateDerniereSortie?: string;
  

  cumulEntree: number;
  cumulSortie: number;
  cumulValEntree: number;
  cumulValSortie: number;
}

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}