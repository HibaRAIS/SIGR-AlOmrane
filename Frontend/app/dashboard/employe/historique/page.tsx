"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { demandeService, DemandeResponse } from "@/services/demande.service";
import { produitService, Produit } from "@/services/produit.service";
import { categorieService } from "@/services/categorie.service";
import { buildCategoryHierarchy, getRootCategories, getSubCategories, CategoryInfo } from "@/lib/categoryHelpers";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Calendar,
  Package,
  TrendingUp,
  Download,
  FileText,
  Layers,
  XCircle,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface ConsumptionItem {
  id: string;
  name: string;
  parentCategory: string;
  subCategory: string;
  fullPath: string;
  quantity: number;
  date: string;
  requestId: string;
  imageUrl?: string;
}

// ========== PALETTE ELOMRANE ==========
const CATEGORY_COLORS: Record<string, string> = {
  "Fournitures de bureau": "#1D6F42",
  "Consommables impression": "#E31837",
  "Matériel informatique": "#F59E0B",
};

const ELOMRANE_PALETTE = [
  "#1D6F42", "#2E8B57", "#3CB371", "#90EE90",
  "#E31837", "#DC143C", "#B22222", "#FF6347",
  "#F59E0B", "#D97706", "#EA580C",
  "#6B7280", "#9CA3AF", "#D1D5DB",
];

const STATUT_COLORS: Record<string, string> = {
  "EN_VALIDATION": "#F59E0B",
  "VALIDEE": "#1D6F42",
  "REFUSEE": "#E31837",
  "EN_PREPARATION": "#3B82F6",
  "LIVREE": "#10B981",
};

const isLightColor = (hex: string): boolean => {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.7;
};

const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % ELOMRANE_PALETTE.length;
  return ELOMRANE_PALETTE[index];
};

const getCategoryColor = (categoryName: string): string => {
  return CATEGORY_COLORS[categoryName] || stringToColor(categoryName);
};

const getLastNMonths = (n: number): string[] => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
  }
  return months;
};

const getMonthKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthDisplay = (monthKey: string): string => {
  const [year, month] = monthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString("fr-FR", { month: "short", year: "numeric" });
};

type UnifiedPeriod = "month" | "quarter" | "year" | "6months" | "12months" | "custom";

const isDateInRange = (dateStr: string, period: UnifiedPeriod, startDate?: Date, endDate?: Date): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  switch (period) {
    case "month":
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case "quarter": {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const itemQuarter = Math.floor(date.getMonth() / 3);
      return currentQuarter === itemQuarter && date.getFullYear() === now.getFullYear();
    }
    case "year":
      return date.getFullYear() === now.getFullYear();
    case "6months": {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return date >= cutoff;
    }
    case "12months": {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
      return date >= cutoff;
    }
    case "custom":
      if (!startDate || !endDate) return true;
      return date >= startDate && date <= endDate;
    default:
      return true;
  }
};

type SortField = "name" | "category" | "quantity" | "date" | "requestId";
type SortOrder = "asc" | "desc";

