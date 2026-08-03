"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
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
  Loader2,
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
import { utilisateurService } from "@/services/utilisateur.service"
import { structureService } from "@/services/structure.service"
import { ticketService } from "@/services/ticket.service"
import type { UtilisateurDto } from "@/types/utilisateur"
import type { StructureFlatDto } from "@/types/structure"
import type { TicketResponse } from "@/types/ticket"

// ------------------------------------------------------------------
// Types locaux
// ------------------------------------------------------------------
interface DepartmentStat {
  name: string
  users: number
}

interface RoleDistribution {
  name: string
  value: number
  color: string
}

interface TicketChartDataPoint {
  name: string
  creees: number
  resolues: number
  enAttente: number
}

interface RecentActivity {
  id: number | string
  user: string
  action: string
  time: string
  type: "success" | "warning" | "info" | "error"
}

// ------------------------------------------------------------------
// Couleurs pour les rôles
// ------------------------------------------------------------------
const ROLE_COLORS: Record<string, string> = {
  ADMIN_SI: "#ef4444",
  CHEF_SERVICE: "#6366f1",
  EMPLOYE: "#3b82f6",
  RESPONSABLE_LOGISTIQUE: "#f59e0b",
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN_SI: "Admin",
  CHEF_SERVICE: "Chef de Service",
  EMPLOYE: "Employé",
  RESPONSABLE_LOGISTIQUE: "Resp. Logistique",
}

// ------------------------------------------------------------------
// Composant StatsCard (réutilisable)
// ------------------------------------------------------------------
interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ElementType
  iconColor: string
  onClick?: () => void
}

function StatsCard({ title, value, change, changeLabel, icon: Icon, iconColor, onClick }: StatsCardProps) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary/10 text-primary group-hover:bg-primary/20",
    accent: "bg-accent/10 text-accent group-hover:bg-accent/20",
    "chart-3": "bg-chart-3/10 text-chart-3 group-hover:bg-chart-3/20",
    "chart-4": "bg-chart-4/10 text-chart-4 group-hover:bg-chart-4/20",
  }

  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all group w-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-xl transition-colors", colorClasses[iconColor])}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>
        </div>
        {change !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
            change >= 0 ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
          )}>
            {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{change >= 0 ? "+" : ""}{change}%</span>
          </div>
        )}
      </div>
      {changeLabel && (
        <p className="text-xs text-muted-foreground mt-2">{changeLabel}</p>
      )}
      <div className="flex items-center gap-1 mt-3 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Voir les détails</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </button>
  )
}

