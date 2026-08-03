"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  ShoppingCart,
  Package,
  Grid3X3,
  List,
  Filter,
  Plus,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Pen,
  FileText,
  FolderOpen,
  Paperclip,
  StickyNote,
  Monitor,
  Mouse,
  Cable,
  HardDrive,
  Headphones,
  Printer,
  Palette,
  FileBox,
  Armchair,
  SprayCan,
  Ruler,
  Weight,
  Factory,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { produitService } from "@/services/produit.service";
import { Produit } from "@/types/produit";
import { categorieService} from "@/services/categorie.service";
import {  CategorieArborescence } from "@/types/categorie";
import { getImageUrl } from "@/lib/utils";   // ← AJOUT pour résoudre les images

// ============================================================
//                   ICÔNES ET COULEURS
// ============================================================

const getCategoryIcon = (nom: string) => {
  const lower = nom.toLowerCase();
  if (lower.includes("fournitures de bureau")) return <Pen className="w-4 h-4" />;
  if (lower.includes("informatique")) return <Monitor className="w-4 h-4" />;
  if (lower.includes("consommables")) return <Printer className="w-4 h-4" />;
  if (lower.includes("mobilier")) return <Armchair className="w-4 h-4" />;
  if (lower.includes("hygiène")) return <SprayCan className="w-4 h-4" />;
  return <Package className="w-4 h-4" />;
};

const getSubCategoryIcon = (nom: string) => {
  const lower = nom.toLowerCase();
  if (lower.includes("stylo") || lower.includes("crayon")) return <Pen className="w-3 h-3" />;
  if (lower.includes("papier")) return <FileText className="w-3 h-3" />;
  if (lower.includes("classeur") || lower.includes("archivage")) return <FolderOpen className="w-3 h-3" />;
  if (lower.includes("agrafe")) return <Paperclip className="w-3 h-3" />;
  if (lower.includes("adhésif") || lower.includes("colle")) return <StickyNote className="w-3 h-3" />;
  if (lower.includes("périphérique")) return <Mouse className="w-3 h-3" />;
  if (lower.includes("câble")) return <Cable className="w-3 h-3" />;
  if (lower.includes("stockage")) return <HardDrive className="w-3 h-3" />;
  if (lower.includes("accessoire")) return <Headphones className="w-3 h-3" />;
  if (lower.includes("cartouche")) return <Palette className="w-3 h-3" />;
  if (lower.includes("toner")) return <FileBox className="w-3 h-3" />;
  return <Package className="w-3 h-3" />;
};

const getCategoryColor = (nom: string) => {
  const lower = nom.toLowerCase();
  if (lower.includes("bureau")) return "text-[#1D6F42]";
  if (lower.includes("informatique")) return "text-blue-600";
  if (lower.includes("impression")) return "text-[#E31837]";
  if (lower.includes("mobilier")) return "text-amber-600";
  if (lower.includes("hygiène") || lower.includes("entretien")) return "text-cyan-600";
  return "text-gray-600";
};

// ============================================================
//                   TRANSFORMATION ARBORESCENCE
// ============================================================

const buildFrontCategories = (backendCategories: CategorieArborescence[]): any[] => {
  return backendCategories.map(cat => ({
    id: String(cat.id),
    name: cat.nom,
    icon: getCategoryIcon(cat.nom),
    color: getCategoryColor(cat.nom),
    subCategories: (cat.sousCategories || []).map(sub => ({
      id: String(sub.id),
      name: sub.nom,
      icon: getSubCategoryIcon(sub.nom),
    })),
  }));
};

const getAllSubCategoryIds = (categories: any[], rootId: string): number[] => {
  const root = categories.find(c => c.id === rootId);
  if (!root) return [];
  const ids: number[] = [];
  const collect = (cats: any[]) => {
    for (const cat of cats) {
      ids.push(parseInt(cat.id));
      if (cat.subCategories && cat.subCategories.length) collect(cat.subCategories);
    }
  };
  collect(root.subCategories);
  return ids;
};

