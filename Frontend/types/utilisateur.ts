export type RoleUtilisateur = "ADMIN_SI" | "CHEF_SERVICE" | "EMPLOYE" | "RESPONSABLE_LOGISTIQUE";

export interface UtilisateurDto {
  id: number;
  loginLdap: string;
  actif: boolean;
  role: RoleUtilisateur;
  employeId: number;
  employeNom: string;
  department: string;
  derniereConnexion: string;
  createdAt: string;
  phone?: string;
}

export interface CreateUtilisateurRequest {
  loginLdap: string;
  actif: boolean;
  role: RoleUtilisateur;
  employeId: number;
}