/**
 * Statut du stock d'un produit.
 * - `ok`      : stock > seuil min
 * - `faible`  : stock ≤ seuil min et > 0
 * - `critique`: stock ≤ 0
 */
export type StockStatus = 'ok' | 'faible' | 'critique';

/** Colonnes triables dans le catalogue */
export type SortColumn = 'designation' | 'category' | 'location' | 'stock' | 'pmp' | 'status' | 'supplier';

/** Sens du tri */
export type SortDirection = 'asc' | 'desc';

/** Mode d'affichage : tableau ou grille */
export type ViewMode = 'table' | 'grid';

/** Filtre rapide par statut de stock */
export type StockFilter = 'all' | StockStatus;

/** Panneau actif (catalogue ou analyse) */
export type ActivePanel = 'catalogue' | 'analyse';

/** Types de mouvements de stock */
export type MovementType = 'entree' | 'sortie' | 'ajustement' | 'inventaire';

/** Score de rotation des stocks */
export type RotationScore = 'rapide' | 'normale' | 'lente';

/**
 * Représente un mouvement de stock (entrée, sortie, ajustement ou inventaire).
 */
export interface StockMovement {
  id: number;
  date: string;               // ISO date
  type: MovementType;
  quantity: number;           // toujours positive
  reason: string;
  user: string;
  beforeStock: number;
  afterStock: number;
  unitPrice: number;
  supplierName?: string;      // présent uniquement pour les entrées
}

/**
 * Produit du catalogue.
 */
export interface Product {
  id: number;
  code: string;               // référence unique
  name: string;
  category: string;
  subcategory: string;        // chemin hiérarchique
  location: string;
  currentStock: number;
  minThreshold: number;       // seuil d'alerte
  avgPrice: number;           // prix unitaire moyen (TTC)
  imageUrl: string;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  consignable: boolean;
  lastUpdated: string;        // ISO date
  supplier?: string;
  warrantyMonths?: number;
  createdAt?: string;         // ISO date
  movements?: StockMovement[];
}

/**
 * Nœud de l'arbre hiérarchique des catégories (utilisé pour les sélecteurs).
 */
export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
}