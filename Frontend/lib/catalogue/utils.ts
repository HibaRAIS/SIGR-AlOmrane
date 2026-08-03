// lib/catalogue/utils.ts

/** Formate un nombre avec 2 décimales, selon la locale française (Maroc). */
export const fmtNumber = (n: number): string =>
  new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

/** Formate un nombre entier (sans décimales). */
export const fmtInt = (n: number): string =>
  new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

/** Formate une date ISO en chaîne courte (jj/mm/aaaa). */
export const fmtDate = (s?: string): string =>
  s ? new Date(s).toLocaleDateString('fr-FR') : '—';

/** Convertit un objet Date en chaîne ISO (YYYY-MM-DD). */
export const toYMD = (d: Date): string => d.toISOString().split('T')[0];