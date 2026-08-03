// ─── Demandes ─────────────────────────────────────────────────
export interface LigneResponse {
  ligneId: number;
  produitId: number;
  produitDesignation: string;
  produitReference: string;  // code article
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
  annotation: string | null;      // note du magasinier / responsable
}

// ─── Validation hiérarchique (pour affichage) ──────────────────
export interface ValidationInfo {
  etape: string;               // "Chef Hiérarchique", "Chef Département Logistique", "Directeur"
  valideParNom: string | null;
  dateValidation: string | null;
}

// ─── Détail enrichi d’une demande (avec stocks/PMP) ────────────
export interface LigneDetailResponse extends LigneResponse {
  stockDisponible: number;
  pmp: number;                 // prix moyen pondéré
  quantiteServie?: number;     // présente si la demande est en préparation ou livrée
  observationLigne?: string;   // observation par article (préparation)
}


// ─── Préparation & Bon de sortie ─────────────────────────────
export interface LigneSortieDetail {
  id: number;
  produitReference: string;
  produitDesignation: string;
  quantiteDemandee: number;
  quantiteAccordee: number;
  quantiteServie: number;
  observation: string;
}

export interface SignatureResponse {
  role: 'MAGASINIER' | 'DEMANDEUR' | 'RECEPTIONNAIRE';
  img?: string;      // base64
  dateStr?: string;  // ISO
}

export interface BonSortieDetailResponse {
  id: number;
  dateSortie: string;
  statut: string;
  observationsGlobales: string;
  signatures: SignatureResponse[];
  lignes: LigneSortieDetail[];
}

// ─── Requêtes ──────────────────────────────────────────────────
export interface LignePreparationRequest {
  ligneSortieId: number;
  quantiteServie: number;
  observation: string;
}

export interface PreparationRequest {
  lignes: LignePreparationRequest[];
  observationsGlobales: string;
}

export interface SignatureRequest {
role: 'MAGASINIER' | 'DEMANDEUR' | 'RECEPTIONNAIRE' | 'CHEF_DEPT' | 'DIRECTEUR';
  img?: string;
  dateStr?: string;
}

export interface LivraisonRequest {
  nomReceptionnaire?: string;
  signatures: SignatureRequest[];
}

export interface RefusResponsableRequest {
  motif: string;
}

// ─── Accusé ─────────────────────────────────────────────────────
export interface LignePreparationResponse {
  produitReference: string;
  produitDesignation: string;
  quantiteDemandee: number;
  quantiteAccordee: number;
  quantiteServie: number;
  observation: string;
}

export interface AccuseResponse {
  demandeId: number;
  demandeReference: string;
  employeNom: string;
  matriculeDemandeur: string;
  structureNom: string;
  statut: string;
  dateLivraison: string | null;
  scanAccuseDataUrl: string | null;
  lignes: LignePreparationResponse[];
  signatures: SignatureResponse[];
}

// ─── Stock / PMP ─────────────────────────────────────────────────
export interface ArticleStock {
  codeArticle: string;
  designation: string;
  quantiteDisponible: number;
  pmp: number;
}

export interface ValidationInfoResponse {
  etape: string;
  valideParNom: string | null;
  dateValidation: string | null;
}

export interface BonSortieInfoResponse {
  bonId: number;
  statut: string;
  dateSortie: string;
  lignesSortie: LigneSortieInfoResponse[];
}

export interface LigneSortieInfoResponse {
  ligneSortieId: number;
  produitReference: string;
  produitDesignation: string;
  quantiteAccordee: number;
  quantiteServie: number;
  observation: string;
}

// Dans DemandeDetailResponse, ajoutez ces champs :
export interface DemandeDetailResponse {
  id: number;
  numeroDemande: string;
  statut: string;
  priorite: string;
  motif: string;
  dateDemande: string;
  employeNom: string;
  structureNom: string;
  validePar: string | null;
  dateValidation: string | null;
  motifRefus: string | null;
  annotation: string | null;
  observationsPreparation?: string;
  lignes: LigneDetailResponse[];
  validations: ValidationInfoResponse[];
  bonSortie?: BonSortieInfoResponse;
  scanAccuseDataUrl?: string | null;
}

export interface DemandeResponseResponsable extends DemandeResponse {
  valideParId: number | null;
  valideParLogin: string | null;
}