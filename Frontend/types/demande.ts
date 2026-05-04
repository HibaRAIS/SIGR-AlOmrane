export interface LigneDemande {
  produitId: number;
  quantite: number;
}

export interface CreerDemandeRequest {
  motif: string;
  priorite: string;
  lignes: LigneDemande[];
}

export interface LigneResponse {
  ligneId: number;
  produitId: number;
  produitDesignation: string;
  produitReference: string;
  quantiteDemandee: number;
  quantiteAccordee: number;
}

export interface DemandeResponse {
  id: number;
  numeroDemande: string;
  statut: string;
  priorite: string;
  motif: string;
  dateDemande: string;
  employeNom: string;
  structureNom: string;
  lignes: LigneResponse[];
  validePar: string | null;
  dateValidation: string | null;
  motifRefus: string | null;
  annotation: string | null;
}