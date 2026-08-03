// types/employe.ts
export interface EmployeDto {
  id: number;
  matricule: string;
  badge: string;
  nom: string;
  prenom: string;
  emailProfessionnel: string;
  telephone: string;
  grade: string;
  structureNom: string;
  structureCode: string;
  structureId: number | null;
  managerNom: string;
  managerId: number | null;
  dateEmbauche: string;
  actif: boolean;
}

export interface CreateEmployeRequest {
  matricule: string;
  badge?: string;
  nom: string;
  prenom: string;
  emailProfessionnel: string;
  telephone?: string;
  grade: string;
  structureId?: number | null;
  managerId?: number | null;
  dateEmbauche?: string;
}