// ------------------------------------------------------------------
// DashboardPage (backend connecté, tickets en 3 courbes)
// ------------------------------------------------------------------
export default function DashboardPage() {
  const router = useRouter()

  const [users, setUsers] = useState<UtilisateurDto[]>([])
  const [structures, setStructures] = useState<StructureFlatDto[]>([])
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [userData, structData, ticketData] = await Promise.all([
          utilisateurService.getAll(),
          structureService.getAllFlat(),
          ticketService.getAllTickets(),
        ])
        setUsers(userData)
        setStructures(structData)
        setTickets(ticketData)
      } catch (err: any) {
        console.error(err)
        setError("Impossible de charger les données du tableau de bord.")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // ── Statistiques principales ──────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter(u => u.actif).length
    const inactive = total - active
    return { total, active, inactive }
  }, [users])

  // ── Répartition par rôle (camembert) ──────────────────────────────────────
  const roleDistribution: RoleDistribution[] = useMemo(() => {
    const dist: Record<string, number> = {}
    users.forEach(u => {
      const role = u.role
      dist[role] = (dist[role] || 0) + 1
    })
    return Object.entries(dist).map(([role, count]) => ({
      name: ROLE_LABELS[role] || role,
      value: count,
      color: ROLE_COLORS[role] || "#94a3b8",
    }))
  }, [users])

  // ── Utilisateurs par département ─────────────────────────────────────────
  const departmentStats: DepartmentStat[] = useMemo(() => {
    const map: Record<string, number> = {}
    users.forEach(u => {
      const dept = u.department || "Non défini"
      map[dept] = (map[dept] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, users]) => ({ name, users }))
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)
  }, [users])

  // ── Tickets : courbes de création, résolution et attente (30 jours) ─────
  const ticketChartData: TicketChartDataPoint[] = useMemo(() => {
    const today = new Date()
    const days: TicketChartDataPoint[] = []
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 29) // 30 jours au total

    // Tableau des dates du jour
    const dates: Date[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      dates.push(d)
    }

    let cumulativeCreated = 0
    let cumulativeResolved = 0

    dates.forEach(d => {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(dayStart.getTime() + 86400000)

      const createdToday = tickets.filter(t => {
        const creation = new Date(t.dateCreation)
        return creation >= dayStart && creation < dayEnd
      }).length

      const resolvedToday = tickets.filter(t => {
        if (!t.dateReponse) return false
        const resolution = new Date(t.dateReponse)
        return resolution >= dayStart && resolution < dayEnd
      }).length

      cumulativeCreated += createdToday
      cumulativeResolved += resolvedToday
      const pending = cumulativeCreated - cumulativeResolved

      days.push({
        name: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        creees: cumulativeCreated,
        resolues: cumulativeResolved,
        enAttente: pending,
      })
    })

    return days
  }, [tickets])

  // ── Activités récentes (basées sur les derniers utilisateurs créés) ──────
  const recentActivities = useMemo<RecentActivity[]>(() => {
    const sorted = [...users]
      .filter(u => u.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
    return sorted.map(u => {
      const creationDate = new Date(u.createdAt)
      const now = new Date()
      const diffMs = now.getTime() - creationDate.getTime()
      const diffMin = Math.floor(diffMs / 60000)
      let timeAgo: string
      if (diffMin < 1) timeAgo = "À l'instant"
      else if (diffMin < 60) timeAgo = `Il y a ${diffMin} min`
      else if (diffMin < 1440) timeAgo = `Il y a ${Math.floor(diffMin / 60)} h`
      else timeAgo = `Il y a ${Math.floor(diffMin / 1440)} j`

      return {
        id: u.id,
        user: u.employeNom,
        action: "Création d'utilisateur",
        time: timeAgo,
        type: "info" as const,
      }
    })
  }, [users])

  // ── Pourcentages de changement (simulés, faute d'historique) ──────────────
  const userChangePercent = 12
  const activeChangePercent = 8
  const orgUnitChangePercent = 2

  // ── Navigation ────────────────────────────────────────────────────────────
  const navigateTo = (path: string) => router.push(path)

  // ── Affichages conditionnels ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <button onClick={() => window.location.reload()} className="text-primary underline">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Utilisateurs"
            value={stats.total}
            change={userChangePercent}
            changeLabel="ce mois (simulé)"
            icon={Users}
            iconColor="primary"
            onClick={() => navigateTo("/admin/users")}
          />
          <StatsCard
            title="Utilisateurs Actifs"
            value={stats.active}
            change={activeChangePercent}
            changeLabel="cette semaine (simulé)"
            icon={UserCheck}
            iconColor="accent"
            onClick={() => navigateTo("/admin/users?status=active")}
          />
          <StatsCard
            title="Unités Organisationnelles"
            value={structures.length}
            change={orgUnitChangePercent}
            changeLabel="ce trimestre (simulé)"
            icon={Building2}
            iconColor="chart-3"
            onClick={() => navigateTo("/admin/organization")}
          />
          <StatsCard
            title="Tickets support"
            value={tickets.length}
            change={ticketChartData.length > 0 ? ticketChartData[ticketChartData.length - 1].enAttente : 0}
            changeLabel="en attente"
            icon={Activity}
            iconColor="chart-4"
            onClick={() => navigateTo("/admin/support")}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courbes des tickets (30 jours) */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Évolution des tickets (30 jours)</h3>
                <p className="text-sm text-muted-foreground">Tickets créés, résolus et en attente</p>
              </div>
              <select className="text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option>Ce mois</option>
                <option>Ce trimestre</option>
                <option>Cette année</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ticketChartData}>
                <defs>
                  <linearGradient id="colorCrees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolues" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEnAttente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickMargin={4} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="creees"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCrees)"
                  strokeWidth={2}
                  name="Créés"
                />
                <Area
                  type="monotone"
                  dataKey="resolues"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorResolues)"
                  strokeWidth={2}
                  name="Résolus"
                />
                <Area
                  type="monotone"
                  dataKey="enAttente"
                  stroke="#f59e0b"
                  fillOpacity={1}
                  fill="url(#colorEnAttente)"
                  strokeWidth={2}
                  name="En attente"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Role Distribution */}
          <button
            onClick={() => navigateTo("/admin/roles")}
            className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-foreground">Répartition par Rôle</h3>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Distribution des utilisateurs</p>
            {roleDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {roleDistribution.map((role) => (
                    <div key={role.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-xs text-muted-foreground">{role.name}</span>
                      <span className="text-xs font-medium text-foreground ml-auto">{role.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            )}
          </button>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity (réelle) */}
          <div className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Activité Récente</h3>
                <p className="text-sm text-muted-foreground">Derniers utilisateurs créés</p>
              </div>
              <button
                onClick={() => navigateTo("/admin/audit")}
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              ) : (
                recentActivities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => navigateTo("/admin/audit")}
                    className="flex items-center gap-4 w-full text-left hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      activity.type === "success" ? "bg-primary/10 text-primary" :
                      activity.type === "warning" ? "bg-chart-4/10 text-chart-4" :
                      activity.type === "error" ? "bg-accent/10 text-accent" :
                      "bg-chart-3/10 text-chart-3"
                    )}>
                      {activity.type === "success" && <CheckCircle className="h-4 w-4" />}
                      {activity.type === "warning" && <AlertTriangle className="h-4 w-4" />}
                      {activity.type === "error" && <AlertTriangle className="h-4 w-4" />}
                      {activity.type === "info" && <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Department Stats */}
          <button
            onClick={() => navigateTo("/admin/organization")}
            className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow text-left group"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Utilisateurs par Direction</h3>
                <p className="text-sm text-muted-foreground">Distribution organisationnelle</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    width={120}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px"
                    }}
                  />
                  <Bar
                    dataKey="users"
                    fill="var(--chart-1)"
                    radius={[0, 6, 6, 0]}
                    name="Utilisateurs"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}