import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


/**
 * Retourne l'URL absolue d'une image.
 *
 * - Si l'URL est déjà absolue (http...), on la retourne telle quelle.
 * - Si elle commence par "/uploads/", on la préfixe avec l'URL de l'API backend.
 * - Sinon (chemins locaux, /images/...), on laisse le chemin relatif pour que
 *   Next.js le serve depuis le dossier public.
 */
export function getImageUrl(url: string | undefined | null): string {
  if (!url) return '/placeholder.png';

  // URL déjà absolue → on n'y touche pas
  if (url.startsWith('http://') || url.startsWith('https://')) return url;

  // Fichier uploadé sur le backend → préfixer avec la base URL (sans /api)
  if (url.startsWith('/uploads/')) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8081';
    return `${base}${url}`;
  }

  // Autres chemins relatifs (ex: /images/... dans public) → inchangés
  return url;
}