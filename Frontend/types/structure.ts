// types/structure.ts
export type TypeStructure = "DIRECTION" | "DEPARTEMENT" | "DIVISION" | "UGP" | "AGENCE";

export interface StructureFlatDto {
  id: number;
  nom: string;
  codeAnalytique: string;
  type: TypeStructure;
  site?: string;
  parentId?: number | null;
}

export interface EmployeFlatDto {
  id: number;
  nom: string;
  prenom: string;
  emailProfessionnel: string;
  telephone: string;
  grade: string;
  structureId: number;
}

export interface CreateStructureRequest {
  nom: string;
  codeAnalytique: string;
  type: TypeStructure;
  site?: string;
  parentId?: number | null;
}