export interface Tva {
  id: number;
  code: string;
  libelle: string;
  taux: number;
  dateDebutValidite: string;
  dateFinValidite: string | null;
  actif: boolean; 
}