export default function CataloguePage() {
  const { items, addItem, removeItem, totalItems } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const isInCart = (id: number) => items.some(item => item.id === id);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [produitsData, categoriesData] = await Promise.all([
          produitService.getCatalogue(),
          categorieService.getArborescence(),
        ]);
        setProduits(produitsData);
        const frontCats = buildFrontCategories(categoriesData);
        setCategories(frontCats);
        if (frontCats.length > 0 && expandedCategories.length === 0) {
          setExpandedCategories([frontCats[0].id]);
        }
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger le catalogue. Vérifiez votre connexion.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoryLookup = useMemo(() => {
    const map = new Map<number, { parentId: number; parentName: string; subName: string }>();
    const flatten = (cats: any[], parentId?: number, parentName?: string) => {
      cats.forEach(cat => {
        const id = parseInt(cat.id);
        const nom = cat.name;
        if (parentId !== undefined && parentName) {
          map.set(id, { parentId, parentName, subName: nom });
        }
        if (cat.subCategories && cat.subCategories.length) {
          flatten(cat.subCategories, id, nom);
        }
      });
    };
    flatten(categories);
    return map;
  }, [categories]);

  const subCategoryIds = useMemo(() => {
    if (selectedCategoryId === null) return [];
    return getAllSubCategoryIds(categories, String(selectedCategoryId));
  }, [categories, selectedCategoryId]);

  const filteredProducts = produits.filter((product) => {
    const matchesSearch =
      product.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.codeArticle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesCategory = true;
    if (selectedSubCategoryId !== null) {
      matchesCategory = product.categorieId === selectedSubCategoryId;
    } else if (selectedCategoryId !== null) {
      matchesCategory = subCategoryIds.includes(product.categorieId ?? -1);
    }
    return matchesSearch && matchesCategory;
  });

  const toggleCart = (productId: number) => {
    const product = produits.find(p => p.id === productId);
    if (!product) return;
    if (isInCart(productId)) {
      removeItem(productId);
      toast.success("Article retiré du panier");
    } else {
      addItem({
        id: product.id,
        name: product.designation,
        reference: product.codeArticle,
        categoryLabel: "Article",
        description: product.description || "",
        categorieId: product.categorieId,
        imageUrl: product.imageUrl,
      });
      toast.success("Article ajouté au panier");
    }
  };

  const openProductDetails = (product: Produit) => {
    setSelectedProduct(product);
    setQuantity(1);
    setDetailsOpen(true);
  };

  const addToCartFromDialog = () => {
    if (selectedProduct) {
      addItem(
        {
          id: selectedProduct.id,
          name: selectedProduct.designation,
          reference: selectedProduct.codeArticle,
          categoryLabel: "Article",
          description: selectedProduct.description || "",
          categorieId: selectedProduct.categorieId,
          imageUrl: selectedProduct.imageUrl,
        },
        quantity
      );
      toast.success(`${quantity} × ${selectedProduct.designation} ajouté au panier`);
      setDetailsOpen(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleCategoryClick = (catId: string) => {
    setSelectedCategoryId(parseInt(catId));
    setSelectedSubCategoryId(null);
  };

  const handleSubCategoryClick = (catId: string) => {
    setSelectedSubCategoryId(parseInt(catId));
    setSelectedCategoryId(null);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
  };

  const selectedCategoryObj = categories.find(c => c.id === String(selectedCategoryId));
  const selectedSubCategoryObj = selectedCategoryObj?.subCategories.find((s: any) => s.id === String(selectedSubCategoryId));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1D6F42]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1D6F42]">Catalogue des Articles</h1>
          <p className="text-muted-foreground mt-1">
            Consultez et sélectionnez les articles dont vous avez besoin
          </p>
        </div>
        <Link href="/dashboard/employe/panier">
          <Button className="w-fit bg-[#E31837] hover:bg-[#E31837]/90">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Mon Panier ({totalItems})
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="border-0 bg-white shadow-sm border-l-4 border-l-[#1D6F42]">
        <CardContent className="p-4">
          <p className="text-sm text-foreground">
            <strong className="text-[#1D6F42]">Note :</strong> Les prix, stocks et emplacements physiques ne sont pas affichés pour les employés.
            Sélectionnez vos articles et soumettez votre demande pour validation.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-6">
        {/* Sidebar catégories */}
        {sidebarOpen && (
          <div className="w-72 flex-shrink-0">
            <Card className="border-0 shadow-sm sticky top-24">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#1D6F42]" />
                    <h3 className="font-semibold">Catégories</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(false)}>
                    <PanelLeftClose className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mb-4">
                  <Button
                    variant={selectedCategoryId === null && selectedSubCategoryId === null ? "default" : "ghost"}
                    className={`w-full justify-start ${selectedCategoryId === null && selectedSubCategoryId === null ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : ""}`}
                    onClick={resetFilters}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Tous les articles
                  </Button>
                </div>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Collapsible
                      key={category.id}
                      open={expandedCategories.includes(category.id)}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`w-full justify-between px-3 py-2 h-auto ${selectedCategoryId === parseInt(category.id) ? "bg-[#1D6F42]/10 text-[#1D6F42]" : ""}`}
                          onClick={() => handleCategoryClick(category.id)}
                        >
                          <span className={`flex items-center gap-2 text-sm ${category.color}`}>
                            {category.icon}
                            <span className="text-foreground">{category.name}</span>
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategories.includes(category.id) ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-3">
                          {category.subCategories.map((sub: any) => (
                            <Button
                              key={sub.id}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-xs h-8 ${selectedSubCategoryId === parseInt(sub.id) ? "bg-[#E31837]/10 text-[#E31837] font-medium" : "text-muted-foreground"}`}
                              onClick={() => handleSubCategoryClick(sub.id)}
                            >
                              <span className="mr-2">{sub.icon}</span>
                              {sub.name}
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Produits */}
        <div className="flex-1 space-y-4">
          {/* Barre de recherche & affichage */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {!sidebarOpen && (
                  <Button variant="outline" size="icon" className="h-11 w-11 flex-shrink-0" onClick={() => setSidebarOpen(true)}>
                    <PanelLeftOpen className="w-4 h-4" />
                  </Button>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, référence ou mot-clé..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-none ${viewMode === "grid" ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-none ${viewMode === "list" ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fil d’Ariane */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>Catalogue</span>
            {selectedCategoryObj && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#1D6F42] font-medium">{selectedCategoryObj.name}</span>
              </>
            )}
            {selectedSubCategoryObj && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#E31837] font-medium">{selectedSubCategoryObj.name}</span>
              </>
            )}
            {(selectedCategoryId !== null || selectedSubCategoryId !== null) && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={resetFilters}>
                (Réinitialiser)
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{filteredProducts.length} article(s) trouvé(s)</p>

          {/* Grille / Liste */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const inCart = isInCart(product.id);
                const catInfo = categoryLookup.get(product.categorieId ?? -1);
                const parentCategory = catInfo?.parentName ?? "";
                const subCategory = catInfo?.subName ?? "";

                return (
                  <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                    <CardContent className="p-4">
                      <div
                        className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-4 flex items-center justify-center group-hover:from-[#1D6F42]/5 group-hover:to-[#1D6F42]/10 transition-colors cursor-pointer relative overflow-hidden"
                        onClick={() => openProductDetails(product)}
                      >
                        {product.imageUrl ? (
                          <img
                            src={getImageUrl(product.imageUrl)}
                            alt={product.designation}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : null}
                        <Package className={`w-12 h-12 text-muted-foreground/50 ${product.imageUrl ? 'hidden' : 'block'}`} />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                            onClick={(e) => { e.stopPropagation(); openProductDetails(product); }}
                          >
                            <Info className="w-4 h-4 text-[#1D6F42]" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <div className="flex flex-wrap items-center gap-1 text-xs">
                          <span className="text-[#1D6F42] font-medium break-words">{parentCategory}</span>
                          {subCategory && (
                            <>
                              <span className="text-gray-400">›</span>
                              <span className="text-[#E31837] font-medium break-words">{subCategory}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <h3
                        className="font-semibold text-sm mb-1 cursor-pointer hover:text-[#1D6F42] line-clamp-2 break-words"
                        onClick={() => openProductDetails(product)}
                      >
                        {product.designation}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">Réf: {product.codeArticle}</p>
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 break-words">{product.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-full ${inCart ? "bg-[#1D6F42] text-white border-[#1D6F42] hover:bg-[#1D6F42]/80 hover:text-white" : "border-gray-300 text-gray-700 hover:border-[#1D6F42]"}`}
                        onClick={() => toggleCart(product.id)}
                      >
                        {inCart ? <><Check className="w-4 h-4 mr-2" />Dans le panier</> : <><Plus className="w-4 h-4 mr-2" />Ajouter au panier</>}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => {
                const inCart = isInCart(product.id);
                const catInfo = categoryLookup.get(product.categorieId ?? -1);
                const parentCategory = catInfo?.parentName ?? "";
                const subCategory = catInfo?.subName ?? "";

                return (
                  <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer hover:from-[#1D6F42]/5 hover:to-[#1D6F42]/10 overflow-hidden"
                          onClick={() => openProductDetails(product)}
                        >
                          {product.imageUrl ? (
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.designation}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <div className="flex flex-wrap items-center gap-1 text-xs">
                              <span className="text-[#1D6F42] font-medium break-words">{parentCategory}</span>
                              {subCategory && (
                                <>
                                  <span className="text-gray-400">›</span>
                                  <span className="text-[#E31837] font-medium break-words">{subCategory}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <h3
                            className="font-semibold text-sm cursor-pointer hover:text-[#1D6F42] break-words"
                            onClick={() => openProductDetails(product)}
                          >
                            {product.designation}
                          </h3>
                          <p className="text-xs text-muted-foreground">Réf: {product.codeArticle}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 break-words">{product.description}</p>
                        </div>
                        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                          <Button variant="outline" size="sm" onClick={() => openProductDetails(product)}>
                            <Info className="w-4 h-4 mr-2" />Détails
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={inCart ? "bg-[#1D6F42] text-white border-[#1D6F42] hover:bg-[#1D6F42]/80 hover:text-white" : "border-gray-300 text-gray-700 hover:border-[#1D6F42]"}
                            onClick={() => toggleCart(product.id)}
                          >
                            {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucun article trouvé</h3>
                <p className="text-muted-foreground text-sm">Modifiez vos critères de recherche ou sélectionnez une autre catégorie</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogue détail produit – avec FICHE TECHNIQUE */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1D6F42]">{selectedProduct.designation}</DialogTitle>
                <DialogDescription>Référence: {selectedProduct.codeArticle}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Image */}
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center overflow-hidden">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={getImageUrl(selectedProduct.imageUrl)}
                      alt={selectedProduct.designation}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/50" />
                  )}
                </div>

                {/* Catégories */}
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const catInfo = categoryLookup.get(selectedProduct.categorieId ?? -1);
                    const parentCategory = catInfo?.parentName ?? "";
                    const subCategory = catInfo?.subName ?? "";
                    return (
                      <div className="flex flex-wrap items-center gap-1 text-sm">
                        <span className="text-[#1D6F42] font-medium break-words">
                          {parentCategory || "Article"}
                        </span>
                        {subCategory && (
                          <>
                            <span className="text-gray-400">›</span>
                            <span className="text-[#E31837] font-medium break-words">{subCategory}</span>
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">
                    {selectedProduct.description || "Aucune description disponible."}
                  </p>
                </div>

              {/* 📄 Fiche technique (si disponible) */}
              {(selectedProduct.poidsUnitaire || selectedProduct.dimensions || selectedProduct.materiau || selectedProduct.instructionsSecurite) ? (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1D6F42]" />
                    Fiche technique
                  </h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    {selectedProduct.poidsUnitaire && (
                      <div className="flex items-center gap-2 text-sm">
                        <Weight className="w-4 h-4 text-[#1D6F42]" />
                        <span className="font-medium">Poids unitaire :</span>
                        <span className="text-muted-foreground">{selectedProduct.poidsUnitaire} kg</span>
                      </div>
                    )}
                    {selectedProduct.dimensions && (
                      <div className="flex items-center gap-2 text-sm">
                        <Ruler className="w-4 h-4 text-[#1D6F42]" />
                        <span className="font-medium">Dimensions :</span>
                        <span className="text-muted-foreground">{selectedProduct.dimensions}</span>
                      </div>
                    )}
                    {selectedProduct.materiau && (
                      <div className="flex items-center gap-2 text-sm">
                        <Factory className="w-4 h-4 text-[#1D6F42]" />
                        <span className="font-medium">Matériau :</span>
                        <span className="text-muted-foreground">{selectedProduct.materiau}</span>
                      </div>
                    )}
                    {selectedProduct.instructionsSecurite && (
                      <div className="flex items-start gap-2 text-sm">
                        <Shield className="w-4 h-4 text-[#1D6F42] mt-0.5" />
                        <span className="font-medium">Instructions sécurité :</span>
                        <span className="text-muted-foreground flex-1">{selectedProduct.instructionsSecurite}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground italic">
                    Aucune fiche technique disponible pour cet article.
                  </p>
                </div>
              )}

              
                {/* Quantité */}
                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-2 block">Quantité souhaitée</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center h-10"
                    />
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fermer</Button>
                <Button className="bg-[#1D6F42] text-white hover:bg-[#1D6F42]/90" onClick={addToCartFromDialog}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Ajouter au panier ({quantity})
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}