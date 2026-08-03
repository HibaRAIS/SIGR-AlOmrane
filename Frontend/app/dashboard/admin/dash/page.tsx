"use client"

import { useRouter } from "next/navigation"
import {
  Users,
  UserCheck,
  Building2,
  ShieldCheck,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  Download,
  RefreshCw,
  MoreVertical,
  Server,
  Database,
  Network,
  HardDrive
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES CONSERVÉES EXACTEMENT COMME DANS VOTRE FICHIER
// ─────────────────────────────────────────────────────────────────────────────

const activityData = [
  { name: "Lun", connexions: 120, actions: 340 },
  { name: "Mar", connexions: 145, actions: 420 },
  { name: "Mer", connexions: 132, actions: 380 },
  { name: "Jeu", connexions: 168, actions: 520 },
  { name: "Ven", connexions: 155, actions: 480 },
  { name: "Sam", connexions: 45, actions: 120 },
  { name: "Dim", connexions: 30, actions: 80 },
]

// Couleurs premium injectées directement pour garantir le rendu visuel
const roleDistribution = [
  { name: "Employé", value: 245, color: "#3B82F6" }, // Blue
  { name: "Chef de Service", value: 42, color: "#8B5CF6" }, // Indigo
  { name: "Admin", value: 8, color: "#1D6F42" }, // Emerald (Brand)
  { name: "Resp. Logistique", value: 15, color: "#F59E0B" }, // Amber
]

const recentActivities = [
  { id: 1, user: "Mohammed Alami", action: "Connexion réussie", time: "Il y a 2 min", type: "success" },
  { id: 2, user: "Fatima Benali", action: "Modification de permission", time: "Il y a 15 min", type: "warning" },
  { id: 3, user: "Ahmed Tazi", action: "Création d'utilisateur", time: "Il y a 32 min", type: "info" },
  { id: 4, user: "Sara Idrissi", action: "Tentative échouée", time: "Il y a 1 heure", type: "error" },
  { id: 5, user: "Youssef Mansouri", action: "Export de données", time: "Il y a 2 heures", type: "info" },
]

const departmentStats = [
  { name: "Direction Gén.", users: 12 },
  { name: "Finance", users: 45 },
  { name: "RH", users: 28 },
  { name: "Technique", users: 67 },
  { name: "Commercial", users: 52 },
  { name: "Logistique", users: 38 },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANTS UI EXPERT
// ─────────────────────────────────────────────────────────────────────────────

// Configuration des couleurs des cartes pour un rendu très pro
const colorConfig = {
  primary: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", bar: "bg-blue-500" },
  success: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", bar: "bg-emerald-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", bar: "bg-amber-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", bar: "bg-purple-500" },
}

interface StatsCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ElementType
  theme: keyof typeof colorConfig
  onClick?: () => void
}

function StatsCard({ title, value, change, changeLabel, icon: Icon, theme, onClick }: StatsCardProps) {
  const conf = colorConfig[theme]

  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left rounded-2xl bg-white border border-slate-200/60 p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-0.5 hover:border-slate-300 overflow-hidden flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", conf.bg, conf.text)}>
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
            change >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
          )}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{change >= 0 ? "+" : ""}{change}%</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-[13px] font-semibold text-slate-500 mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-slate-800 tracking-tight tabular-nums">{value}</p>
        </div>
        {changeLabel && (
          <p className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{changeLabel}</p>
        )}
      </div>

      {/* Barre de couleur décorative en bas au hover */}
      <div className={cn("absolute bottom-0 left-0 right-0 h-1 translate-y-full group-hover:translate-y-0 transition-transform duration-300", conf.bar)} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  // Tooltip personnalisé pour Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-xl">
          <p className="text-sm font-bold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-500">{entry.name}:</span>
              <span className="font-bold text-slate-800 tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Vue d'ensemble</h1>
            </div>
            <p className="text-sm text-slate-500 ml-[52px]">
              Supervision et statistiques globales du système d'information.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
              <Download size={16} /> Rapport
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all shadow-sm">
              <RefreshCw size={16} /> Actualiser
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Total Utilisateurs"
            value="310"
            change={12}
            changeLabel="vs mois précédent"
            icon={Users}
            theme="primary"
            onClick={() => router.push("/admin/users")}
          />
          <StatsCard
            title="Comptes Actifs"
            value="287"
            change={8}
            changeLabel="vs semaine dernière"
            icon={UserCheck}
            theme="success"
            onClick={() => router.push("/admin/users?status=active")}
          />
          <StatsCard
            title="Unités Organisationnelles"
            value="24"
            change={2}
            changeLabel="nouvelles ce trimestre"
            icon={Building2}
            theme="purple"
            onClick={() => router.push("/admin/organization")}
          />
          <StatsCard
            title="Rôles d'Accès Définis"
            value="4"
            icon={ShieldCheck}
            theme="warning"
            onClick={() => router.push("/admin/roles")}
          />
        </div>

        {/* ── GRAPHIQUES PRINCIPAUX ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Activity Area Chart */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-base font-bold text-slate-800">Activité Système</h3>
                <p className="text-sm text-slate-500">Volume de requêtes et connexions sur 7 jours</p>
              </div>
              <select className="text-sm font-medium border border-slate-200 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <option>Cette semaine</option>
                <option>Ce mois</option>
              </select>
            </div>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorConnexions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="connexions"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorConnexions)"
                    strokeWidth={3}
                    name="Connexions"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#3B82F6" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="actions"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorActions)"
                    strokeWidth={3}
                    name="Actions"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#10B981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Role Distribution Pie Chart */}
          <button 
            onClick={() => router.push("/admin/roles")}
            className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col group relative"
          >
            <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>
            
            <h3 className="text-base font-bold text-slate-800">Répartition par Rôle</h3>
            <p className="text-sm text-slate-500 mb-6">Distribution des privilèges</p>
            
            <div className="h-[180px] w-full relative flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre du donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800">310</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 w-full">
              {roleDistribution.map((role) => (
                <div key={role.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                    <span className="text-xs font-medium text-slate-600 truncate max-w-[80px]" title={role.name}>{role.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 tabular-nums">{role.value}</span>
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* ── LISTES ET STATS SECONDAIRES ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Activity List */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">Activité Récente</h3>
                <p className="text-sm text-slate-500">Journal des dernières actions</p>
              </div>
              <button 
                onClick={() => router.push("/admin/audit")}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                Tout voir <ArrowRight size={14} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col gap-2">
              {recentActivities.map((activity) => (
                <button 
                  key={activity.id} 
                  onClick={() => router.push("/admin/audit")}
                  className="flex items-center gap-4 w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                >
                  <div className={cn(
                    "h-10 w-10 flex items-center justify-center rounded-full shrink-0 border",
                    activity.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    activity.type === "warning" ? "bg-amber-50 text-amber-600 border-amber-100" :
                    activity.type === "error" ? "bg-red-50 text-red-600 border-red-100" :
                    "bg-blue-50 text-blue-600 border-blue-100"
                  )}>
                    {activity.type === "success" && <CheckCircle className="h-4 w-4" />}
                    {activity.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                    {activity.type === "error" && <AlertTriangle className="h-4 w-4" />}
                    {activity.type === "info" && <Activity className="h-4 w-4" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">{activity.user}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{activity.action}</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                    <Clock size={12} />
                    {activity.time}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Department Stats Bar Chart */}
          <button 
            onClick={() => router.push("/admin/organization")}
            className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all text-left flex flex-col group relative"
          >
            <div className="absolute top-6 right-6 h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </div>

            <div className="mb-8">
              <h3 className="text-base font-bold text-slate-800">Distribution RH</h3>
              <p className="text-sm text-slate-500">Utilisateurs par Direction principale</p>
            </div>

            <div className="h-[260px] w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={true} vertical={false} />
                  <XAxis 
                    type="number" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#475569" 
                    fontSize={12}
                    fontWeight={500}
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="users" 
                    fill="#3B82F6" 
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                    name="Utilisateurs"
                  >
                    {departmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#1D6F42' : '#3B82F6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </button>
        </div>

        {/* ── SYSTEM HEALTH ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-500" /> État des Services
              </h3>
              <p className="text-sm text-slate-500">Monitoring en temps réel de l'infrastructure</p>
            </div>
            <button 
              onClick={() => router.push("/admin/settings")}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-emerald-100">
                <Server className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Serveur APP</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <p className="text-sm font-bold text-slate-800">Opérationnel</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-blue-100">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Base de données</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <p className="text-sm font-bold text-slate-800">Connectée (12ms)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-100">
                <Network className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Service LDAP</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                  </span>
                  <p className="text-sm font-bold text-slate-800">Synchronisé</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 bg-amber-50">
              <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-amber-200">
                <HardDrive className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sauvegarde</p>
                  <p className="text-xs font-bold text-amber-700">78%</p>
                </div>
                <div className="h-1.5 w-full bg-amber-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}