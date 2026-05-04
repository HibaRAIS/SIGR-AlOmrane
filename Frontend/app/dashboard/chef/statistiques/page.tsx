"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  ChevronDown, BarChart3, TrendingUp, Calendar,
  Download, Filter, Users, Package,
  Clock, CheckCircle2, TrendingDown, AlertCircle, Loader2,
  FileSpreadsheet, FileText, File
} from "lucide-react";
import { toast } from "sonner";
import { demandeService, DemandeResponse } from "@/services/demande.service";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const AL_OMRANE_GREEN = "#1D6F42";
const COLORS = [AL_OMRANE_GREEN, "#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

interface DemandesParDepartement {
  departement: string;
  soumises: number;
  approuvees: number;
  rejetees: number;
  enAttente: number;
  tauxApprobation: number;
  delaiMoyenJours: number;
}

interface TendanceMensuelle {
  mois: string;
  demandes: number;
  approuvees: number;
  rejetees: number;
  delaiMoyen: number;
}

interface StatistiqueProduit {
  produit: string;
  quantite: number;
  demandes: number;
  pourcentage: number;
}

export default function StatistiquesChef() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
  const [dateRange, setDateRange] = useState("30j");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedDept, setSelectedDept] = useState("tous");
  const dashboardRef = useRef<HTMLDivElement>(null);

  const fetchDemandes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await demandeService.getDemandesPourChef();
      setDemandes(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  // ---------- Filtrage par période ----------
  const getDateFilter = useCallback((range: string, customStart?: string, customEnd?: string) => {
    if (range === "custom" && customStart && customEnd) {
      return { start: new Date(customStart), end: new Date(customEnd) };
    }
    const now = new Date();
    let start: Date;
    switch (range) {
      case "7j": start = new Date(now.setDate(now.getDate() - 7)); break;
      case "30j": start = new Date(now.setDate(now.getDate() - 30)); break;
      case "90j": start = new Date(now.setDate(now.getDate() - 90)); break;
      default: start = new Date(0);
    }
    return { start, end: new Date() };
  }, []);

  const filteredDemandes = useMemo(() => {
    const { start, end } = getDateFilter(dateRange, customStartDate, customEndDate);
    return demandes.filter(d => {
      const date = new Date(d.dateDemande);
      return date >= start && date <= end;
    });
  }, [demandes, dateRange, customStartDate, customEndDate, getDateFilter]);

 // ---------- Période précédente pour tendances ----------
const previousPeriodDemandes = useMemo(() => {
  const { start, end } = getDateFilter(dateRange, customStartDate, customEndDate);

  const duration = end.getTime() - start.getTime();

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - duration);

  return demandes.filter(d => {
    const date = new Date(d.dateDemande);
    return date >= prevStart && date <= prevEnd;
  });
}, [demandes, dateRange, customStartDate, customEndDate, getDateFilter]);

// ---------- Filtrage par département ----------
const filteredByDept = useMemo(() => {
  if (selectedDept === "tous") return filteredDemandes;
  return filteredDemandes.filter(
    d => (d.structureNom || "Inconnu") === selectedDept
  );
}, [filteredDemandes, selectedDept]);

const previousByDept = useMemo(() => {
  if (selectedDept === "tous") return previousPeriodDemandes;
  return previousPeriodDemandes.filter(
    d => (d.structureNom || "Inconnu") === selectedDept
  );
}, [previousPeriodDemandes, selectedDept]);

