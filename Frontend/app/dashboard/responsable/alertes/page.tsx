'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Eye,
  ShoppingCart,
  CheckCircle,
  Package,
  Search,
  Filter,
  X,
  Info,
  Archive,
  CheckSquare,
  Square,
  Clock,
  RotateCcw,
  CheckCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { alerteService, type AlerteStockDTO } from '@/services/alerte.service';

// Configuration des alertes – couleurs converties en classes Tailwind hex
const TYPE_CONFIG = {
  CRITIQUE: {
    bg: '#FFEBEE', text: '#B71C1C', border: '#EF9A9A', dot: '#EF5350',
    label: 'Critique', icon: AlertCircle, iconColor: '#B71C1C',
    badgeClass: 'bg-[#FFEBEE] text-[#B71C1C] border-[#EF9A9A]',
  },
  FAIBLE: {
    bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', dot: '#E65100',
    label: 'Faible', icon: AlertTriangle, iconColor: '#E65100',
    badgeClass: 'bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]',
  },
  SURVEILLANCE: {
    bg: '#FFF8E1', text: '#F57F17', border: '#FFE082', dot: '#F9A825',
    label: 'Surveillance', icon: Eye, iconColor: '#F9A825',
    badgeClass: 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]',
  },
} as const;

// ─── Composants réutilisables ───────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, colorClass, bgClass, isActive, onClick }: {
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;   
  bgClass: string;      
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 text-left w-full",
        isActive ? "border-[#1D6F42] ring-2 ring-[#1D6F42]/30 shadow-md" : "border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105", bgClass)}>
          <Icon className="w-6 h-6" style={{ color: colorClass }} />
        </div>
        {isActive && (
          <div className="w-5 h-5 rounded-full bg-[#1D6F42] flex items-center justify-center">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
    </button>
  );
}

function FilterBadge({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase whitespace-nowrap transition-all duration-200",
        isActive ? "border-[#1D6F42] bg-[#1D6F42] text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300"
      )}
    >
      {label}
    </button>
  );
}

