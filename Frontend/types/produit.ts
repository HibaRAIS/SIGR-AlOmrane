export interface Produit {
  id: number;
  codeArticle: string;
  designation: string;
  description: string;
  uniteMesure: string;
  categorieId?: number;
  imageUrl?: string;
  poidsUnitaire?: number;
  dimensions?: string;
  materiau?: string;
  instructionsSecurite?: string;
}