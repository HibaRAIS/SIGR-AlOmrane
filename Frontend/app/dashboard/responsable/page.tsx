'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Package, AlertTriangle, ClipboardCheck, TrendingUp,
  ShoppingCart, Bell, ArrowUpRight, ArrowDownRight,
  ChevronRight, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPill } from '@/components/shared/StatusPill';
import { catalogueService } from '@/services/catalogue.service';
import { alerteService } from '@/services/alerte.service';
import { mouvementService, MouvementResponse } from '@/services/mouvement.service';
import { sortieService } from '@/services/sortie.service';
import { receptionService } from '@/services/reception.service';
import type { Product } from '@/types/catalogue';
import type { AlerteStockDTO } from '@/services/alerte.service';
import type { DemandeResponseResponsable } from '@/types/sortie';
import type { ReceptionDto } from '@/types/reception';

const PIE_COLORS = ['#1D6F42', '#1565C0', '#E65100', '#6A1B9A', '#F9A825', '#00838F'];

const fmtCurrency = (value: number): string =>
  new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(value);

const fmtNumber = (value: number): string =>
  new Intl.NumberFormat('fr-MA', { maximumFractionDigits: 0 }).format(value);

function KpiCard({
  title, value, subtitle, icon: Icon, trend, trendLabel, color, onClick
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color: 'green' | 'blue' | 'orange' | 'red';
  onClick?: () => void;
}) {
  const colors = {
    green: { bg: '#E8F5E9', icon: '#1D6F42', text: '#1B5E20', border: '#A5D6A7' },
    blue: { bg: '#E3F2FD', icon: '#1565C0', text: '#0D47A1', border: '#90CAF9' },
    orange: { bg: '#FFF3E0', icon: '#E65100', text: '#BF360C', border: '#FFCC80' },
    red: { bg: '#FFEBEE', icon: '#B71C1C', text: '#7F0000', border: '#EF9A9A' },
  };
  const c = colors[color];

  return (
    <div
      className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: c.bg }}>
          <Icon className="w-6 h-6" style={{ color: c.icon }} />
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5',
          trend === 'up' ? 'text-green-700 bg-green-50' :
          trend === 'down' ? 'text-red-700 bg-red-50' : 'text-gray-500 bg-gray-50'
        )}>
          {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
          {trendLabel}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 mb-0.5">{value}</div>
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-400 mt-1">{subtitle}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [alertes, setAlertes] = useState<AlerteStockDTO[]>([]);
  const [mouvements, setMouvements] = useState<MouvementResponse[]>([]);
  const [demandes, setDemandes] = useState<DemandeResponseResponsable[]>([]);
  const [receptions, setReceptions] = useState<ReceptionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const [productsRes, alertesRes, mouvementsRes, demandesRes, receptionsRes] = await Promise.all([
          catalogueService.getAll({ page: 0, size: 9999 }),
          alerteService.getAll({ ignoree: false, traitee: false }),
          mouvementService.getAll({
            page: 0,
            size: 99999,
            startDate: thirtyDaysAgo.toISOString(),
            endDate: today.toISOString()
          }),
          sortieService.getDemandes(),
          receptionService.getAll({ page: 0, size: 10 })
        ]);

        setProducts(productsRes.content);
        setAlertes(alertesRes);
        setMouvements(mouvementsRes.content);
        setDemandes(demandesRes);
        setReceptions(receptionsRes.content);
      } catch (err) {
        console.error('Erreur chargement tableau de bord', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const kpiData = useMemo(() => {
    const totalArticles = products.length;
    const articlesRupture = products.filter(p => p.quantiteTheorique <= p.minThreshold).length;
    const demandesValidees = demandes.filter(d => d.statut === 'VALIDEE').length;
    const valeurTotaleStock = products.reduce((sum, p) => sum + p.quantiteTheorique * p.avgPrice, 0);
    const alertesCritiques = alertes.filter(a => a.type === 'CRITIQUE').length;
    const todayMouvements = mouvements.filter(m => {
      const mDate = new Date(m.date);
      const today = new Date();
      return mDate.toDateString() === today.toDateString();
    });
    const mouvementsJour = todayMouvements.length;

    return {
      totalArticles,
      articlesRupture,
      demandesValidees,
      valeurTotaleStock,
      alertesCritiques,
      mouvementsJour
    };
  }, [products, alertes, demandes, mouvements]);

  const mouvementsChart = useMemo(() => {
    const points: { date: string; entrees: number; sorties: number }[] = [];
    const endDate = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      const dayMouvs = mouvements.filter(m => {
        const mDate = new Date(m.date);
        return mDate.toDateString() === d.toDateString();
      });
      points.push({
        date: dateStr,
        entrees: dayMouvs.filter(m => m.type === 'ENTREE').reduce((s, m) => s + m.valeurFlux, 0),
        sorties: dayMouvs.filter(m => m.type === 'SORTIE').reduce((s, m) => s + m.valeurFlux, 0)
      });
    }
    return points;
  }, [mouvements]);

  const topCategories = useMemo(() => {
    const map = new Map<string, { valeur: number; articles: number }>();
    products.forEach(p => {
      const cat = p.category || 'Sans catégorie';
      if (!map.has(cat)) map.set(cat, { valeur: 0, articles: 0 });
      const entry = map.get(cat)!;
      entry.valeur += p.quantiteTheorique * p.avgPrice;
      entry.articles += 1;
    });
    return Array.from(map.entries())
      .map(([categorie, data]) => ({ categorie, valeur: data.valeur, articles: data.articles }))
      .sort((a, b) => b.valeur - a.valeur)
      .slice(0, 6);
  }, [products]);

  const categoryMouvementData = useMemo(() => {
    const catMap = new Map<string, { entrees: number; sorties: number }>();
    const productCat = new Map<string, string>();
    products.forEach(p => productCat.set(p.code, p.category || 'Sans catégorie'));

    mouvements.forEach(m => {
      const cat = productCat.get(m.codeArticle) || 'Sans catégorie';
      if (!catMap.has(cat)) catMap.set(cat, { entrees: 0, sorties: 0 });
      const entry = catMap.get(cat)!;
      if (m.type === 'ENTREE') {
        entry.entrees += m.valeurFlux;
      } else if (m.type === 'SORTIE') {
        entry.sorties += m.valeurFlux;
      }
    });
    return Array.from(catMap.entries())
      .map(([categorie, data]) => ({ categorie, ...data }))
      .sort((a, b) => (b.entrees + b.sorties) - (a.entrees + a.sorties));
  }, [mouvements, products]);

  const latestDemandes = useMemo(() => demandes.slice(0, 5), [demandes]);
  const latestCommandes = useMemo(() => receptions.slice(0, 5).map(r => ({
    id: r.id,
    numero: r.numero,
    statut: r.statut,
    fournisseur: r.commande?.fournisseur?.nom ?? 'N/A',
    montantTotalHT: r.totalHT
  })), [receptions]);

  const activeAlertes = useMemo(() => alertes.slice(0, 5), [alertes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D6F42]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1D6F42] to-[#2e8b57] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)'
          }} />
        </div>
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Bonjour, Hassan Alaoui</h2>
            <p className="text-green-200 text-sm">
              Responsable Logistique · Al Omrane · {new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold">{kpiData.alertesCritiques}</div>
              <div className="text-[11px] text-green-200">Alertes critiques</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold">{kpiData.mouvementsJour}</div>
              <div className="text-[11px] text-green-200">Mouvements aujourd'hui</div>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
              <div className="text-xl font-bold">{kpiData.demandesValidees}</div>
              <div className="text-[11px] text-green-200">Demandes validées</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Articles catalogue"
          value={kpiData.totalArticles}
          subtitle="Produits actifs en stock"
          icon={Package}
          trend="up"
          trendLabel="+3 ce mois"
          color="green"
        />
        <KpiCard
          title="Articles en rupture"
          value={kpiData.articlesRupture}
          subtitle="Nécessitent commande urgente"
          icon={AlertTriangle}
          trend="down"
          trendLabel="Action requise"
          color="red"
        />
        <KpiCard
          title="Demandes validées"
          value={kpiData.demandesValidees}
          subtitle="En attente de préparation"
          icon={ClipboardCheck}
          trend="up"
          trendLabel="Ce mois"
          color="blue"
        />
        <KpiCard
          title="Valeur du stock"
          value={fmtCurrency(kpiData.valeurTotaleStock)}
          subtitle="Prix moyen pondéré"
          icon={TrendingUp}
          trend="up"
          trendLabel="+8.2%"
          color="green"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Mouvements 30j */}
        <div className="xl:col-span-2 bg-white rounded-2xl border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Mouvements des 30 derniers jours</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Entrées, sorties et ajustements en valeur (MAD)</p>
            </div>
            <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors">
              <RefreshCw className="w-3 h-3" />
              Actualiser
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={mouvementsChart} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1D6F42" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1D6F42" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1565C0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1565C0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                formatter={(val: number) => [`${val.toLocaleString('fr-MA')} MAD`]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="entrees" stroke="#1D6F42" strokeWidth={2} fill="url(#colorEntrees)" name="Entrées" dot={false} />
              <Area type="monotone" dataKey="sorties" stroke="#1565C0" strokeWidth={2} fill="url(#colorSorties)" name="Sorties" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Valeur par catégorie (avec valeurs exactes) */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900">Valeur par catégorie</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">Répartition du stock en valeur MAD</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={topCategories}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                dataKey="valeur"
                stroke="none"
              >
                {topCategories.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: 11 }}
                formatter={(val: number) => [fmtCurrency(val)]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {topCategories.slice(0, 4).map((cat, i) => (
              <div key={cat.categorie} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                <span className="text-xs text-gray-600 flex-1 truncate">{cat.categorie}</span>
                <span className="text-xs font-semibold text-gray-900">{fmtCurrency(cat.valeur)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Entrées vs Sorties + Alertes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Catégories — Entrées vs Sorties</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Volume de mouvements par catégorie (MAD)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryMouvementData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="categorie" tick={{ fontSize: 9, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f0f0f0', fontSize: 11 }} />
              <Legend />
              <Bar dataKey="entrees" fill="#1D6F42" radius={[4, 4, 0, 0]} name="Entrées (MAD)" />
              <Bar dataKey="sorties" fill="#E65100" radius={[4, 4, 0, 0]} name="Sorties (MAD)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-red-500" />
              Alertes actives
            </h3>
            <span className="text-[11px] text-gray-400">{alertes.length} non traitées</span>
          </div>
          <div className="space-y-2">
            {activeAlertes.map((alerte) => (
              <div
                key={alerte.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border',
                  alerte.type === 'CRITIQUE' ? 'bg-red-50 border-red-100' :
                  alerte.type === 'FAIBLE' ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100'
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                  alerte.type === 'CRITIQUE' ? 'bg-red-500 pulse-dot' :
                  alerte.type === 'FAIBLE' ? 'bg-orange-400' : 'bg-yellow-400'
                )} />
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-700 leading-relaxed line-clamp-2">{alerte.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Dernières demandes</h3>
            <a href="/dashboard/responsable/sorties" className="text-xs text-[#1D6F42] hover:underline font-semibold flex items-center gap-1">
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {latestDemandes.map((dem) => (
              <div key={dem.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{dem.numeroDemande}</span>
                    <StatusPill status={dem.statut} size="sm" />
                    <StatusPill status={dem.priorite === 'NORMAL' ? 'NORMAL' : dem.priorite} size="sm" />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {dem.employeNom} · {dem.structureNom}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-gray-400">{new Date(dem.dateDemande).toLocaleDateString('fr-MA')}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{dem.lignes.length} article(s)</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Commandes fournisseurs</h3>
            <a href="/dashboard/responsable/receptions" className="text-xs text-[#1D6F42] hover:underline font-semibold flex items-center gap-1">
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {latestCommandes.map((cmd) => (
              <div key={cmd.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/60 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#E3F2FD] flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-[#1565C0]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{cmd.numero}</span>
                    <StatusPill status={cmd.statut} size="sm" />
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{cmd.fournisseur}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900">
                    {fmtNumber(cmd.montantTotalHT)} MAD
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">HT</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}