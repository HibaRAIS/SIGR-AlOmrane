"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  Package,
  Edit,
  Trash2,
  Search,
  Layers,
  Loader2,
  AlertCircle,
  Check,
  ChevronsUpDown,
  FolderOpen
} from "lucide-react";
import { categorieService } from "@/services/categorie.service";
import type { CategorieArborescence } from "@/types/categorie";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// Types étendus
// ------------------------------------------------------------------
interface CategorieNode extends CategorieArborescence {
  nombreArticles: number;
  parentId: number | null;
  children?: CategorieNode[];
}

// ------------------------------------------------------------------
// Utilitaires arbre
// ------------------------------------------------------------------
function collectAllIds(node: CategorieNode): number[] {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach((child) => ids.push(...collectAllIds(child)));
  }
  return ids;
}

function findNodeById(nodes: CategorieNode[], id: number): CategorieNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function computeTotalArticles(nodes: CategorieNode[]): void {
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      computeTotalArticles(node.children);
      node.nombreArticles =
        (node.nombreArticles || 0) +
        node.children.reduce((sum, child) => sum + (child.nombreArticles || 0), 0);
    }
  });
}

// ------------------------------------------------------------------
// Filtres
// ------------------------------------------------------------------
function filterTreeByTerm(categories: CategorieNode[], term: string): CategorieNode[] {
  if (!term.trim()) return categories;
  const lower = term.toLowerCase();
  return categories.reduce<CategorieNode[]>((acc, cat) => {
    const matches = cat.nom.toLowerCase().includes(lower);
    const filteredChildren = cat.children ? filterTreeByTerm(cat.children, term) : undefined;
    if (matches || (filteredChildren && filteredChildren.length > 0)) {
      acc.push({ ...cat, children: filteredChildren ?? cat.children });
    }
    return acc;
  }, []);
}

function filterTreeByParent(categories: CategorieNode[], parentId: number | null): CategorieNode[] {
  if (parentId === null) return categories;
  const found = findNodeById(categories, parentId);
  return found ? [found] : [];
}

function mapToNode(raw: any): CategorieNode {
  return {
    ...raw,
    nombreArticles: raw.nombreArticles ?? 0,
    parentId: raw.parentId ?? null,
    children: raw.sousCategories ? raw.sousCategories.map(mapToNode) : [],
  };
}

function flattenHierarchy(
  nodes: CategorieNode[],
  level = 0
): { id: number; label: string; value: string }[] {
  const result: { id: number; label: string; value: string }[] = [];
  const prefix = " ".repeat(level);
  nodes.forEach((node) => {
    result.push({ id: node.id, label: `${prefix}${node.nom}`, value: node.id.toString() });
    if (node.children) {
      result.push(...flattenHierarchy(node.children, level + 1));
    }
  });
  return result;
}

