"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, AlertCircle,
  Package, Users, FileText, ArrowRight, Activity, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { demandeService } from "@/services/demande.service";
import { DemandeResponse } from "@/types/demande";
const AL_OMRANE_GREEN = "#1D6F42";

interface ActivityItem {
  id: number;
  type: "approved" | "rejected" | "submitted" | "pending";
  title: string;
  employee: string;
  time: string;
  items: number;
  priority?: "critique" | "urgente" | "normale";
  demandeId: number;
  reference: string;
  link: string;
}

export default function DashboardChef() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);

  const fetchDemandes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await demandeService.getDemandesPourChef();
      setDemandes(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur de chargement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  // ---------- Périodes pour les tendances ----------
const { startCurrent, startPrevious } = useMemo(() => {
  const now = new Date();

  const current = new Date(now);
  current.setDate(current.getDate() - 30);

  const previous = new Date(current);
  previous.setDate(previous.getDate() - 30);

  return {
    startCurrent: current,
    startPrevious: previous,
  };
}, []);

// ---------- Filtrage optimisé (1 seule boucle) ----------
const { demandesCurrent, demandesPrevious } = useMemo(() => {
  const current: any[] = [];
  const previous: any[] = [];

  for (const d of demandes) {
    const date = new Date(d.dateDemande);

    if (date >= startCurrent) {
      current.push(d);
    } else if (date >= startPrevious && date < startCurrent) {
      previous.push(d);
    }
  }

  return { demandesCurrent: current, demandesPrevious: previous };
}, [demandes, startCurrent, startPrevious]);

// ---------- KPIs calculés avec tendances dynamiques ----------
const kpis = useMemo(() => {

  //  Utils internes (évite répétition)
  const countByStatus = (list: any[], status: string) =>
    list.filter(d => d.statut === status).length;

  const countUniqueEmployees = (list: any[]) =>
    new Set(list.map(d => d.employeNom)).size;

  const calcTrend = (current: number, prev: number): number => {
    if (prev === 0) {
      return current === 0 ? 0 : 100; // comportement maîtrisé
    }
    return Math.round(((current - prev) / prev) * 100);
  };

  // --- Current ---
  const pendingCurrent = countByStatus(demandesCurrent, "EN_VALIDATION");
  const approvedCurrent = countByStatus(demandesCurrent, "VALIDEE");
  const rejectedCurrent = countByStatus(demandesCurrent, "REFUSEE");
  const uniqueEmployeesCurrent = countUniqueEmployees(demandesCurrent);

  // --- Previous ---
  const pendingPrev = countByStatus(demandesPrevious, "EN_VALIDATION");
  const approvedPrev = countByStatus(demandesPrevious, "VALIDEE");
  const rejectedPrev = countByStatus(demandesPrevious, "REFUSEE");
  const uniqueEmployeesPrev = countUniqueEmployees(demandesPrevious);

  return [
    {
      id: "pending",
      title: "En attente",
      value: pendingCurrent,
      trend: calcTrend(pendingCurrent, pendingPrev),
      trendLabel: "vs période précédente",
      icon: <Clock className="w-6 h-6" />,
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      link: "/dashboard/chef/validation"
    },
    {
      id: "approved",
      title: "Approuvées",
      value: approvedCurrent,
      trend: calcTrend(approvedCurrent, approvedPrev),
      trendLabel: "vs période précédente",
      icon: <CheckCircle2 className="w-6 h-6" />,
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      link: "/dashboard/chef/demandes?statut=approuvee"
    },
    {
      id: "rejected",
      title: "Rejetées",
      value: rejectedCurrent,
      trend: calcTrend(rejectedCurrent, rejectedPrev),
      trendLabel: "vs période précédente",
      icon: <XCircle className="w-6 h-6" />,
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      link: "/dashboard/chef/demandes?statut=rejetee"
    },
    {
      id: "total-team",
      title: "Équipe",
      value: uniqueEmployeesCurrent,
      trend: calcTrend(uniqueEmployeesCurrent, uniqueEmployeesPrev),
      trendLabel: "Employés actifs",
      icon: <Users className="w-6 h-6" />,
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      link: "#"
    }
  ];

}, [demandesCurrent, demandesPrevious]);

  // ---------- Activités récentes (5 dernières demandes) ----------
  const recentActivities = useMemo<ActivityItem[]>(() => {
    return demandes
      .sort((a, b) => new Date(b.dateDemande).getTime() - new Date(a.dateDemande).getTime())
      .slice(0, 5)
      .map(d => {
        let type: ActivityItem["type"] = "pending";
        let title = "";
        let link = "/dashboard/chef/demandes";

        if (d.statut === "EN_VALIDATION") {
          type = "pending";
          title = "Demande en attente";
          link = "/dashboard/chef/validation";
        } else if (d.statut === "VALIDEE") {
          type = "approved";
          title = "Demande approuvée";
          link = "/dashboard/chef/demandes?statut=approuvee";
        } else if (d.statut === "REFUSEE") {
          type = "rejected";
          title = "Demande rejetée";
          link = "/dashboard/chef/demandes?statut=rejetee";
        } else {
          type = "submitted";
          title = "Demande soumise";
          link = "/dashboard/chef/demandes";
        }

        let priority: "critique" | "urgente" | "normale" | undefined;
        if (d.priorite === "CRITIQUE") priority = "critique";
        else if (d.priorite === "URGENT") priority = "urgente";
        else if (d.priorite === "NORMAL") priority = "normale";

        const timeAgo = (dateStr: string) => {
          const diff = Date.now() - new Date(dateStr).getTime();
          const days = Math.floor(diff / 86400000);
          if (days === 0) return "Aujourd'hui";
          if (days === 1) return "Hier";
          if (days < 7) return `Il y a ${days}j`;
          return new Date(dateStr).toLocaleDateString("fr-FR");
        };

        return {
          id: d.id,
          type,
          title,
          employee: d.employeNom,
          time: timeAgo(d.dateDemande),
          items: d.lignes.length,
          priority,
          demandeId: d.id,
          reference: d.numeroDemande,
          link
        };
      });
  }, [demandes]);

  // ---------- Métriques avancées ----------
const metrics = useMemo(() => {
  const total = demandes.length;
  const approved = demandes.filter(d => d.statut === "VALIDEE").length;
  const rejected = demandes.filter(d => d.statut === "REFUSEE").length;
  // ✅ Taux d'approbation basé sur les demandes traitées
  const totalTraitees = approved + rejected;
  const approvalRate = totalTraitees === 0 ? 0 : (approved / totalTraitees) * 100;

  let totalProcessingDays = 0;
  let processedCount = 0;
  demandes.forEach(d => {
    if (d.dateValidation) {
      const start = new Date(d.dateDemande);
      const end = new Date(d.dateValidation);
      const days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      totalProcessingDays += days;
      processedCount++;
    }
  });
  const avgProcessingDays = processedCount === 0 ? 0 : totalProcessingDays / processedCount;

  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const monthlyCounts: Record<string, number> = {};
  demandes.forEach(d => {
    const date = new Date(d.dateDemande);
    if (date >= sixMonthsAgo) {
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyCounts[key] = (monthlyCounts[key] || 0) + 1;
    }
  });
  const avgMonthly = Object.values(monthlyCounts).reduce((a, b) => a + b, 0) / Math.max(1, Object.keys(monthlyCounts).length);

  return {
    approvalRate: Number(approvalRate.toFixed(1)), 
    avgProcessingDays: avgProcessingDays.toFixed(1),
    avgMonthlyDemands: Math.round(avgMonthly)
  };
}, [demandes]);

  // ---------- Composant KPI Card ----------
  const KPICard = ({ kpi }: { kpi: typeof kpis[0] }) => (
    <Link href={kpi.link || "#"} className="block">
      <div className={`rounded-2xl border border-gray-100 p-6 ${kpi.bgColor} transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-white/60 ${kpi.textColor}`}>{kpi.icon}</div>
          {kpi.trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${kpi.trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {kpi.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(kpi.trend)}%
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 font-medium mb-1">{kpi.title}</p>
        <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
        {kpi.trendLabel && <p className="text-xs text-gray-500 mt-2">{kpi.trendLabel}</p>}
      </div>
    </Link>
  );

  const ActivityIcon = ({ type }: { type: ActivityItem["type"] }) => {
    switch (type) {
      case "approved": return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "rejected": return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending": return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return <FileText className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: AL_OMRANE_GREEN }} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="px-6 pt-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
            <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble des demandes d&apos;approvisionnement</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => <KPICard key={kpi.id} kpi={kpi} />)}
        </div>
      </div>

      {/* Main Grid */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activités Récentes */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5" style={{ color: AL_OMRANE_GREEN }} />
                Activités Récentes
              </h2>
              <Link href="/dashboard/chef/demandes" className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1">
                Voir tout <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivities.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune activité récente</p>
                </div>
              ) : (
                recentActivities.map((activity, idx) => (
                  <Link
                    key={activity.id}
                    href={activity.link}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className={`px-6 py-4 ${idx === recentActivities.length - 1 ? "" : "border-b border-gray-100"}`}>
                      <div className="flex items-start gap-4">
                        <div className="mt-1"><ActivityIcon type={activity.type} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                            {activity.priority && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                activity.priority === "critique" ? "bg-red-100 text-red-700" :
                                activity.priority === "urgente" ? "bg-amber-100 text-amber-700" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {activity.priority === "critique" ? "Critique" :
                                 activity.priority === "urgente" ? "Urgente" : "Normale"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{activity.employee}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>{activity.time}</span>
                            <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {activity.items} article(s)</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Métriques de Performance */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Performance</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Taux d'approbation</p>
                <p className="text-sm font-semibold text-gray-900">{metrics.approvalRate.toFixed(1)}%</p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${metrics.approvalRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Demandes / mois (moyenne)</p>
                <p className="text-sm font-semibold text-gray-900">{metrics.avgMonthlyDemands}</p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (metrics.avgMonthlyDemands / 50) * 100)}%`, backgroundColor: AL_OMRANE_GREEN }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Temps moyen traitement</p>
                <p className="text-sm font-semibold text-gray-900">{metrics.avgProcessingDays} jours</p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(100, (parseFloat(metrics.avgProcessingDays) / 10) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Synthèse supplémentaire */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Synthèse</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-600">Total demandes</span>
                <span className="text-sm font-bold text-gray-900">{demandes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-600">Taux de rejet</span>
                <span className="text-sm font-bold text-gray-900">
                  {demandes.length ? Math.round((demandes.filter(d => d.statut === "REFUSEE").length / demandes.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}