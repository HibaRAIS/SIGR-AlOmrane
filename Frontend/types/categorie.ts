export interface CategorieArborescence {
  id: number;
  nom: string;
  sousCategories?: CategorieArborescence[];
}