// ---------- KPIs globaux avec tendances ----------
const globalStats = useMemo(() => {
  // Utilitaires
  const countByStatus = (list: any[], status: string) =>
    list.filter(d => d.statut === status).length;

  const calcAvgDelay = (list: any[]) => {
    let total = 0, count = 0;
    for (const d of list) {
      if (d.dateValidation) {
        total += (new Date(d.dateValidation).getTime() - new Date(d.dateDemande).getTime()) / (1000 * 3600 * 24);
        count++;
      }
    }
    return count === 0 ? 0 : total / count;
  };

  // Fonction de calcul des trends (identique au Dashboard)
  const calcTrend = (current: number, prev: number): number => {
    if (prev === 0) {
      return current === 0 ? 0 : 100; // Pas de base = hausse de 100%
    }
    return Math.round(((current - prev) / prev) * 100);
  };

  // --- Données courantes ---
  const total = filteredByDept.length;
  const approuvees = countByStatus(filteredByDept, "VALIDEE");
  const rejetees = countByStatus(filteredByDept, "REFUSEE");
  const enAttente = countByStatus(filteredByDept, "EN_VALIDATION");
  const totalTraitees = approuvees + rejetees;
  const tauxApprobation = totalTraitees === 0 ? 0 : (approuvees / totalTraitees) * 100;
  const delaiMoyen = calcAvgDelay(filteredByDept);

  // --- Données précédentes ---
  const prevTotal = previousByDept.length;
  const prevApprouvees = countByStatus(previousByDept, "VALIDEE");
  const prevRejetees = countByStatus(previousByDept, "REFUSEE");
  const prevTraitees = prevApprouvees + prevRejetees;
  const prevTaux = prevTraitees === 0 ? 0 : (prevApprouvees / prevTraitees) * 100;
  const prevDelai = calcAvgDelay(previousByDept);

  // --- Tendances ---
  const trendTotal = calcTrend(total, prevTotal);
  const trendTaux = calcTrend(tauxApprobation, prevTaux);
  const trendDelaiRaw = calcTrend(delaiMoyen, prevDelai); 
  

  return {
    total,
    approuvees,
    rejetees,
    enAttente,
    tauxApprobation: Number(tauxApprobation.toFixed(1)),
    delaiMoyen: Number(delaiMoyen.toFixed(1)),
    trendTotal,
    trendTaux,
    trendDelaiRaw,
  };
}, [filteredByDept, previousByDept]);

  // ---------- Données par département ----------
const demandesParDepartement = useMemo<DemandesParDepartement[]>(() => {
  const map = new Map<string, DemandesParDepartement>();
  filteredByDept.forEach(d => {
    const dept = d.structureNom || "Inconnu";
    if (!map.has(dept)) {
      map.set(dept, { departement: dept, soumises: 0, approuvees: 0, rejetees: 0, enAttente: 0, tauxApprobation: 0, delaiMoyenJours: 0 });
    }
    const entry = map.get(dept)!;
    entry.soumises++;
    if (d.statut === "VALIDEE") entry.approuvees++;
    else if (d.statut === "REFUSEE") entry.rejetees++;
    else if (d.statut === "EN_VALIDATION") entry.enAttente++;
  });

  const result = Array.from(map.keys()).map(dept => {
    let totalJours = 0, count = 0;
    filteredByDept.forEach(d => {
      if ((d.structureNom || "Inconnu") === dept && d.dateValidation) {
        totalJours += (new Date(d.dateValidation).getTime() - new Date(d.dateDemande).getTime()) / (1000 * 3600 * 24);
        count++;
      }
    });
    const entry = map.get(dept)!;
    // ✅ Définir la variable avant de l'utiliser
    const totalTraiteesDept = entry.approuvees + entry.rejetees;
    return {
      ...entry,
      delaiMoyenJours: count === 0 ? 0 : totalJours / count,
      tauxApprobation: totalTraiteesDept === 0 ? 0 : (entry.approuvees / totalTraiteesDept) * 100
    };
  });
  return result.sort((a, b) => b.soumises - a.soumises);
}, [filteredByDept]);

  // ---------- Tendance mensuelle (6 mois) ----------
  const tendanceMensuelle = useMemo<TendanceMensuelle[]>(() => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    const months: Record<string, TendanceMensuelle> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(sixMonthsAgo);
      d.setMonth(sixMonthsAgo.getMonth() + i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      months[key] = {
        mois: d.toLocaleDateString("fr-FR", { month: "short" }),
        demandes: 0, approuvees: 0, rejetees: 0, delaiMoyen: 0
      };
    }
    filteredByDept.forEach(d => {
      const date = new Date(d.dateDemande);
      if (date >= sixMonthsAgo) {
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (months[key]) {
          months[key].demandes++;
          if (d.statut === "VALIDEE") months[key].approuvees++;
          if (d.statut === "REFUSEE") months[key].rejetees++;
        }
      }
    });
    // Délai moyen par mois
    const monthDelays: Record<string, { total: number; count: number }> = {};
    filteredByDept.forEach(d => {
      if (!d.dateValidation) return;
      const date = new Date(d.dateDemande);
      if (date >= sixMonthsAgo) {
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!monthDelays[key]) monthDelays[key] = { total: 0, count: 0 };
        const jours = (new Date(d.dateValidation).getTime() - date.getTime()) / (1000 * 3600 * 24);
        monthDelays[key].total += jours;
        monthDelays[key].count++;
      }
    });
    Object.keys(months).forEach(key => {
      const delay = monthDelays[key];
      months[key].delaiMoyen = delay ? delay.total / delay.count : 0;
    });
    return Object.values(months);
  }, [filteredByDept]);

  // ---------- Top 5 produits ----------
  const produitsMostRequested = useMemo<StatistiqueProduit[]>(() => {
    const map = new Map<string, { quantite: number; demandes: number }>();
    filteredByDept.forEach(d => {
      d.lignes.forEach(l => {
        const nom = l.produitDesignation;
        const qte = l.quantiteAccordee ?? l.quantiteDemandee;
        if (!map.has(nom)) map.set(nom, { quantite: 0, demandes: 0 });
        const entry = map.get(nom)!;
        entry.quantite += qte;
        entry.demandes++;
      });
    });
    const totalQuantite = Array.from(map.values()).reduce((acc, v) => acc + v.quantite, 0);
    return Array.from(map.entries())
      .map(([produit, stats]) => ({
        produit,
        quantite: stats.quantite,
        demandes: stats.demandes,
        pourcentage: totalQuantite === 0 ? 0 : (stats.quantite / totalQuantite) * 100
      }))
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5);
  }, [filteredByDept]);

