// types/reception.ts

export type StatutReception = 'CONFORME' | 'PARTIELLE' | 'COMPLEMENTAIRE';

export interface LigneReceptionDto {
  id: number;
  produitId?: number;
  codeArticle?: string;
  designation: string;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixUnitaireHT: number;
  tva: number;
  totalHT: number;
  totalTTC: number;
  pmpAvant?: number;
  pmpApres?: number;
  stockAvant?: number;
  stockApres?: number;
}

export interface DocumentJointDto {
  id: number;
  nom: string;
  url: string;       // ← la data URL (base64) complète
  type: string;
  dateAjout: string;  // ← ce champ doit exister dans le DTO backend
}

// Interface utilisée pour l'envoi de documents dans ReceptionCreateRequest
export interface DocumentJointRequest {
  nom: string;
  type: string;
  dataUrl: string;
}

export interface BonEntreeSignaturesDto {
 responsableMagasin?: { img: string; dateStr: string };
 chefLogistique?: { img: string; dateStr: string };
}


export interface BonEntreeSignaturesDto {
  responsableMagasinImg?: string;
  responsableMagasinDate?: string;
  chefLogistiqueImg?: string;
  chefLogistiqueDate?: string;
}

export interface ReceptionDto {
  id: number;
  numero: string;
  tranche: number;
  statut: StatutReception;
  dateReception: string;
  bonLivraison: string;
  numeroFacture: string;
  codeMarche: string;
  receptionnaire: string;
  commandeId: number;
  commande: { reference: string; fournisseur: { nom: string; ice?: string }; methode?: string };
  lignes: LigneReceptionDto[];
  notes: string;
  totalHT: number;
  totalTTC: number;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  reliquatLie?: string;
  reliquatSource?: string;
  documentsJoints?: DocumentJointDto[];
  bonEntreeSignatures?: BonEntreeSignaturesDto;
  bonEntreeGenere?: boolean;
  confirme?: boolean;
  confirmeAt?: string;
  confirmeBy?: string;
}

export interface ReceptionCreateRequest {
  commandeId: number;
  bonLivraison: string;
  numeroFacture?: string;
  codeMarche?: string;
  dateReception: string;
  notes?: string;
  reliquatSource?: string; // id du reliquat pour les réceptions complémentaires
  documents?: DocumentJointRequest[];
  lignes: {
    codeArticle?: string;
    designation: string;
    quantiteCommandee: number;
    quantiteRecue: number;
    prixUnitaireHT: number;
    tva: number;
  }[];
}

export interface ReliquatDto {
  id: string;
  commandeId: number;
  commandeReference: string;
  fournisseurNom: string;
  lignes: {
    produitId: number;
    designation: string;
    reference: string;
    quantiteInitiale: number;
    quantiteRestante: number;
    prixUnitaireHT: number;
    tva: number;
  }[];
  dateCreation: string;
  receptionSourceId: number;
  receptionSourceNumero: string;
  statut: 'EN_ATTENTE' | 'PARTIELLEMENT_TRAITE' | 'SOLDE';
}

export interface StatsReceptionsDto {
  total: number;
  CONFORME: number;
  PARTIELLE: number;
  COMPLEMENTAIRE: number;
  totalTTC: number;
  montantConforme: number;
  montantPartielle: number;
  reliquatsOuverts: number;
}