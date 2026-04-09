"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Filter,
  Calendar,
  Package,
  TrendingUp,
  Download,
  FileText,
} from "lucide-react"
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
} from "recharts"

interface ConsumptionItem {
  id: string
  name: string
  category: string
  quantity: number
  date: string
  requestId: string
  type: "fourniture" | "impression" | "informatique"
}

const consumptionHistory: ConsumptionItem[] = [
  {
    id: "1",
    name: "Stylo bille bleu",
    category: "Fournitures de bureau",
    quantity: 10,
    date: "10 Mars 2026",
    requestId: "DEM-2026-0145",
    type: "fourniture",
  },
  {
    id: "2",
    name: "Ramette papier A4",
    category: "Fournitures de bureau",
    quantity: 5,
    date: "10 Mars 2026",
    requestId: "DEM-2026-0145",
    type: "fourniture",
  },
  {
    id: "3",
    name: "Cartouche HP 305 Noir",
    category: "Consommables impression",
    quantity: 2,
    date: "8 Mars 2026",
    requestId: "DEM-2026-0142",
    type: "impression",
  },
  {
    id: "4",
    name: "Classeur à levier A4",
    category: "Fournitures de bureau",
    quantity: 8,
    date: "1 Mars 2026",
    requestId: "DEM-2026-0130",
    type: "fourniture",
  },
  {
    id: "5",
    name: "Agrafeuse",
    category: "Fournitures de bureau",
    quantity: 1,
    date: "1 Mars 2026",
    requestId: "DEM-2026-0130",
    type: "fourniture",
  },
  {
    id: "6",
    name: "Souris sans fil",
    category: "Matériel informatique",
    quantity: 1,
    date: "15 Février 2026",
    requestId: "DEM-2026-0115",
    type: "informatique",
  },
  {
    id: "7",
    name: "Toner HP LaserJet",
    category: "Consommables impression",
    quantity: 1,
    date: "10 Février 2026",
    requestId: "DEM-2026-0108",
    type: "impression",
  },
  {
    id: "8",
    name: "Post-it couleurs",
    category: "Fournitures de bureau",
    quantity: 12,
    date: "5 Février 2026",
    requestId: "DEM-2026-0102",
    type: "fourniture",
  },
]

const categoryStats = [
  { name: "Fournitures de bureau", count: 36, percentage: 65, color: "bg-primary" },
  { name: "Consommables impression", count: 12, percentage: 22, color: "bg-[#E31837]" },
  { name: "Matériel informatique", count: 7, percentage: 13, color: "bg-amber-500" },
]

const monthlyTrendData = [
  { month: "Sep", fournitures: 12, impression: 4, informatique: 2 },
  { month: "Oct", fournitures: 18, impression: 6, informatique: 1 },
  { month: "Nov", fournitures: 15, impression: 3, informatique: 3 },
  { month: "Déc", fournitures: 22, impression: 8, informatique: 2 },
  { month: "Jan", fournitures: 14, impression: 5, informatique: 4 },
  { month: "Fév", fournitures: 20, impression: 7, informatique: 3 },
  { month: "Mar", fournitures: 28, impression: 9, informatique: 2 },
]

const monthlyComparisonData = [
  { month: "Sep", articles: 18, demandes: 4 },
  { month: "Oct", articles: 25, demandes: 5 },
  { month: "Nov", articles: 21, demandes: 4 },
  { month: "Déc", articles: 32, demandes: 6 },
  { month: "Jan", articles: 23, demandes: 5 },
  { month: "Fév", articles: 30, demandes: 7 },
  { month: "Mar", articles: 39, demandes: 8 },
]

export default function HistoriquePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")

  const filteredHistory = consumptionHistory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.requestId.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.type === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalItems = consumptionHistory.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Historique de Consommation</h1>
          <p className="text-muted-foreground mt-1">
            Visualisez votre historique personnel de consommation de matériel
          </p>
        </div>
        <Button variant="outline" className="w-fit">
          <Download className="w-4 h-4 mr-2" />
          Exporter en PDF
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Total Consumption */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total articles consommés</p>
                <p className="text-3xl font-bold mt-1">{totalItems}</p>
                <p className="text-xs text-muted-foreground mt-1">Cette année</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend Chart */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tendance mensuelle</CardTitle>
            <CardDescription>Évolution de votre consommation par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="fournitures" 
                    name="Fournitures"
                    stroke="#1D6F42" 
                    strokeWidth={2}
                    dot={{ fill: '#1D6F42', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="impression" 
                    name="Impression"
                    stroke="#E31837" 
                    strokeWidth={2}
                    dot={{ fill: '#E31837', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="informatique" 
                    name="Informatique"
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Monthly Comparison */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Articles vs Demandes</CardTitle>
            <CardDescription>Comparaison mensuelle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="articles" 
                    name="Articles" 
                    fill="#1D6F42" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="demandes" 
                    name="Demandes" 
                    fill="#E31837" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Répartition par catégorie</CardTitle>
            <CardDescription>Distribution de vos consommations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map((cat) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cat.name}</span>
                    <span className="text-muted-foreground">{cat.count} articles ({cat.percentage}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">55</p>
                  <p className="text-xs text-muted-foreground">Total articles</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#E31837]">12</p>
                  <p className="text-xs text-muted-foreground">Demandes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">4.6</p>
                  <p className="text-xs text-muted-foreground">Moy/demande</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par article ou numéro de demande..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-48 h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                <SelectItem value="fourniture">Fournitures de bureau</SelectItem>
                <SelectItem value="impression">Consommables impression</SelectItem>
                <SelectItem value="informatique">Matériel informatique</SelectItem>
              </SelectContent>
            </Select>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full lg:w-48 h-11">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute la période</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Consumption History Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Détail des consommations</CardTitle>
          <CardDescription>
            {filteredHistory.length} article(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Article</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Catégorie</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Quantité</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">N° Demande</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          item.type === 'impression' ? 'bg-[#E31837]/10 text-[#E31837]' : 
                          item.type === 'informatique' ? 'bg-amber-100 text-amber-700' : ''
                        }`}
                      >
                        {item.category}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-semibold">{item.quantity}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {item.date}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <a href={`/dashboard/suivi?id=${item.requestId}`} className="font-mono text-sm text-primary hover:underline">
                        {item.requestId}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucun historique trouvé</h3>
              <p className="text-muted-foreground text-sm">
                Modifiez vos critères de recherche pour voir plus de résultats
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