// ─── Dialogue Détail d'une Alerte ──────────────────────────────────────────
function DetailAlerteDialog({ alerte, onClose, onMarquerTraitee, onMarquerIgnoree, onReactiver }: {
  alerte: AlerteStockDTO | null;
  onClose: () => void;
  onMarquerTraitee: (id: number) => void;
  onMarquerIgnoree: (id: number) => void;
  onReactiver: (id: number) => void;
}) {
  if (!alerte) return null;
  const config = TYPE_CONFIG[alerte.type] ?? TYPE_CONFIG.SURVEILLANCE;
  const Icon = config.icon;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl">
        <DialogTitle className="sr-only">Détail de l'alerte</DialogTitle>
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-gray-900 text-xl font-bold">
              <div className="p-2 rounded-xl border border-gray-200" style={{ backgroundColor: config.bg, color: config.iconColor }}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="capitalize">Alerte {config.label}</span>
            </div>
            <DialogDescription className="mt-1 text-gray-500 ml-12">
              Informations détaillées sur l'alerte et le produit concerné.
            </DialogDescription>
          </div>
          <Badge className={cn("px-3 py-1 text-xs uppercase tracking-widest shadow-sm rounded-lg", config.badgeClass)}>
            {config.label}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              {alerte.traitee && (
                 <span className="text-[11px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 flex items-center gap-1 font-semibold">
                   <CheckCircle className="w-3 h-3" /> Traitée
                 </span>
              )}
              {alerte.ignoree && (
                 <span className="text-[11px] bg-gray-100 text-gray-600 border border-gray-300 rounded-full px-2 py-0.5 flex items-center gap-1 font-semibold">
                   <Archive className="w-3 h-3" /> Archivée (Ignorée)
                 </span>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">{alerte.message}</p>
            <p className="text-xs text-gray-500">
              Détectée le {new Date(alerte.dateCreation).toLocaleDateString('fr-MA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Produit lié</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Code Article</div>
                <div className="font-mono text-[#0d3b66] font-semibold">{alerte.produitCode}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Désignation</div>
                <div className="font-medium text-gray-900">{alerte.produitDesignation}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Stock disponible</div>
                <div className={cn("font-bold", alerte.stockDisponible <= 0 ? "text-red-600" : "text-gray-700")}>
                  {alerte.stockDisponible} {alerte.uniteMesure}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Unité</div>
                <div className="font-medium text-gray-600">{alerte.uniteMesure}</div>
              </div>
            </div>
          </div>

          {!alerte.traitee && !alerte.ignoree && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 shadow-sm">
              <Info className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <p className="font-bold text-amber-900">Actions recommandées</p>
                <p className="text-amber-700 mt-1">Marquer comme traitée pour archiver l'alerte, ou ignorer si elle n'est plus pertinente.</p>
              </div>
            </div>
          )}

          {alerte.ignoree && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 shadow-sm">
              <RotateCcw className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-600" />
              <div>
                <p className="font-bold text-slate-900">Alerte archivée</p>
                <p className="text-slate-700 mt-1">Cette alerte a été ignorée manuellement. Vous pouvez la réactiver si nécessaire.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="outline" className="rounded-xl px-6" onClick={onClose}>Fermer</Button>
          
          {alerte.ignoree && (
             <Button
               variant="outline"
               onClick={() => onReactiver(alerte.id)}
               className="rounded-xl px-4 text-slate-700 border-slate-300 hover:text-slate-900 hover:bg-slate-100 gap-2"
             >
               <RotateCcw className="h-4 w-4" /> Réactiver
             </Button>
          )}

          {!alerte.ignoree && !alerte.traitee && (
            <Button
              variant="ghost"
              onClick={() => onMarquerIgnoree(alerte.id)}
              className="rounded-xl px-4 text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-2"
            >
              <Archive className="h-4 w-4" /> Archiver
            </Button>
          )}
          {!alerte.traitee && !alerte.ignoree && (
            <Button
              onClick={() => onMarquerTraitee(alerte.id)}
              className="bg-[#1D6F42] text-white hover:bg-[#155430] hover:text-white rounded-xl px-6 shadow-md gap-2"
            >
              <CheckCircle className="h-4 w-4" /> Marquer traitée
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Composant Principal ────────────────────────────────────────────────────

export default function AlertesPage() {
  // Données de la liste filtrée
  const [alertes, setAlertes] = useState<AlerteStockDTO[]>([]);
  const [loading, setLoading] = useState(false);

  // Statistiques globales (indépendantes des filtres)
  const [globalStats, setGlobalStats] = useState({
    total: 0,
    critiques: 0,
    faibles: 0,
    traitees: 0,
  });

  // Sélection (stocke les IDs numériques)
  const [selection, setSelection] = useState<Set<number>>(new Set());

  // Filtres
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(''); // '' | type | 'traitee' | 'non_traitee' | 'ignoree'

  // Détail d'une alerte
  const [detailAlerte, setDetailAlerte] = useState<AlerteStockDTO | null>(null);

  // ─── Chargement des statistiques globales ────────────────────────────────
  const fetchGlobalStats = useCallback(async () => {
    try {
      // Récupère toutes les alertes non ignorées pour les stats principales
      const toutes = await alerteService.getAll({ ignoree: false });
      const total = toutes.length;
      const critiques = toutes.filter(a => a.type === 'CRITIQUE' && !a.traitee).length;
      const faibles = toutes.filter(a => a.type === 'FAIBLE' && !a.traitee).length;
      const traitees = toutes.filter(a => a.traitee).length;
      setGlobalStats({ total, critiques, faibles, traitees });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques globales', error);
    }
  }, []);

  // Appel initial et après chaque action modifiant les alertes
  useEffect(() => {
    fetchGlobalStats();
  }, [fetchGlobalStats]);

  // Chargement de la liste avec les filtres
  const fetchAlertes = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | boolean> = {};
      if (search) params.search = search;

      if (filter === 'traitee') {
        params.traitee = true;
        params.ignoree = false;
      } else if (filter === 'non_traitee') {
        params.traitee = false;
        params.ignoree = false;
      } else if (filter === 'ignoree') {
        params.ignoree = true;
      } else if (filter !== '') {
        // Type d'alerte (CRITIQUE, FAIBLE, SURVEILLANCE)
        params.type = filter;
        params.ignoree = false; // ne pas montrer les ignorées dans ces vues
      } else {
        // Par défaut : masquer les ignorées
        params.ignoree = false;
      }

      const data = await alerteService.getAll(params);
      setAlertes(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des alertes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchAlertes();
  }, [fetchAlertes]);

  // KPIs actifs : basés sur le filtre courant, mais les valeurs affichées viennent de globalStats
  const isKpiActive = useCallback((type: string) => {
    if (type === 'all') return filter === '' && search === '';
    if (type === 'critiques') return filter === 'CRITIQUE' && search === '';
    if (type === 'faibles') return filter === 'FAIBLE' && search === '';
    if (type === 'traitees') return filter === 'traitee' && search === '';
    return false;
  }, [filter, search]);

  // Actions unitaires
  const marquerTraitee = useCallback(async (id: number) => {
    try {
      await alerteService.traiter(id);
      toast.success("Alerte marquée comme traitée");
      setDetailAlerte(null);
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors du traitement de l'alerte");
    }
  }, [fetchGlobalStats, fetchAlertes]);

  const marquerIgnoree = useCallback(async (id: number) => {
    try {
      await alerteService.ignorer(id);
      toast.success("Alerte archivée (ignorée)");
      setDetailAlerte(null);
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors de l'archivage de l'alerte");
    }
  }, [fetchGlobalStats, fetchAlertes]);

  const reactiverAlerte = useCallback(async (id: number) => {
    try {
      await alerteService.reactiver(id);
      toast.success("Alerte réactivée avec succès");
      setDetailAlerte(null);
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors de la réactivation de l'alerte");
    }
  }, [fetchGlobalStats, fetchAlertes]);

  // Actions de sélection
  const toggleSelection = useCallback((id: number) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selection.size === alertes.length && alertes.length > 0) {
      setSelection(new Set());
    } else {
      setSelection(new Set(alertes.map(a => a.id)));
    }
  }, [alertes, selection]);

  // Actions de masse
  const traiterSelection = useCallback(async () => {
    const ids = [...selection];
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => alerteService.traiter(id)));
      toast.success(`${ids.length} alerte(s) traitée(s)`);
      setSelection(new Set());
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors du traitement groupé");
    }
  }, [selection, fetchGlobalStats, fetchAlertes]);

  const ignorerSelection = useCallback(async () => {
    const ids = [...selection];
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => alerteService.ignorer(id)));
      toast.success(`${ids.length} alerte(s) archivée(s)`);
      setSelection(new Set());
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors de l'archivage groupé");
    }
  }, [selection, fetchGlobalStats, fetchAlertes]);

  const reactiverSelection = useCallback(async () => {
    const ids = [...selection];
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => alerteService.reactiver(id)));
      toast.success(`${ids.length} alerte(s) réactivée(s)`);
      setSelection(new Set());
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors de la réactivation groupée");
    }
  }, [selection, fetchGlobalStats, fetchAlertes]);

  // Actions globales (tous les visibles)
  const traiterToutVisibles = useCallback(async () => {
    const toTreat = alertes.filter(a => !a.traitee && !a.ignoree);
    if (toTreat.length === 0) {
      toast.info("Aucune alerte active à traiter dans cette vue.");
      return;
    }
    try {
      await Promise.all(toTreat.map(a => alerteService.traiter(a.id)));
      toast.success(`${toTreat.length} alerte(s) marquée(s) comme traitée(s)`);
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors du traitement global");
    }
  }, [alertes, fetchGlobalStats, fetchAlertes]);

  const ignorerToutVisibles = useCallback(async () => {
    const toIgnore = alertes.filter(a => !a.traitee && !a.ignoree);
    if (toIgnore.length === 0) {
      toast.info("Aucune alerte active à archiver dans cette vue.");
      return;
    }
    try {
      await Promise.all(toIgnore.map(a => alerteService.ignorer(a.id)));
      toast.success(`${toIgnore.length} alerte(s) archivée(s)`);
      fetchGlobalStats();
      fetchAlertes();
    } catch (err) {
      toast.error("Erreur lors de l'archivage global");
    }
  }, [alertes, fetchGlobalStats, fetchAlertes]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setFilter('');
  }, []);

  const filtersActifs = filter !== '' || search !== '';

  // Pour la barre collante, savoir si la sélection contient des alertes actives ou ignorées
  const selectionHasActive = [...selection].some(id => {
    const a = alertes.find(x => x.id === id);
    return a && !a.traitee && !a.ignoree;
  });
  const selectionHasIgnoree = [...selection].some(id => {
    const a = alertes.find(x => x.id === id);
    return a && a.ignoree;
  });

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 min-h-screen bg-gray-50/30 relative">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes Stock</h1>
          <p className="text-sm text-gray-500">Surveillance des niveaux critiques et des ruptures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={traiterToutVisibles} 
            disabled={loading}
            className="rounded-xl gap-1.5 text-[#1D6F42] border-[#1D6F42]/30 hover:bg-[#F1F8E9] hover:text-[#1D6F42] shadow-sm"
          >
            <CheckCheck className="h-4 w-4" /> Traiter tout
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={ignorerToutVisibles} 
            disabled={loading}
            className="rounded-xl gap-1.5 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
          >
            <Archive className="h-4 w-4" /> Ignorer tout
          </Button>
          {filtersActifs && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters} 
              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl gap-1"
            >
              <X className="h-4 w-4" /> Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* KPIs – utilisent les statistiques globales, insensibles aux filtres */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Bell}
          label="Total alertes"
          value={globalStats.total}
          colorClass="#1D6F42"
          bgClass="bg-[#E8F5E9]"
          isActive={isKpiActive('all')}
          onClick={() => { setFilter(''); setSearch(''); }}
        />
        <KpiCard
          icon={AlertCircle}
          label="Critiques"
          value={globalStats.critiques}
          colorClass="#B71C1C"
          bgClass="bg-[#FFEBEE]"
          isActive={isKpiActive('critiques')}
          onClick={() => { setFilter('CRITIQUE'); setSearch(''); }}
        />
        <KpiCard
          icon={AlertTriangle}
          label="Faibles"
          value={globalStats.faibles}
          colorClass="#E65100"
          bgClass="bg-[#FFF3E0]"
          isActive={isKpiActive('faibles')}
          onClick={() => { setFilter('FAIBLE'); setSearch(''); }}
        />
        <KpiCard
          icon={CheckCircle}
          label="Traitées"
          value={globalStats.traitees}
          colorClass="#6A1B9A"
          bgClass="bg-[#F3E5F5]"
          isActive={isKpiActive('traitees')}
          onClick={() => { setFilter('traitee'); setSearch(''); }}
        />
      </div>

      {/* Barre d'action de masse (Sticky) */}
      {selection.size > 0 && (
        <div className="sticky top-4 z-40 bg-indigo-50 text-indigo-900 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between shadow-xl mb-4 animate-in slide-in-from-top-2 border border-indigo-200 gap-3">
          <div className="flex items-center gap-3">
            <span className="bg-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm border border-indigo-100 text-indigo-800">
              {selection.size} sélectionnée(s)
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectionHasActive && (
              <>
                <Button size="sm" variant="ghost" className="text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 rounded-xl" onClick={traiterSelection}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Traiter sélection
                </Button>
                <Button size="sm" variant="ghost" className="text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 rounded-xl" onClick={ignorerSelection}>
                  <Archive className="w-4 h-4 mr-2" /> Archiver sélection
                </Button>
              </>
            )}
            {selectionHasIgnoree && (
              <Button size="sm" variant="ghost" className="text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 rounded-xl" onClick={reactiverSelection}>
                <RotateCcw className="w-4 h-4 mr-2" /> Réactiver sélection
              </Button>
            )}
            <div className="w-px h-5 bg-indigo-200 mx-1 hidden sm:block" />
            <Button size="sm" variant="ghost" className="text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 rounded-xl" onClick={() => setSelection(new Set())}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Barre de recherche + Filtres */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm p-4 md:px-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#1D6F42]" />
            <h3 className="font-bold text-gray-900 text-sm">Liste des Alertes</h3>
            {alertes.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">{alertes.length}</Badge>
            )}
          </div>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Recherche (réf, produit)..."
                className="pl-9 h-9 text-sm border-gray-200 rounded-xl focus-visible:ring-[#1D6F42]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <FilterBadge label="Toutes" isActive={filter === ''} onClick={() => setFilter('')} />
              <FilterBadge label="Critiques" isActive={filter === 'CRITIQUE'} onClick={() => setFilter('CRITIQUE')} />
              <FilterBadge label="Faibles" isActive={filter === 'FAIBLE'} onClick={() => setFilter('FAIBLE')} />
              <FilterBadge label="Surveillance" isActive={filter === 'SURVEILLANCE'} onClick={() => setFilter('SURVEILLANCE')} />
              <div className="mx-1 h-6 w-px bg-gray-200" />
              <FilterBadge label="Non traitées" isActive={filter === 'non_traitee'} onClick={() => setFilter('non_traitee')} />
              <FilterBadge label="Traitées" isActive={filter === 'traitee'} onClick={() => setFilter('traitee')} />
              <FilterBadge label="Ignorées" isActive={filter === 'ignoree'} onClick={() => setFilter('ignoree')} />
            </div>
          </div>
        </div>
      </div>

      {/* Header Sélection globale (si liste non vide) */}
      {alertes.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl mb-3 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="text-gray-400 hover:text-[#1D6F42] transition-colors ml-1" title="Sélectionner tout">
              {selection.size === alertes.length ? <CheckSquare className="w-5 h-5 text-[#1D6F42]" /> : <Square className="w-5 h-5" />}
            </button>
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider text-[10px]">Sélectionner tout</span>
          </div>
        </div>
      )}

      {/* Liste des alertes */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
            <p className="text-sm font-medium">Chargement des alertes...</p>
          </div>
        ) : alertes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucune alerte trouvée</p>
            <p className="text-xs mt-1">Modifiez les filtres ou la recherche.</p>
          </div>
        ) : (
          alertes.map(alerte => {
            const config = TYPE_CONFIG[alerte.type] ?? TYPE_CONFIG.SURVEILLANCE;
            const Icon = config.icon;
            const isSelected = selection.has(alerte.id);

            return (
              <div
                key={alerte.id}
                className={cn(
                  "bg-white rounded-2xl border p-4 transition-all group flex items-start gap-4",
                  alerte.ignoree ? "opacity-50 bg-slate-50 border-slate-200" :
                  alerte.traitee ? "opacity-70 border-gray-200" : "border-gray-100 hover:border-gray-300 hover:shadow-md cursor-pointer",
                  !alerte.traitee && !alerte.ignoree && alerte.type === 'CRITIQUE' && "border-l-4 border-l-red-500",
                  isSelected && "border-[#1D6F42] ring-1 ring-[#1D6F42] bg-[#F1F8E9]/40"
                )}
                onClick={() => setDetailAlerte(alerte)}
              >
                {/* Case à cocher */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelection(alerte.id); }}
                  className="mt-2.5 text-gray-300 hover:text-[#1D6F42] transition-colors"
                >
                  {isSelected ? <CheckSquare className="w-5 h-5 text-[#1D6F42]" /> : <Square className="w-5 h-5" />}
                </button>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: config.iconColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className={cn(
                            "text-[10px] font-bold rounded-full px-2 py-0.5 border uppercase tracking-wider",
                            config.badgeClass
                          )}
                        >
                          {config.label}
                        </span>
                        {alerte.traitee && (
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 flex items-center gap-1 font-semibold">
                            <CheckCircle className="w-2.5 h-2.5" /> Traitée
                          </span>
                        )}
                        {alerte.ignoree && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-300 rounded-full px-2 py-0.5 flex items-center gap-1 font-semibold">
                            <Archive className="w-2.5 h-2.5" /> Archivée
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">{alerte.message}</p>
                      <div className="flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span className="font-mono text-[#0d3b66]">{alerte.produitCode}</span>
                        </span>
                        <span className="flex items-center gap-1">
                           <Clock className="w-3 h-3" /> {new Date(alerte.dateCreation).toLocaleDateString('fr-MA')}
                        </span>
                        <span className={cn(
                          "font-bold",
                          alerte.stockDisponible <= 0 ? "text-red-600" : "text-amber-600"
                        )}>
                          Stock dispo : {alerte.stockDisponible} {alerte.uniteMesure}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                       {!alerte.ignoree && !alerte.traitee && (
                        <a
                          href="/dashboard/responsable/achats"
                          className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Commander</span>
                        </a>
                       )}
                       
                       {!alerte.ignoree && !alerte.traitee && (
                         <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1.5 text-xs rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            onClick={() => marquerIgnoree(alerte.id)}
                            title="Archiver l'alerte"
                          >
                            <Archive className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Archiver</span>
                         </Button>
                       )}

                       {alerte.ignoree && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 text-xs rounded-xl text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                            onClick={() => reactiverAlerte(alerte.id)}
                            title="Réactiver l'alerte"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Réactiver</span>
                          </Button>
                       )}

                      {!alerte.traitee && !alerte.ignoree && (
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 text-xs rounded-xl bg-[#1D6F42] hover:bg-[#155430] hover:text-white text-white shadow-sm"
                          onClick={() => marquerTraitee(alerte.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> 
                          <span className="hidden sm:inline">Traiter</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialogue détail */}
      {detailAlerte && (
        <DetailAlerteDialog
          alerte={detailAlerte}
          onClose={() => setDetailAlerte(null)}
          onMarquerTraitee={marquerTraitee}
          onMarquerIgnoree={marquerIgnoree}
          onReactiver={reactiverAlerte}
        />
      )}
    </main>
  );
}