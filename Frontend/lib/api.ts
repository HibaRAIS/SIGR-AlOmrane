import axios from 'axios';
import { toast } from 'sonner'; // ← ajouter cet import

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur de requête : ajoute le token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse : gère les erreurs 401 et affiche les autres
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message;
      toast.error(`Erreur ${error.response?.status || ''}: ${message}`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;