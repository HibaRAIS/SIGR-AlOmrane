export type StatutStock = 'OK' | 'FAIBLE' | 'CRITIQUE' | 'RUPTURE';
export type StatutDemande = 'EN_ATTENTE' | 'VALIDEE' | 'EN_PREPARATION' | 'LIVREE' | 'ANNULEE' | 'REJETEE';
export type StatutCommande = 'EN_ATTENTE' | 'RECU_PARTIEL' | 'SOLDE' | 'ANNULE';
export type StatutBonSortie = 'BROUILLON' | 'EN_COURS' | 'VALIDE' | 'ANNULE';
export type TypeMouvement = 'ENTREE' | 'SORTIE' | 'AJUSTEMENT';
export type PrioriteDemande = 'NORMAL' | 'URGENT' | 'CRITIQUE';
export type StatutExercice = 'OUVERT' | 'CLOS';

export interface Categorie {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  parentId?: string;
  couleur?: string;
  icone?: string;
  createdAt: Date;
}

export interface Rayon {
  id: string;
  code: string;
  libelle: string;
  description?: string;
  superficie?: number;
  capacite?: number;
  createdAt: Date;
}

export interface Fournisseur {
  id: string;
  code: string;
  raisonSociale: string;
  ice: string;
  if?: string;
  rc?: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  pays: string;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Produit {
  id: string;
  codeArticle: string;
  designation: string;
  description?: string;
  categorieId: string;
  categorie?: Categorie;
  sousCategorieId?: string;
  rayonEmplacementId?: string;
  rayon?: Rayon;
  uniteMesure: string;
  nomenclatureDouane?: string;
  estConsignable: boolean;
  estTaxable: boolean;
  tauxTVA?: number;
  quantiteMin: number;
  quantiteMax: number;
  quantiteACommander: number;
  imageUrl?: string;
  stockDisponible: number;
  stockReserve: number;
  pmpActuel: number;
  fournisseurPrincipalId?: string;
  fournisseur?: Fournisseur;
  statutStock: StatutStock;
  createdAt: Date;
  updatedAt: Date;
}

export interface LigneDemande {
  id: string;
  demandeId: string;
  produitId: string;
  produit?: Produit;
  quantiteDemandee: number;
  quantiteValidee?: number;
  quantiteServie?: number;
  observation?: string;
}

export interface Demande {
  id: string;
  numero: string;
  demandeurId: string;
  demandeurNom: string;
  departement: string;
  valideurId?: string;
  valideurNom?: string;
  priorite: PrioriteDemande;
  statut: StatutDemande;
  observations?: string;
  dateCreation: Date;
  dateValidation?: Date;
  dateLivraison?: Date;
  lignes: LigneDemande[];
}

export interface LigneBonSortie {
  id: string;
  bonSortieId: string;
  produitId: string;
  produit?: Produit;
  quantiteDemandee: number;
  quantiteServie: number;
  pmpSnapshot: number;
  valeurHT: number;
}

export interface BonSortie {
  id: string;
  numero: string;
  demandeId?: string;
  demande?: Demande;
  statut: StatutBonSortie;
  departementBeneficiaire: string;
  signatureDemandeur?: string;
  signatureReceptionnaire?: string;
  signatureMagasinier?: string;
  signatureChefDept?: string;
  signatureDirecteur?: string;
  signatureChefHierarchique?: string;
  lignes: LigneBonSortie[];
  montantTotalHT: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface LigneCommande {
  id: string;
  commandeId: string;
  produitId: string;
  produit?: Produit;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  montantHT: number;
  montantTTC: number;
}

export interface CommandeFournisseur {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseur?: Fournisseur;
  marchePublicRef?: string;
  statut: StatutCommande;
  dateCommande: Date;
  dateLivraisonPrevue?: Date;
  lignes: LigneCommande[];
  montantTotalHT: number;
  montantTotalTTC: number;
  devise: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface LigneReception {
  id: string;
  receptionId: string;
  produitId: string;
  produit?: Produit;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  pmpAvant: number;
  pmpApres: number;
  fraisApproche?: number;
}

export interface Reception {
  id: string;
  numero: string;
  commandeId: string;
  commande?: CommandeFournisseur;
  dateReception: Date;
  lignes: LigneReception[];
  montantTotalHT: number;
  fraisApprocheTotaux?: number;
  validee: boolean;
  createdAt: Date;
  createdBy: string;
}

export interface JournalMouvement {
  id: string;
  date: Date;
  type: TypeMouvement;
  referenceDocument: string;
  produitId: string;
  produit?: Produit;
  quantite: number;
  stockApres: number;
  pmpSnapshot: number;
  valeurFlux: number;
  utilisateur: string;
  hash?: string;
  notes?: string;
}

export interface AlerteStock {
  id: string;
  produitId: string;
  produit?: Produit;
  type: 'CRITIQUE' | 'FAIBLE' | 'SURVEILLANCE';
  message: string;
  dateCreation: Date;
  traitee: boolean;
}

export interface KPIData {
  totalArticles: number;
  articlesRupture: number;
  demandesValidees: number;
  valeurTotaleStock: number;
  commandesEnAttente: number;
  alertesCritiques: number;
  mouvementsJour: number;
  fournisseursActifs: number;
}

export interface MouvementChart {
  date: string;
  entrees: number;
  sorties: number;
  ajustements: number;
}

export interface TopCategorie {
  categorie: string;
  valeur: number;
  articles: number;
}
