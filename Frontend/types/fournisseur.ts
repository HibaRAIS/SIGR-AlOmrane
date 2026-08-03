// types/fournisseur.ts

export interface Fournisseur {
  id: string;                  // Le backend retourne un nombre, mais nous le traitons comme une chaîne pour plus de flexibilité
  code: string;                // Généré par le backend
  raisonSociale: string;
  ice: string;
  identifiantFiscal?: string; // Correspond à "if" dans l'ancienne maquette
  registreCommerce?: string;  // Correspond à "rc"
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  pays: string;
  actif: boolean;
  createdAt: string;          // ISO 8601
  updatedAt: string;
}

// DTO pour la création (pas d'id, pas de code, createdAt/updatedAt gérés par le backend)
export interface CreateFournisseurDTO {
  raisonSociale: string;
  ice: string;
  identifiantFiscal?: string;
  registreCommerce?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  actif?: boolean;
}

// DTO pour la mise à jour (tous les champs optionnels)
export type UpdateFournisseurDTO = Partial<CreateFournisseurDTO>;