const tauxApprobationData = useMemo(() => {
  const total = globalStats.total;
  if (total === 0) return [];
  return [
    { name: "Approuvées", value: (globalStats.approuvees / total) * 100, color: AL_OMRANE_GREEN },
    { name: "Rejetées", value: (globalStats.rejetees / total) * 100, color: "#ef4444" },
    { name: "En attente", value: (globalStats.enAttente / total) * 100, color: "#f59e0b" }
  ];
}, [globalStats]);

  // ---------- Exports ----------
  const exportToCSV = () => {
    const rows = [
      ["Département", "Soumises", "Approuvées", "Rejetées", "En attente", "Taux approbation (%)", "Délai moyen (jours)"],
      ...demandesParDepartement.map(d => [d.departement, d.soumises, d.approuvees, d.rejetees, d.enAttente, d.tauxApprobation.toFixed(1), d.delaiMoyenJours.toFixed(1)])
    ];
    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `statistiques_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export CSV réussi");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(demandesParDepartement.map(d => ({
      Département: d.departement,
      Soumises: d.soumises,
      Approuvées: d.approuvees,
      Rejetées: d.rejetees,
      "En attente": d.enAttente,
      "Taux approbation (%)": d.tauxApprobation.toFixed(1),
      "Délai moyen (jours)": d.delaiMoyenJours.toFixed(1)
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistiques");
    XLSX.writeFile(workbook, `statistiques_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success("Export Excel réussi");
  };

  const exportToPDF = () => {
    // Ajouter une classe temporaire pour forcer le contenu principal à prendre toute la largeur
    const mainContent = document.querySelector('main');
    const sidebar = document.querySelector('.sidebar, aside, [data-sidebar="true"], .fixed.left-0, .w-64');
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.width = '100%';
    }
    if (sidebar) {
      sidebar.classList.add('print-hide-temp');
    }
    setTimeout(() => {
      window.print();
      // Restaurer après impression
      setTimeout(() => {
        if (mainContent) {
          mainContent.style.marginLeft = '';
          mainContent.style.width = '';
        }
        if (sidebar) {
          sidebar.classList.remove('print-hide-temp');
        }
      }, 100);
    }, 100);
  };

  const StatCard = ({ label, value, trend, icon: Icon, color, tooltip }: any) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5 text-white" /></div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs text-gray-600 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {tooltip && <p className="text-xs text-gray-400 mt-1">{tooltip}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: AL_OMRANE_GREEN }} />
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="w-full bg-white">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" style={{ color: AL_OMRANE_GREEN }} />
              Statistiques & Performance
            </h1>
            <p className="text-sm text-gray-500 mt-1">Analyse avancée des demandes d'approvisionnement</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Période */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 appearance-none pr-8 cursor-pointer"
              >
                <option value="7j">7 derniers jours</option>
                <option value="30j">30 derniers jours</option>
                <option value="90j">90 derniers jours</option>
                <option value="custom">Personnalisé</option>
                <option value="all">Tous les temps</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {dateRange === "custom" && (
              <div className="flex gap-2">
                <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
                <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-3 py-2 border rounded-lg text-sm" />
              </div>
            )}
            {/* Département */}
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:border-gray-300 appearance-none pr-8 cursor-pointer"
              >
                <option value="tous">Tous les départements</option>
                {demandesParDepartement.map(d => <option key={d.departement} value={d.departement}>{d.departement}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {/* Exports */}
            <div className="flex gap-2">
              <button onClick={exportToCSV} disabled={exporting} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600" title="CSV">
                <FileText className="w-5 h-5" />
              </button>
              <button onClick={exportToExcel} disabled={exporting} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-green-600" title="Excel">
                <FileSpreadsheet className="w-5 h-5" />
              </button>
               <button onClick={exportToPDF} disabled={exporting} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-red-600" title="PDF">
                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <File className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

     <div className="px-6 py-6 border-b border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard 
              label="Demandes totales" 
              value={globalStats.total} 
              trend={globalStats.trendTotal} 
              icon={Package} 
              color="bg-blue-500" 
              tooltip="vs période précédente" 
            />
            <StatCard 
              label="Approuvées" 
              value={globalStats.approuvees} 
              trend={globalStats.trendTotal} 
              icon={CheckCircle2} 
              color={`bg-[${AL_OMRANE_GREEN}]`} 
            />
            <StatCard 
              label="Taux approbation" 
              value={`${globalStats.tauxApprobation}%`} 
              trend={globalStats.trendTaux} 
              icon={TrendingUp} 
              color="bg-emerald-500" 
            />
            <StatCard 
              label="En attente" 
              value={globalStats.enAttente} 
              trend={globalStats.trendTotal}
              icon={Clock} 
              color="bg-amber-500" 
            />
            <StatCard 
              label="Délai moyen" 
              value={`${globalStats.delaiMoyen}j`} 
              trend={globalStats.trendDelaiRaw} 
              icon={Calendar} 
              color="bg-purple-500" 
              tooltip="Temps entre soumission et validation" 
            />
          </div>
        </div>

      {/* Graphiques 1 */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Répartition des statuts</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tauxApprobationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {tauxApprobationData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Tendance mensuelle (6 mois)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tendanceMensuelle}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey="demandes" stroke="#3b82f6" strokeWidth={2} name="Demandes" dot={{ fill: "#3b82f6", r: 4 }} />
              <Line type="monotone" dataKey="approuvees" stroke={AL_OMRANE_GREEN} strokeWidth={2} name="Approuvées" dot={{ fill: AL_OMRANE_GREEN, r: 4 }} />
              <Line type="monotone" dataKey="rejetees" stroke="#ef4444" strokeWidth={2} name="Rejetées" dot={{ fill: "#ef4444", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Évolution délai moyen */}
      <div className="px-6 py-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Évolution du délai moyen de traitement (jours)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tendanceMensuelle}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
              <Legend />
              <Line type="monotone" dataKey="delaiMoyen" stroke="#f59e0b" strokeWidth={2} name="Délai moyen (jours)" dot={{ fill: "#f59e0b", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demandes par département + produits */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Demandes par département</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={demandesParDepartement}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="departement" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="soumises" fill="#3b82f6" name="Soumises" radius={[8,8,0,0]} />
              <Bar dataKey="approuvees" fill={AL_OMRANE_GREEN} name="Approuvées" radius={[8,8,0,0]} />
              <Bar dataKey="rejetees" fill="#ef4444" name="Rejetées" radius={[8,8,0,0]} />
              <Bar dataKey="enAttente" fill="#f59e0b" name="En attente" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Top 5 produits les plus demandés</h2>
          <div className="space-y-4">
            {produitsMostRequested.map((p, idx) => (
              <div key={idx} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div><p className="text-sm font-semibold text-gray-900">{p.produit}</p><p className="text-xs text-gray-500 mt-0.5">{p.demandes} demande(s)</p></div>
                  <span className="text-sm font-bold text-gray-900">{p.quantite} unités</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.pourcentage * 2)}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau performance par équipe */}
      <div className="px-6 pb-6">
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Performance détaillée par équipe</h2>
            <p className="text-xs text-gray-500 mt-1">Taux d'approbation, volumes et délais moyens</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Département</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Soumises</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Approuvées</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Rejetées</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase">En attente</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Taux approbation</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Délai moyen (j)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {demandesParDepartement.map((dept, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{dept.departement}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">{dept.soumises}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-emerald-600">{dept.approuvees}</td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-red-600">{dept.rejetees}</td>
                    <td className="px-6 py-4 text-center text-sm text-amber-600">{dept.enAttente}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${dept.tauxApprobation}%`, backgroundColor: AL_OMRANE_GREEN }} /></div>
                        <span className="text-sm font-semibold text-gray-900 w-10 text-right">{dept.tauxApprobation.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-purple-600">{dept.delaiMoyenJours.toFixed(1)} j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

     </div>
  );
}