// ------------------------------------------------------------------
// Composant principal
// ------------------------------------------------------------------
export default function CategoriesPage() {
  // ----- États -----
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<CategorieNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const [selectedParentFilter, setSelectedParentFilter] = useState<number | null>(null);

  // Dialog Ajout / Ajout sous-catégorie
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ nom: "", parentId: "" });
  const [preSelectedParentId, setPreSelectedParentId] = useState<number | null>(null);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);

  // Dialog Suppression unitaire
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategorieNode | null>(null);

  // Dialog Suppression multiple
  const [isDeleteMultipleDialogOpen, setIsDeleteMultipleDialogOpen] = useState(false);

  // Dialog Renommage
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<CategorieNode | null>(null);
  const [newName, setNewName] = useState("");

  // Sélection multiple (IDs)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filtre ComboBox
  const [filterComboOpen, setFilterComboOpen] = useState(false);

  // ----- Chargement initial -----
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categorieService.getArborescence();
      const mapped: CategorieNode[] = data.map(mapToNode);
      computeTotalArticles(mapped);
      setCategories(mapped);
      setExpandedItems(new Set(mapped.map((c) => c.id)));
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
      setError(err instanceof Error ? err.message : "Impossible de charger l'arborescence.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ----- Helpers arbre -----
  const toggleExpand = useCallback((id: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<number>();
    const walk = (nodes: CategorieNode[]) => {
      nodes.forEach((n) => {
        allIds.add(n.id);
        if (n.children) walk(n.children);
      });
    };
    walk(categories);
    setExpandedItems(allIds);
  }, [categories]);

  const collapseAll = useCallback(() => {
    setExpandedItems(new Set());
  }, []);

  // Filtrage combiné
  const filteredByTerm = useMemo(
    () => filterTreeByTerm(categories, searchTerm),
    [categories, searchTerm]
  );
  const filteredCategories = useMemo(
    () => filterTreeByParent(filteredByTerm, selectedParentFilter),
    [filteredByTerm, selectedParentFilter]
  );

  useEffect(() => {
    if (selectedParentFilter !== null && filteredCategories.length === 1) {
      const ids = collectAllIds(filteredCategories[0]);
      setExpandedItems(new Set(ids));
    }
  }, [selectedParentFilter, filteredCategories]);

  // Stats
  const stats = useMemo(() => {
    let totalSub = 0;
    let totalArticles = 0;
    const totalMain = categories.length;
    const walk = (nodes: CategorieNode[]) => {
      nodes.forEach((n) => {
        totalArticles += n.nombreArticles;
        if (n.children) {
          totalSub += n.children.length;
          walk(n.children);
        }
      });
    };
    walk(categories);
    return { totalMain, totalSub, totalArticles };
  }, [categories]);

  // ----- Sélection multiple (récursive) -----
  const toggleSelectionRecursive = useCallback(
    (id: number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        const node = findNodeById(categories, id);
        if (!node) return prev;

        const allIds = collectAllIds(node);
        if (next.has(id)) {
          allIds.forEach((id) => next.delete(id));
        } else {
          allIds.forEach((id) => next.add(id));
        }
        return next;
      });
    },
    [categories]
  );

  const toggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allVisibleIds = new Set<number>();
        const walk = (nodes: CategorieNode[]) => {
          nodes.forEach((n) => {
            allVisibleIds.add(n.id);
            if (n.children) walk(n.children);
          });
        };
        walk(filteredCategories);
        setSelectedIds(allVisibleIds);
      } else {
        setSelectedIds(new Set());
      }
    },
    [filteredCategories]
  );

  // ----- CRUD -----
  const handleAddCategory = async () => {
    if (!newCategory.nom.trim()) return;
    try {
      const parentId = preSelectedParentId ?? parseParentId(newCategory.parentId);
      await categorieService.createCategory({
        nom: newCategory.nom.trim(),
        parentId,
      });
      setIsAddDialogOpen(false);
      setNewCategory({ nom: "", parentId: "" });
      setPreSelectedParentId(null);
      await fetchCategories();
      toast.success("Catégorie créée avec succès");
    } catch (err: any) {
      console.error("Erreur ajout:", err);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Erreur lors de la création"
      );
    }
  };

  const openAddDialog = (parentId?: number) => {
    setNewCategory({ nom: "", parentId: parentId ? parentId.toString() : "" });
    setPreSelectedParentId(parentId ?? null);
    setIsAddDialogOpen(true);
  };

  const preSelectedParentName = useMemo(() => {
    if (preSelectedParentId === null) return null;
    const node = findNodeById(categories, preSelectedParentId);
    return node ? node.nom : null;
  }, [preSelectedParentId, categories]);

  const openDeleteDialog = (cat: CategorieNode) => {
    setDeleteTarget(cat);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    try {
      await categorieService.deleteCategory(deleteTarget.id);
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
      await fetchCategories();
      toast.success("Catégorie supprimée");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
    } catch (err: any) {
      console.error("Erreur suppression:", err);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Erreur lors de la suppression"
      );
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleteMultipleDialogOpen(true);
  };

  // ----- CORRECTION EXPERTE DE LA SUPPRESSION MULTIPLE -----
  const confirmDeleteSelected = async () => {
    try {
      // 1. Fonction pour vérifier si un parent de la catégorie est aussi dans la sélection
      const hasSelectedAncestor = (id: number): boolean => {
        let current = findNodeById(categories, id);
        while (current && current.parentId !== null) {
          if (selectedIds.has(current.parentId)) return true;
          current = findNodeById(categories, current.parentId);
        }
        return false;
      };

      // 2. Filtrer pour ne garder que les catégories de "plus haut niveau" de la sélection.
      // Cela évite d'envoyer un DELETE pour un enfant qui sera supprimé en cascade par son parent.
      const topLevelIdsToDelete = Array.from(selectedIds).filter(id => !hasSelectedAncestor(id));

      // 3. Exécuter les suppressions
      for (const id of topLevelIdsToDelete) {
        try {
          await categorieService.deleteCategory(id);
        } catch (err) {
          // On attrape l'erreur individuellement pour ne pas stopper la boucle
          // ex: si elle a déjà été supprimée ou s'il y a un conflit mineur
          console.warn(`Erreur ignorée sur la suppression de la catégorie ${id}:`, err);
        }
      }

      setSelectedIds(new Set());
      setIsDeleteMultipleDialogOpen(false);
      await fetchCategories();
      toast.success("Catégories supprimées avec succès");
    } catch (err: any) {
      console.error("Erreur suppression multiple:", err);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Erreur lors de la suppression"
      );
    }
  };

  const openRenameDialog = (cat: CategorieNode) => {
    setRenameTarget(cat);
    setNewName(cat.nom);
    setIsRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!renameTarget || !newName.trim()) return;
    try {
      await categorieService.updateCategory(renameTarget.id, { nom: newName.trim() });
      setIsRenameDialogOpen(false);
      setRenameTarget(null);
      setNewName("");
      await fetchCategories();
      toast.success("Catégorie renommée");
    } catch (err: any) {
      console.error("Erreur renommage:", err);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Erreur lors du renommage"
      );
    }
  };

  function parseParentId(raw: string | undefined | null): number | null {
    if (!raw || raw === "root" || raw.trim() === "") return null;
    const num = Number(raw);
    return isNaN(num) ? null : num;
  }

  // Liste complète aplatie avec indentation (pour les ComboBox)
  const flatList = useMemo(() => flattenHierarchy(categories), [categories]);

  // ----- Rendu -----
  return (
    <SidebarProvider>
      <SidebarInset>
        <main className="flex-1 space-y-6 p-6 min-h-screen bg-gray-50/30">
          
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Catégories & Sous‑catégories</h1>
              <p className="text-sm text-gray-500">
                Arborescence hiérarchique du catalogue produits
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:text-red-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer ({selectedIds.size})
                </button>
              )}
              <button
                onClick={() => openAddDialog()}
                className="flex items-center gap-2 bg-[#1D6F42] text-white hover:bg-[#155430] hover:text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Catégorie
              </button>
            </div>
          </div>

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Principales */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#E3F2FD]">
                  <Folder className="w-6 h-6 text-[#1565C0]" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.totalMain}</div>
                <div className="text-sm font-medium text-gray-600">Catégories Principales</div>
                <div className="text-[11px] text-gray-400 mt-1">Catégories de niveau 1</div>
              </div>
            </div>
            {/* Sous-catégories */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FFF3E0]">
                  <Layers className="w-6 h-6 text-[#E65100]" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.totalSub}</div>
                <div className="text-sm font-medium text-gray-600">Sous‑catégories</div>
                <div className="text-[11px] text-gray-400 mt-1">Catégories de niveau 2+</div>
              </div>
            </div>
            {/* Total */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#E8F5E9]">
                  <Package className="w-6 h-6 text-[#1D6F42]" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.totalArticles}</div>
                <div className="text-sm font-medium text-gray-600">Total Articles</div>
                <div className="text-[11px] text-gray-400 mt-1">Articles classifiés</div>
              </div>
            </div>
          </div>

          {/* Filtres + Arbre */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            {/* En-tête de l'arbre */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#1565C0]" />
                  Arborescence des Catégories
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Cliquez sur une catégorie pour voir ses sous‑catégories.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9 h-9 text-sm border-gray-200 rounded-xl focus-visible:ring-[#1D6F42]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Filtre avec ComboBox */}
                <Popover open={filterComboOpen} onOpenChange={setFilterComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={filterComboOpen}
                      className="w-full sm:w-56 justify-between h-9 text-sm font-normal text-gray-600 border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900"
                    >
                      <span className="truncate">
                        {selectedParentFilter === null
                          ? "Toutes les catégories"
                          : flatList.find((item) => item.value === selectedParentFilter.toString())?.label ?? "Sélectionner..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 rounded-xl border-gray-200">
                    <Command>
                      <CommandInput placeholder="Rechercher une catégorie..." className="text-sm" />
                      <CommandList>
                        <CommandEmpty className="text-sm text-gray-500 py-4 text-center">
                          Aucun résultat.
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__all__"
                            className="text-sm cursor-pointer"
                            onSelect={() => {
                              setSelectedParentFilter(null);
                              setFilterComboOpen(false);
                            }}
                          >
                            Toutes les catégories
                          </CommandItem>
                          {flatList.map((item) => (
                            <CommandItem
                              key={item.value}
                              value={item.value}
                              keywords={[item.label]}
                              className="text-sm cursor-pointer"
                              onSelect={() => {
                                setSelectedParentFilter(Number(item.value));
                                setFilterComboOpen(false);
                              }}
                            >
                              {item.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={expandAll} className="h-9 text-xs text-gray-600 border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900">
                    Tout déplier
                  </Button>
                  <Button variant="outline" size="sm" onClick={collapseAll} className="h-9 text-xs text-gray-600 border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900">
                    Tout replier
                  </Button>
                </div>
              </div>
            </div>

            {/* Sélection multiple Banner */}
            <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
              <Checkbox
                id="selectAll"
                checked={
                  selectedIds.size > 0 &&
                  filteredCategories.length > 0 &&
                  (() => {
                    const allVisibleIds = new Set<number>();
                    const walk = (nodes: CategorieNode[]) => {
                      nodes.forEach((n) => {
                        allVisibleIds.add(n.id);
                        if (n.children) walk(n.children);
                      });
                    };
                    walk(filteredCategories);
                    return selectedIds.size === allVisibleIds.size;
                  })()
                }
                onCheckedChange={(checked) => toggleSelectAll(checked === true)}
              />
              <label htmlFor="selectAll" className="text-sm font-medium text-gray-600 cursor-pointer">
                Sélectionner tout
              </label>
            </div>

            {/* Contenu de l'arbre */}
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1D6F42]" />
                  <span className="ml-3 text-sm font-medium text-gray-500">
                    Chargement de l&apos;arborescence…
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-3">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-medium">{error}</p>
                  <Button variant="outline" onClick={fetchCategories} className="mt-2 rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900">
                    Réessayer
                  </Button>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="py-16 text-center text-sm font-medium text-gray-500">
                  Aucune catégorie trouvée.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filteredCategories.map((category) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      expandedItems={expandedItems}
                      toggleExpand={toggleExpand}
                      onDelete={openDeleteDialog}
                      onRename={openRenameDialog}
                      onAddSub={openAddDialog}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelectionRecursive}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info Structure */}
          <div className="bg-[#E3F2FD] border-2 border-[#90CAF9] rounded-2xl p-6">
            <h3 className="font-bold text-[#0D47A1] mb-2">Structure Hiérarchique</h3>
            <div className="text-xs text-[#1565C0] space-y-1.5 leading-relaxed">
              <p>• Les catégories peuvent contenir des sous-catégories sur plusieurs niveaux (arborescence récursive).</p>
              <p>• Chaque article doit être rattaché à une catégorie pour faciliter la recherche et le reporting.</p>
              <p>• La suppression d&apos;une catégorie parent nécessite de réaffecter ou supprimer ses enfants.</p>
            </div>
          </div>

          {/* Dialog Ajout / Sous-catégorie */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-bold">
                  {preSelectedParentId ? "Ajouter une sous‑catégorie" : "Ajouter une catégorie"}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm">
                  {preSelectedParentId
                    ? `Cette catégorie sera rattachée à « ${preSelectedParentName} ».`
                    : "Créez une nouvelle catégorie ou sous‑catégorie. Utilisez la recherche pour trouver un parent."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-gray-700">Nom</label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    placeholder="Nom de la catégorie"
                    value={newCategory.nom}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, nom: e.target.value })
                    }
                  />
                </div>
                {!preSelectedParentId && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium text-gray-700">Parent</label>
                    <div className="col-span-3">
                      <Popover open={parentSearchOpen} onOpenChange={setParentSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={parentSearchOpen}
                            className="w-full justify-between rounded-xl border-gray-200 text-gray-600 font-normal hover:bg-gray-100 hover:text-gray-900"
                          >
                            <span className="truncate text-left w-full">
                                {newCategory.parentId
                                  ? flatList.find((item) => item.value === newCategory.parentId)?.label ?? "Sélectionner..."
                                  : "Aucun (catégorie racine)"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-xl border-gray-200">
                          <Command>
                            <CommandInput placeholder="Rechercher une catégorie..." className="text-sm" />
                            <CommandList>
                              <CommandEmpty className="text-sm text-gray-500 py-4 text-center">Aucun résultat.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="__none__"
                                  className="text-sm cursor-pointer"
                                  onSelect={() => {
                                    setNewCategory({ ...newCategory, parentId: "" });
                                    setParentSearchOpen(false);
                                  }}
                                >
                                  Aucun (catégorie racine)
                                </CommandItem>
                                {flatList.map((item) => (
                                  <CommandItem
                                    key={item.value}
                                    value={item.value}
                                    keywords={[item.label]}
                                    className="text-sm cursor-pointer"
                                    onSelect={() => {
                                      setNewCategory({ ...newCategory, parentId: item.value });
                                      setParentSearchOpen(false);
                                    }}
                                  >
                                    {item.label}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="col-span-4 text-xs text-gray-400 text-right mt-1">
                      Par défaut : catégorie racine.
                    </p>
                  </div>
                )}
                {preSelectedParentId && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    Parent : <strong className="text-gray-900">{preSelectedParentName}</strong>
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsAddDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430] hover:text-white" onClick={handleAddCategory} disabled={!newCategory.nom.trim()}>
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Suppression unitaire */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl border-red-100">
              <DialogHeader>
                <DialogTitle className="text-red-600 font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Confirmer la suppression
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Voulez‑vous vraiment supprimer la catégorie <strong className="text-gray-900">{deleteTarget?.nom}</strong> ?
                  <br /><br />
                  <span className="text-red-500/80 text-xs font-medium">Cette action supprimera également toutes ses sous‑catégories et produits associés.</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsDeleteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="rounded-xl bg-red-600 text-white hover:bg-red-700 hover:text-white" onClick={handleDeleteSingle}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Suppression multiple */}
          <Dialog open={isDeleteMultipleDialogOpen} onOpenChange={setIsDeleteMultipleDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl border-red-100">
              <DialogHeader>
                <DialogTitle className="text-red-600 font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Suppression multiple
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Vous êtes sur le point de supprimer définitivement <strong className="text-gray-900">{selectedIds.size} catégorie(s)</strong>.
                  <br /><br />
                  <span className="text-red-500/80 text-xs font-medium">Cette action supprimera également toutes leurs sous‑catégories et produits associés.</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsDeleteMultipleDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="rounded-xl bg-red-600 text-white hover:bg-red-700 hover:text-white" onClick={confirmDeleteSelected}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer tout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Renommage */}
          <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-bold">Renommer la catégorie</DialogTitle>
                <DialogDescription className="text-gray-500 text-sm">
                  Modifiez le nom de <strong className="text-gray-900">{renameTarget?.nom}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nouveau nom"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsRenameDialogOpen(false)}>
                  Annuler
                </Button>
                <Button className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430] hover:text-white" onClick={handleRename} disabled={!newName.trim()}>
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ------------------------------------------------------------------
// CategoryItem
// ------------------------------------------------------------------
function CategoryItem({
  category,
  level = 0,
  expandedItems,
  toggleExpand,
  onDelete,
  onRename,
  onAddSub,
  selectedIds,
  onToggleSelect,
}: {
  category: CategorieNode;
  level?: number;
  expandedItems: Set<number>;
  toggleExpand: (id: number) => void;
  onDelete: (cat: CategorieNode) => void;
  onRename: (cat: CategorieNode) => void;
  onAddSub: (parentId: number) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
}) {
  const isExpanded = expandedItems.has(category.id);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedIds.has(category.id);

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between py-3 pr-6 transition-colors group cursor-pointer border-b border-gray-50 last:border-0",
          level === 0 ? "bg-white hover:bg-gray-50/60" : "hover:bg-gray-50/80"
        )}
        style={{ paddingLeft: `${(level * 24) + 24}px` }}
        onClick={() => hasChildren && toggleExpand(category.id)}
      >
        <div className="flex items-center gap-3">
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(category.id)}
            />
          </div>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )
            ) : (
              <div className="w-4" />
            )}
            {hasChildren ? (
              <div className="w-8 h-8 rounded-xl bg-[#E3F2FD] flex items-center justify-center flex-shrink-0">
                  {isExpanded ? (
                     <FolderOpen className="h-4 w-4 text-[#1565C0]" />
                  ) : (
                     <Folder className="h-4 w-4 text-[#1565C0]" />
                  )}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-[#1D6F42]" />
              </div>
            )}
          </div>
          <span className={cn("truncate min-w-0 flex-1", level === 0 ? "text-sm font-semibold text-gray-900" : "text-sm font-medium text-gray-700")}>
            {category.nom}
          </span>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
            <Package className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-600">{category.nombreArticles}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1.5 text-gray-400 hover:text-[#1D6F42] hover:bg-[#E8F5E9] rounded-lg transition-colors"
              onClick={(e) => { e.stopPropagation(); onAddSub(category.id); }}
              title="Ajouter une sous-catégorie"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              className="p-1.5 text-gray-400 hover:text-[#E65100] hover:bg-[#FFF3E0] rounded-lg transition-colors"
              onClick={(e) => { e.stopPropagation(); onRename(category); }}
              title="Renommer"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(category); }}
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {hasChildren && isExpanded && (
        <div className="border-t border-gray-50">
          {category.children!.map((child) => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              onDelete={onDelete}
              onRename={onRename}
              onAddSub={onAddSub}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}