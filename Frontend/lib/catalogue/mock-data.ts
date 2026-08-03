// lib/catalogue/mock-data.ts

/**
 * Génère un code article unique (ex : PRD-123456).
 * Utilisée pour l'import lorsqu'aucun code n'est fourni.
 */
export const generateProductCode = (): string =>
  `PRD-${Math.floor(100000 + Math.random() * 900000)}`;

/**
 * Retourne une URL d'image aléatoire (placeholder).
 */
export const getRandomImage = (seed: number): string =>
  `https://picsum.photos/seed/${seed}/200/200`;