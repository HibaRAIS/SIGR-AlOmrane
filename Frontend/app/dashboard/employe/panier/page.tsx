"use client";

import { useRouter } from "next/navigation";
import { useCart, CartItem } from "@/context/CartContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Trash2, Minus, Plus, ArrowRight, ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { categorieService, CategorieArborescence } from "@/services/categorie.service";

// ============================================================
//         RÉCUPÉRATION DES CATÉGORIES POUR L'AFFICHAGE
// ============================================================

const buildCategoryLookup = (backendCategories: CategorieArborescence[]) => {
  const map = new Map<number, { parentName: string; subName: string }>();
  const flatten = (cats: CategorieArborescence[], parentName?: string) => {
    cats.forEach(cat => {
      const id = cat.id;
      const nom = cat.nom;
      if (parentName !== undefined) {
        map.set(id, { parentName, subName: nom });
      }
      if (cat.sousCategories && cat.sousCategories.length) {
        flatten(cat.sousCategories, nom);
      }
    });
  };
  flatten(backendCategories);
  return map;
};

export default function PanierPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const router = useRouter();
  const [categories, setCategories] = useState<CategorieArborescence[]>([]);
  const [categoryLookup, setCategoryLookup] = useState<Map<number, { parentName: string; subName: string }>>(new Map());

  // Chargement des catégories pour afficher les noms
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categorieService.getArborescence();
        setCategories(data);
        const lookup = buildCategoryLookup(data);
        setCategoryLookup(lookup);
      } catch (error) {
        console.error("Erreur lors du chargement des catégories", error);
      }
    };
    fetchCategories();
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleGoToRequest = () => {
    router.push("/dashboard/employe/demandes");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mon Panier</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les articles avant de soumettre votre demande
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/employe/catalogue">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continuer les achats
          </Link>
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: CartItem) => {
              const catInfo = categoryLookup.get(item.categorieId ?? -1);
              const parentCategory = catInfo?.parentName ?? "Article";
              const subCategory = catInfo?.subName ?? "";

              return (
                <Card key={item.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Image ou icône */}
                      <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Package className="w-8 h-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-1 text-xs mb-1">
                              <span className="text-[#1D6F42] font-medium break-words">
                                {parentCategory}
                              </span>
                              {subCategory && (
                                <>
                                  <span className="text-gray-400">›</span>
                                  <span className="text-[#E31837] font-medium break-words">
                                    {subCategory}
                                  </span>
                                </>
                              )}
                            </div>
                            <h3 className="font-semibold">{item.name}</h3>
                            <p className="text-sm text-muted-foreground">Réf: {item.reference}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                          <span className="text-sm text-muted-foreground">Quantité:</span>
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-r-none"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-9 text-center border-0 rounded-none focus-visible:ring-0"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-l-none"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nombre d&apos;articles</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantité totale</span>
                    <span className="font-medium">{totalItems} unités</span>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre demande sera soumise pour validation par votre responsable hiérarchique.
                  </p>
                  <Button
                    className="w-full bg-[#1D6F42] hover:bg-[#1D6F42]/90"
                    size="lg"
                    onClick={handleGoToRequest}
                  >
                    Passer à la demande
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Votre panier est vide</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Parcourez le catalogue pour ajouter des articles
            </p>
            <Button className="bg-[#1D6F42] hover:bg-[#1D6F42]/90" asChild>
              <Link href="/dashboard/employe/catalogue">
                <Package className="w-4 h-4 mr-2" />
                Voir le catalogue
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}