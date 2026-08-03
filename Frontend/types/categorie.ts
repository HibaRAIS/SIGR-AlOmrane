
export interface CategorieArborescence {
  id: number;
  nom: string;
  parentId?: number | null;
  nombreArticles?: number;
  sousCategories?: CategorieArborescence[];
}