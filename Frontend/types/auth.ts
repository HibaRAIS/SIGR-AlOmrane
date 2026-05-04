export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  nom: string;
  loginLdap: string;
}