export default function HistoriquePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consumptionItems, setConsumptionItems] = useState<ConsumptionItem[]>([]);
  const [allDemandes, setAllDemandes] = useState<DemandeResponse[]>([]);
  const [categoryMap, setCategoryMap] = useState<Map<number, CategoryInfo>>(new Map());
  const [rootCategories, setRootCategories] = useState<CategoryInfo[]>([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [parentCategoryFilter, setParentCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [unifiedPeriod, setUnifiedPeriod] = useState<UnifiedPeriod>("6months");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const availableSubCategories = useMemo(() => {
    if (parentCategoryFilter === "all") return [];
    const parentCat = rootCategories.find((c) => c.name === parentCategoryFilter);
    if (!parentCat) return [];
    return getSubCategories(parentCat.id, categoryMap).map((c) => c.name);
  }, [parentCategoryFilter, rootCategories, categoryMap]);

  useEffect(() => {
    setSubCategoryFilter("all");
  }, [parentCategoryFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setParentCategoryFilter("all");
    setSubCategoryFilter("all");
    setUnifiedPeriod("6months");
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
    setSortField("date");
    setSortOrder("desc");
    setSelectedParentCategory(null);
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const [demandes, produits, categoriesTree] = await Promise.all([
          demandeService.getMesDemandes(),
          produitService.getCatalogue(),
          categorieService.getArborescence(),
        ]);

        setAllDemandes(demandes);

        const { map: catMap } = buildCategoryHierarchy(categoriesTree);
        setCategoryMap(catMap);
        setRootCategories(getRootCategories(catMap));

        const productCategoryMap = new Map<number, CategoryInfo>();
        const productImageMap = new Map<number, string>();
        produits.forEach((prod: Produit) => {
          if (prod.categorieId && catMap.has(prod.categorieId)) {
            productCategoryMap.set(prod.id, catMap.get(prod.categorieId)!);
          } else {
            productCategoryMap.set(prod.id, {
              id: -1,
              name: "Autre",
              parentId: null,
              parentName: null,
              fullPath: "Autre",
            });
          }
          if (prod.imageUrl) productImageMap.set(prod.id, prod.imageUrl);
        });

        const consumedDemandes = demandes.filter(
          (d) => d.statut === "VALIDEE" || d.statut === "LIVREE"
        );

        const items: ConsumptionItem[] = [];
        for (const demande of consumedDemandes) {
          for (const ligne of demande.lignes) {
            const catInfo = productCategoryMap.get(ligne.produitId);
            if (!catInfo) continue;

            let parentCategory: string, subCategory: string, fullPath: string;
            if (catInfo.parentId === null) {
              parentCategory = catInfo.name;
              subCategory = "—";
              fullPath = catInfo.name;
            } else {
              parentCategory = catInfo.parentName || catInfo.name;
              subCategory = catInfo.name;
              fullPath = catInfo.fullPath;
            }

            const quantity = Number(ligne.quantiteAccordee);
            if (isNaN(quantity)) continue;

            items.push({
              id: String(ligne.ligneId),
              name: ligne.produitDesignation,
              parentCategory,
              subCategory,
              fullPath,
              quantity,
              date: demande.dateDemande.split("T")[0],
              requestId: demande.numeroDemande,
              imageUrl: productImageMap.get(ligne.produitId),
            });
          }
        }
        setConsumptionItems(items);
      } catch (err) {
        console.error("Erreur chargement historique", err);
        setError("Impossible de charger votre historique. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredItems = useMemo(() => {
    return consumptionItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requestId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesParent =
        parentCategoryFilter === "all" || item.parentCategory === parentCategoryFilter;
      const matchesSub =
        subCategoryFilter === "all" || item.subCategory === subCategoryFilter;
      const matchesDate = isDateInRange(item.date, unifiedPeriod, customStartDate, customEndDate);
      return matchesSearch && matchesParent && matchesSub && matchesDate;
    });
  }, [consumptionItems, searchQuery, parentCategoryFilter, subCategoryFilter, unifiedPeriod, customStartDate, customEndDate]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "category":
          const aCat = a.subCategory !== "—" ? a.subCategory : a.parentCategory;
          const bCat = b.subCategory !== "—" ? b.subCategory : b.parentCategory;
          aVal = aCat;
          bVal = bCat;
          break;
        case "quantity":
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case "date":
          aVal = new Date(a.date).getTime();
          bVal = new Date(b.date).getTime();
          break;
        case "requestId":
          aVal = a.requestId;
          bVal = b.requestId;
          break;
        default:
          aVal = a.date;
          bVal = b.date;
      }
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredItems, sortField, sortOrder]);

  const totalItems = filteredItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalDemandes = new Set(filteredItems.map(i => i.requestId)).size;
  const avgPerDemande = totalDemandes === 0 ? 0 : (totalItems / totalDemandes).toFixed(1);

  const parentCategoryStats = useMemo(() => {
    const map = new Map<string, number>();
    filteredItems.forEach((item) => {
      map.set(item.parentCategory, (map.get(item.parentCategory) || 0) + item.quantity);
    });
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total === 0 ? 0 : Math.round((count / total) * 100),
        color: getCategoryColor(name),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredItems]);

  const subCategoryStats = useMemo(() => {
    if (!selectedParentCategory) return [];
    const filtered = filteredItems.filter(item => item.parentCategory === selectedParentCategory);
    const subMap = new Map<string, number>();
    filtered.forEach(item => {
      const sub = item.subCategory;
      subMap.set(sub, (subMap.get(sub) || 0) + item.quantity);
    });
    const total = Array.from(subMap.values()).reduce((a,b) => a+b, 0);
    return Array.from(subMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total === 0 ? 0 : Math.round((count / total) * 100),
        color: getCategoryColor(name),
      }))
      .sort((a,b) => b.count - a.count);
  }, [selectedParentCategory, filteredItems]);

  const monthlyTrendData = useMemo(() => {
    const topParents = parentCategoryStats.slice(0, 3).map(p => p.name);
    let allMonths: string[];
    if (unifiedPeriod === "6months") {
      allMonths = getLastNMonths(6);
    } else if (unifiedPeriod === "12months") {
      allMonths = getLastNMonths(12);
    } else {
      allMonths = Array.from(new Set(filteredItems.map(item => getMonthKey(item.date)))).sort();
    }
    const monthValues = allMonths.map(month => ({ month, values: {} as Record<string, number> }));
    monthValues.forEach(mv => {
      topParents.forEach(parent => { mv.values[parent] = 0; });
    });
    filteredItems.forEach(item => {
      if (!topParents.includes(item.parentCategory)) return;
      const monthKey = getMonthKey(item.date);
      const entry = monthValues.find(mv => mv.month === monthKey);
      if (entry) {
        entry.values[item.parentCategory] += item.quantity;
      }
    });
    return monthValues.map(({ month, values }) => ({ month, ...values }));
  }, [filteredItems, parentCategoryStats, unifiedPeriod]);

  const monthlyComparisonData = useMemo(() => {
    let allMonths: string[];
    if (unifiedPeriod === "6months") {
      allMonths = getLastNMonths(6);
    } else if (unifiedPeriod === "12months") {
      allMonths = getLastNMonths(12);
    } else {
      allMonths = Array.from(new Set(filteredItems.map(item => getMonthKey(item.date)))).sort();
    }
    const monthMap = new Map(allMonths.map(month => [month, { articles: 0, demandes: new Set<string>() }]));
    filteredItems.forEach(item => {
      const monthKey = getMonthKey(item.date);
      const entry = monthMap.get(monthKey);
      if (entry) {
        entry.articles += item.quantity;
        entry.demandes.add(item.requestId);
      }
    });
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, articles: data.articles, demandes: data.demandes.size }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredItems, unifiedPeriod]);

  const statutStats = useMemo(() => {
    const map = new Map<string, number>();
    allDemandes.forEach(demande => {
      const statut = demande.statut;
      map.set(statut, (map.get(statut) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: name === "EN_VALIDATION" ? "En validation" :
            name === "VALIDEE" ? "Validée" :
            name === "REFUSEE" ? "Refusée" :
            name === "EN_PREPARATION" ? "En préparation" :
            name === "LIVREE" ? "Livrée" : name,
      value,
      color: STATUT_COLORS[name] || "#6B7280",
    }));
  }, [allDemandes]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 inline" />;
    return sortOrder === "asc" ? <ArrowUp className="ml-1 h-3 w-3 inline" /> : <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Chargement de votre historique...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center text-destructive">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">Réessayer</Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Styles globaux pour l'impression */}
      <style jsx global>{`
        @media print {
          .text-muted-foreground {
            color: black !important;
          }
          .print\\:text-black {
            color: black !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
          .bg-primary\\/10 {
            background-color: #f3f4f6 !important;
          }
          .text-primary {
            color: black !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:mb-4">
          <div>
            <h1 className="text-2xl font-bold">Historique de Consommation</h1>
            <p className="text-muted-foreground mt-1 print:text-black">Visualisez votre historique par catégorie et sous‑catégorie</p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" onClick={resetFilters}><RotateCcw className="w-4 h-4 mr-2" /> Réinitialiser</Button>
            <Button variant="outline" onClick={handleExportPDF} title="Générer l'aperçu PDF (peut prendre quelques secondes)"><Download className="w-4 h-4 mr-2" /> Exporter en PDF</Button>
          </div>
        </div>

        {/* Première ligne : Stats globales + Pie chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CARTE TOTAL ARTICLES - Affichage garanti dans le PDF */}
          <Card className="border-0 shadow-sm print:border print:shadow-none print:border-black print:bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800 font-medium print:!text-black">Total articles consommés</p>
                  <p className="text-3xl font-bold mt-1 print:!text-black">{totalItems}</p>
                  <p className="text-xs text-gray-600 mt-1 print:!text-black">
                    {unifiedPeriod === "month" ? "Ce mois" : unifiedPeriod === "quarter" ? "Ce trimestre" : unifiedPeriod === "year" ? "Cette année" : unifiedPeriod === "6months" ? "6 derniers mois" : unifiedPeriod === "12months" ? "12 derniers mois" : "Période personnalisée"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 print:bg-gray-100 print:border print:border-gray-300">
                  <TrendingUp className="w-6 h-6 text-primary print:text-gray-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm col-span-2 print:border print:shadow-none print:border-black print:bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg print:text-black">Répartition des demandes par statut</CardTitle>
              <CardDescription className="print:text-black">Ensemble de vos demandes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statutStats} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {statutStats.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} demande(s)`, "Nombre"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Graphique tendance mensuelle */}
        <Card className="border-0 shadow-sm print:border print:shadow-none print:border-black print:bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg print:text-black">Tendance mensuelle par catégorie principale</CardTitle>
            <CardDescription className="print:text-black">Top 3 catégories les plus consommées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tickFormatter={formatMonthDisplay} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={(l) => formatMonthDisplay(l as string)} />
                  <Legend />
                  {parentCategoryStats.slice(0, 3).map((cat) => (
                    <Line key={cat.name} type="monotone" dataKey={cat.name} name={cat.name} stroke={cat.color} strokeWidth={2} dot={{ fill: cat.color, strokeWidth: 2 }} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar chart et répartition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm print:border print:shadow-none print:border-black print:bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg print:text-black">Articles vs Demandes</CardTitle>
              <CardDescription className="print:text-black">Comparaison mensuelle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tickFormatter={formatMonthDisplay} tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip labelFormatter={(l) => formatMonthDisplay(l as string)} />
                    <Legend />
                    <Bar dataKey="articles" name="Articles" fill="#1D6F42" radius={[4,4,0,0]} />
                    <Bar dataKey="demandes" name="Demandes" fill="#E31837" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm print:border print:shadow-none print:border-black print:bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg print:text-black">Répartition par catégorie principale</CardTitle>
              <CardDescription className="print:text-black">
                {selectedParentCategory ? `Détail de « ${selectedParentCategory} » par sous‑catégorie` : "Cliquez sur une catégorie pour voir ses sous‑catégories"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedParentCategory ? (
                <>
                  <div className="space-y-4">
                    {parentCategoryStats.map((cat) => (
                      <div key={cat.name} className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors print:cursor-default" onClick={() => setSelectedParentCategory(cat.name)}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                            {cat.name}
                            <ChevronRight className="w-4 h-4 text-muted-foreground print:hidden" />
                          </span>
                          <span className="text-muted-foreground print:text-black">{cat.count} article{cat.count > 1 ? "s" : ""} ({cat.percentage}%)</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                        </div>
                      </div>
                    ))}
                    {parentCategoryStats.length === 0 && <p className="text-muted-foreground text-center">Aucune donnée</p>}
                  </div>
                  <div className="mt-6 pt-4 border-t print:border-black">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-[#1D6F42] print:text-black">{totalItems}</p>
                        <p className="text-xs text-muted-foreground print:text-black">Total articles</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[#E31837] print:text-black">{totalDemandes}</p>
                        <p className="text-xs text-muted-foreground print:text-black">Demandes</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-amber-500 print:text-black">{avgPerDemande}</p>
                        <p className="text-xs text-muted-foreground print:text-black">Moy/demande</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedParentCategory(null)} className="text-muted-foreground print:hidden">
                      <XCircle className="w-4 h-4 mr-1" /> Retour à la vue globale
                    </Button>
                  </div>
                  {subCategoryStats.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucune sous‑catégorie trouvée pour <strong>{selectedParentCategory}</strong></p>
                  ) : (
                    <div className="space-y-4">
                      {subCategoryStats.map((sub) => (
                        <div key={sub.name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sub.color }} />
                              {sub.name === "—" ? "Sans sous‑catégorie" : sub.name}
                            </span>
                            <span className="text-muted-foreground print:text-black">{sub.count} article{sub.count > 1 ? "s" : ""} ({sub.percentage}%)</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${sub.percentage}%`, backgroundColor: sub.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filtres (cachés dans le PDF) */}
        <Card className="border-0 shadow-sm print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Rechercher par article ou numéro de demande..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11" />
              </div>
              <Select value={parentCategoryFilter} onValueChange={setParentCategoryFilter}>
                <SelectTrigger className="w-full lg:w-56 h-11"><Layers className="w-4 h-4 mr-2" /><SelectValue placeholder="Catégorie principale" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories principales</SelectItem>
                  {rootCategories.map((cat) => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter} disabled={parentCategoryFilter === "all" || availableSubCategories.length === 0}>
                <SelectTrigger className="w-full lg:w-56 h-11"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Sous‑catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sous‑catégories</SelectItem>
                  {availableSubCategories.map((sub) => (<SelectItem key={sub} value={sub}>{sub}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={unifiedPeriod} onValueChange={(val) => setUnifiedPeriod(val as UnifiedPeriod)}>
                <SelectTrigger className="w-full lg:w-48 h-11"><Calendar className="w-4 h-4 mr-2" /><SelectValue placeholder="Période" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Ce trimestre</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                  <SelectItem value="6months">6 derniers mois</SelectItem>
                  <SelectItem value="12months">12 derniers mois</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-11 px-3 text-muted-foreground hover:text-foreground" title="Réinitialiser les filtres">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            {unifiedPeriod === "custom" && (
              <div className="flex gap-4 mt-4">
                <Input type="date" className="w-full lg:w-48" onChange={(e) => setCustomStartDate(e.target.value ? new Date(e.target.value) : undefined)} />
                <span className="self-center">à</span>
                <Input type="date" className="w-full lg:w-48" onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : undefined)} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tableau */}
        <Card className="border-0 shadow-sm print:border print:shadow-none print:border-black print:bg-white print:mt-4">
          <CardHeader>
            <CardTitle className="text-lg print:text-black">Détail des consommations</CardTitle>
            <CardDescription className="print:text-black">{sortedItems.length} article(s) trouvé(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border print:border-black">
              <table className="w-full">
                <thead className="bg-muted/50 print:bg-gray-100">
                  <tr className="border-b print:border-black">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors print:text-black print:bg-gray-100" onClick={() => handleSort("name")}>
                      <span className="flex items-center">Article {renderSortIcon("name")}</span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors print:text-black print:bg-gray-100" onClick={() => handleSort("category")}>
                      <span className="flex items-center">Catégorie {renderSortIcon("category")}</span>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors print:text-black print:bg-gray-100" onClick={() => handleSort("quantity")}>
                      <span className="flex items-center justify-center">Qté {renderSortIcon("quantity")}</span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors print:text-black print:bg-gray-100" onClick={() => handleSort("date")}>
                      <span className="flex items-center">Date {renderSortIcon("date")}</span>
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-muted/70 transition-colors print:text-black print:bg-gray-100" onClick={() => handleSort("requestId")}>
                      <span className="flex items-center">N° Demande {renderSortIcon("requestId")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item, idx) => {
                    const displayCategory = item.subCategory !== "—" ? item.subCategory : item.parentCategory;
                    const categoryColor = getCategoryColor(displayCategory);
                    const textColor = isLightColor(categoryColor) ? "#374151" : categoryColor;
                    const bgColor = `${categoryColor}20`;
                    const bgClass = idx % 2 === 0 ? "bg-white dark:bg-gray-950 print:bg-white" : "bg-muted/20 print:bg-gray-50";
                    return (
                      <tr key={item.id} className={`border-b last:border-0 hover:bg-muted/40 transition-colors ${bgClass} print:border-black`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 rounded-lg object-cover print:border print:border-gray-300" />
                            ) : (
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                            )}
                            <span className="font-medium text-sm">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary" className="text-xs whitespace-nowrap border print:border-black print:bg-transparent print:text-black print:font-normal" style={{ backgroundColor: bgColor, color: textColor, borderColor: `${categoryColor}40` }}>
                            {displayCategory}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center"><span className="font-semibold">{item.quantity}</span></td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground print:text-black">
                            <Calendar className="w-4 h-4" />
                            {new Date(item.date).toLocaleDateString("fr-FR")}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <a href={`/dashboard/suivi?id=${item.requestId}`} className="font-mono text-sm text-primary hover:underline print:text-black">
                            {item.requestId}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sortedItems.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucun historique trouvé</h3>
                <p className="text-muted-foreground text-sm">Modifiez vos critères de recherche pour voir plus de résultats</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}