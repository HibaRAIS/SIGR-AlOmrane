// types/mouvement.ts

export type MovementType = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';

export interface StockMovement {
  id: number;
  date: string;
  type: MovementType;
  quantity: number;
  reason: string;
  user: string;
  beforeStock: number;
  afterStock: number;
  unitPrice: number;
  supplierName?: string;
}