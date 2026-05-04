import { CategorieArborescence } from "@/services/categorie.service";

export interface CategoryNode {
  id: number;
  name: string;
  parentId: number | null;
  children: CategoryNode[];
}

export interface CategoryInfo {
  id: number;
  name: string;
  parentId: number | null;
  parentName: string | null;      // top‑level ancestor name
  fullPath: string;               // e.g. "Fournitures de bureau > Stylos"
}

/**
 * Build a tree and also return a flat map of category id → CategoryInfo
 */
export const buildCategoryHierarchy = (
  categories: CategorieArborescence[],
): { tree: CategoryNode[]; map: Map<number, CategoryInfo> } => {
  const map = new Map<number, CategoryInfo>();
  const idToNode = new Map<number, CategoryNode>();

  // First pass: create nodes
  const createNode = (cat: CategorieArborescence, parentId: number | null): CategoryNode => {
    const node: CategoryNode = {
      id: cat.id,
      name: cat.nom,
      parentId,
      children: [],
    };
    idToNode.set(cat.id, node);
    if (cat.sousCategories) {
      cat.sousCategories.forEach(sub => {
        const childNode = createNode(sub, cat.id);
        node.children.push(childNode);
      });
    }
    return node;
  };

  const tree: CategoryNode[] = [];
  for (const cat of categories) {
    const node = createNode(cat, null);
    tree.push(node);
  }

  // Second pass: build flat map with parent names and full path
  const getParentName = (id: number): string | null => {
    const node = idToNode.get(id);
    if (!node || node.parentId === null) return null;
    const parentNode = idToNode.get(node.parentId);
    return parentNode ? parentNode.name : null;
  };

  const getFullPath = (id: number, currentPath: string = ""): string => {
    const node = idToNode.get(id);
    if (!node) return currentPath;
    const newPath = currentPath ? `${node.name} > ${currentPath}` : node.name;
    if (node.parentId === null) return newPath;
    return getFullPath(node.parentId, newPath);
  };

  for (const [id, node] of idToNode) {
    const parentName = getParentName(id);
    const fullPath = getFullPath(id);
    map.set(id, {
      id,
      name: node.name,
      parentId: node.parentId,
      parentName: parentName || null,
      fullPath,
    });
  }

  return { tree, map };
};

/**
 * Get all top‑level categories (parentId === null)
 */
export const getRootCategories = (map: Map<number, CategoryInfo>): CategoryInfo[] => {
  return Array.from(map.values()).filter(cat => cat.parentId === null);
};

/**
 * Get direct sub‑categories of a given parent category id
 */
export const getSubCategories = (parentId: number, map: Map<number, CategoryInfo>): CategoryInfo[] => {
  return Array.from(map.values()).filter(cat => cat.parentId === parentId);
};