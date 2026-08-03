"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Package, Search, AlertTriangle, CheckCircle2, XCircle,
  LayoutGrid, List, ChevronDown, RefreshCw, Minus,
  ArrowUpDown, Filter, X, Download, Printer, Bell,
  Eye, Clock, ChevronLeft, ChevronRight, CheckSquare,
  Square, Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

type ViewMode = "list" | "grid" | "table"
type FilterStatus = "all" | "normal" | "faible" | "critique" | "rupture"
type SortKey = "designation" | "reference" | "categorie" | "stock-asc" | "stock-desc" | "pct-asc" | "pct-desc"

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES MOCKÉES (inventaire)
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PRODUITS = [
  { id: 1, reference: "USB-001", designation: "Adaptateur USB-C Hub 4 ports", categorie: "Électronique", description: "Hub USB-C avec 3 ports USB 3.0 et 1 port HDMI", stockDisponible: 12, stockMax: 30, prixUnitaire: 125, unite: "pièce", emplacement: "Étagère A2", fournisseur: "ElectroTech", stockMin: 5 },
  { id: 2, reference: "CLV-042", designation: "Clavier mécanique sans fil", categorie: "Périphériques", description: "Clavier mécanique RGB, switches rouges", stockDisponible: 3, stockMax: 20, prixUnitaire: 420, unite: "pièce", emplacement: "Étagère B1", fournisseur: "Informatique Pro", stockMin: 5 },
  { id: 3, reference: "SCR-099", designation: "Écran 24 pouces Full HD", categorie: "Électronique", description: "", stockDisponible: 0, stockMax: 15, prixUnitaire: 1850, unite: "pièce", emplacement: "Zone D", fournisseur: "TechVision", stockMin: 3 },
  { id: 4, reference: "MS-007", designation: "Souris ergonomique", categorie: "Périphériques", description: "", stockDisponible: 8, stockMax: 40, prixUnitaire: 85, unite: "pièce", emplacement: "Étagère B3", fournisseur: "Informatique Pro", stockMin: 10 },
  { id: 5, reference: "HDMI-02", designation: "Câble HDMI 2m", categorie: "Accessoires", description: "Câble haute vitesse, support 4K", stockDisponible: 25, stockMax: 100, prixUnitaire: 22, unite: "pièce", emplacement: "Caisse 4", fournisseur: "Câbles SA", stockMin: 20 },
  { id: 6, reference: "PRN-101", designation: "Imprimante Laser Noir/Blanc", categorie: "Matériel bureautique", description: "Imprimante rapide 40ppm", stockDisponible: 2, stockMax: 10, prixUnitaire: 1250, unite: "pièce", emplacement: "Zone A1", fournisseur: "Office Supplies", stockMin: 3 },
  { id: 7, reference: "CART-301", designation: "Toner compatible MLT-D101S", categorie: "Consommables", description: "Toner noir pour Samsung", stockDisponible: 0, stockMax: 50, prixUnitaire: 45, unite: "cartouche", emplacement: "Rayon Toner", fournisseur: "Consomables SARL", stockMin: 10 },
]

function Tooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative inline-flex" onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-xl pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}

function getStockStatus(stock: number, stockMax: number = 50) {
  if (stock === 0)   return { label: "Rupture",  color: "text-red-600",    bg: "bg-red-50",      border: "border-red-200",    dot: "bg-red-500",    icon: XCircle,       key: "rupture"  }
  if (stock <= 5)    return { label: "Critique", color: "text-orange-600", bg: "bg-orange-50",   border: "border-orange-200", dot: "bg-orange-500", icon: AlertTriangle, key: "critique" }
  if (stock <= 10)   return { label: "Faible",   color: "text-yellow-600", bg: "bg-yellow-50",   border: "border-yellow-200", dot: "bg-yellow-500", icon: Minus,         key: "faible"   }
  return                    { label: "Normal",   color: "text-emerald-700",bg: "bg-emerald-50",  border: "border-emerald-200",dot: "bg-emerald-500",icon: CheckCircle2,  key: "normal"   }
}

function getPct(stock: number, stockMax: number = 50) {
  return Math.min(100, Math.round((stock / (stockMax || 50)) * 100))
}

function getBarColor(stock: number) {
  return stock === 0 ? "#ef4444" : stock <= 5 ? "#f97316" : stock <= 10 ? "#eab308" : "#10b981"
}

function ProductDrawer({ product, onClose }: { product: any; onClose: () => void }) {
  const status = getStockStatus(product.stockDisponible, product.stockMax)
  const pct = getPct(product.stockDisponible, product.stockMax)
  const StatusIcon = status.icon

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900 text-sm">Détail produit</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div className={cn("rounded-2xl p-4 flex items-center gap-4", status.bg)}>
            <div className="p-3 rounded-xl bg-white/70">
              <Package className={cn("w-6 h-6", status.color)} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base leading-tight">{product.designation}</p>
              <p className="font-mono text-xs text-muted-foreground mt-0.5">{product.reference}</p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Niveau de stock</span>
              <span className={cn("text-2xl font-bold", status.color)}>{product.stockDisponible}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: getBarColor(product.stockDisponible) }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0</span><span>{pct}% du stock max</span><span>{product.stockMax || 50}</span>
            </div>
          </div>
          <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold", status.bg, status.color)}>
            <StatusIcon className="w-3.5 h-3.5" />{status.label}
          </div>
          <div className="space-y-3">
            {[
              { label: "Catégorie",     value: product.categorie       || "—" },
              { label: "Description",   value: product.description     || "—" },
              { label: "Prix unitaire", value: product.prixUnitaire ? `${product.prixUnitaire.toFixed(2)} DH` : "—" },
              { label: "Valeur stock",  value: product.prixUnitaire ? `${(product.stockDisponible * product.prixUnitaire).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} DH` : "—" },
              { label: "Stock min",     value: product.stockMin  != null ? product.stockMin  : "—" },
              { label: "Stock max",     value: product.stockMax  != null ? product.stockMax  : "—" },
              { label: "Fournisseur",   value: product.fournisseur     || "—" },
              { label: "Unité",         value: product.unite           || "—" },
              { label: "Emplacement",   value: product.emplacement     || "—" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start py-2 border-b border-gray-50">
                <span className="text-xs text-muted-foreground">{r.label}</span>
                <span className="text-xs font-medium text-gray-800 text-right max-w-[180px]">{String(r.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function exportCSV(data: any[]) {
  const headers = ["Référence","Désignation","Catégorie","Stock","Stock Max","Taux %","Statut","Prix unitaire","Valeur stock"]
  const rows = data.map(p => {
    const s = getStockStatus(p.stockDisponible, p.stockMax)
    const pct = getPct(p.stockDisponible, p.stockMax)
    return [p.reference, p.designation, p.categorie || "", p.stockDisponible, p.stockMax || "", `${pct}%`, s.label, p.prixUnitaire || "", p.prixUnitaire ? (p.stockDisponible * p.prixUnitaire).toFixed(2) : ""]
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")
  })
  const csv = [headers.join(";"), ...rows].join("\n")
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `inventaire_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function InventairePage() {
  const [produits, setProduits]           = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [sortBy, setSortBy]               = useState<SortKey>("designation")
  const [pageSize, setPageSize]           = useState<number>(25)
  const [filter, setFilter]               = useState<FilterStatus>("all")
  const [refreshing, setRefreshing]       = useState(false)
  const [showAdvanced, setShowAdvanced]   = useState(false)
  const [filterCat, setFilterCat]         = useState<string>("all")
  const [minStock, setMinStock]           = useState<string>("")
  const [maxStock, setMaxStock]           = useState<string>("")
  const [lastRefresh, setLastRefresh]     = useState<Date | null>(null)
  const [page, setPage]                   = useState(1)
  const [selected, setSelected]           = useState<Set<number>>(new Set())
  const [activeProduct, setActiveProduct] = useState<any | null>(null)
  const [alertDismissed, setAlertDismissed] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  // Chargement des préférences de localStorage (uniquement côté client)
  useEffect(() => {
    const savedView = localStorage.getItem("inv_view") as ViewMode
    const savedSort = localStorage.getItem("inv_sort") as SortKey
    const savedSize = Number(localStorage.getItem("inv_pagesize"))
    if (savedView) setViewMode(savedView)
    if (savedSort) setSortBy(savedSort)
    if (savedSize) setPageSize(savedSize)
  }, [])

  useEffect(() => { localStorage.setItem("inv_view",     viewMode) }, [viewMode])
  useEffect(() => { localStorage.setItem("inv_sort",     sortBy)   }, [sortBy])
  useEffect(() => { localStorage.setItem("inv_pagesize", String(pageSize)) }, [pageSize])

  // Raccourcis clavier
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === "Escape") { setSearch(""); setActiveProduct(null); searchRef.current?.blur() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Simulation d'appel API avec données mockées
  const fetchData = useCallback(() => {
    setRefreshing(true)
    // Simule un délai réseau
    setTimeout(() => {
      // Clone les données pour simuler un vrai fetch
      setProduits([...MOCK_PRODUITS])
      setLoading(false)
      setRefreshing(false)
      setLastRefresh(new Date())
      setSelected(new Set())
      setPage(1)
    }, 500)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Rafraîchissement automatique toutes les 5 minutes (simulé)
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const categories = useMemo(() => ([...new Set(produits.map(p => p.categorie).filter(Boolean))] as string[]).sort(), [produits])

  const stats = useMemo(() => ({
    total:    produits.length,
    rupture:  produits.filter(p => p.stockDisponible === 0).length,
    critique: produits.filter(p => p.stockDisponible > 0  && p.stockDisponible <= 5).length,
    faible:   produits.filter(p => p.stockDisponible > 5  && p.stockDisponible <= 10).length,
    normal:   produits.filter(p => p.stockDisponible > 10).length,
    valeur:   produits.reduce((acc, p) => acc + (p.stockDisponible * (p.prixUnitaire || 0)), 0),
  }), [produits])

  const filtered = useMemo(() => produits
    .filter(p => {
      const q = search.toLowerCase()
      const pct = getPct(p.stockDisponible, p.stockMax)
      const status = getStockStatus(p.stockDisponible, p.stockMax)
      const matchSearch = !q || p.designation?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q) || p.categorie?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || status.label.toLowerCase().includes(q) || String(p.stockDisponible).includes(q) || String(pct).includes(q) || `${pct}%`.includes(q)
      return matchSearch && (filter === "all" || status.key === filter) && (filterCat === "all" || p.categorie === filterCat) && (minStock === "" || p.stockDisponible >= Number(minStock)) && (maxStock === "" || p.stockDisponible <= Number(maxStock))
    })
    .sort((a, b) => {
      if (sortBy === "stock-asc")  return a.stockDisponible - b.stockDisponible
      if (sortBy === "stock-desc") return b.stockDisponible - a.stockDisponible
      if (sortBy === "pct-asc")    return getPct(a.stockDisponible, a.stockMax) - getPct(b.stockDisponible, b.stockMax)
      if (sortBy === "pct-desc")   return getPct(b.stockDisponible, b.stockMax) - getPct(a.stockDisponible, a.stockMax)
      if (sortBy === "reference")  return (a.reference || "").localeCompare(b.reference || "")
      if (sortBy === "categorie")  return (a.categorie  || "").localeCompare(b.categorie  || "")
      return (a.designation || "").localeCompare(b.designation || "")
    }), [produits, search, filter, filterCat, minStock, maxStock, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [search, filter, filterCat, minStock, maxStock, sortBy, pageSize])

  const hasActiveFilters = filter !== "all" || filterCat !== "all" || minStock !== "" || maxStock !== "" || search !== ""
  const resetFilters = () => { setSearch(""); setFilter("all"); setFilterCat("all"); setMinStock(""); setMaxStock("") }

  const toggleSelect = (id: number) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const toggleSelectAll = () => selected.size === paginated.length ? setSelected(new Set()) : setSelected(new Set(paginated.map(p => p.id)))
  const selectedProducts = produits.filter(p => selected.has(p.id))

  const handlePrint = () => {
    const data = selected.size > 0 ? selectedProducts : filtered
    const html = `<html><head><title>Inventaire</title><style>body{font-family:sans-serif;font-size:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f5f5f5;font-weight:600}@media print{button{display:none}}</style></head><body><h1>Inventaire — ${data.length} produit${data.length > 1 ? "s" : ""}</h1><p>Imprimé le ${new Date().toLocaleString("fr-MA")}</p><button onclick="window.print()">Imprimer</button><table><thead><tr><th>Réf.</th><th>Désignation</th><th>Catégorie</th><th>Stock</th><th>Taux</th><th>Statut</th><th>Valeur</th></tr></thead><tbody>${data.map(p => { const s = getStockStatus(p.stockDisponible, p.stockMax); const pct = getPct(p.stockDisponible, p.stockMax); return `<tr><td>${p.reference||""}</td><td>${p.designation||""}</td><td>${p.categorie||"—"}</td><td><strong>${p.stockDisponible}</strong></td><td>${pct}%</td><td>${s.label}</td><td>${p.prixUnitaire?(p.stockDisponible*p.prixUnitaire).toLocaleString("fr-MA",{minimumFractionDigits:2})+" DH":"—"}</td>` }).join("")}</tbody></table></body></html>`
    const w = window.open("", "_blank"); w?.document.write(html); w?.document.close()
  }

  const filterChips = [
    { key: "all",      label: "Tous",     count: stats.total,    cls: "bg-gray-100 text-gray-700 hover:bg-gray-200" },
    { key: "rupture",  label: "Rupture",  count: stats.rupture,  cls: "bg-red-50 text-red-600 hover:bg-red-100" },
    { key: "critique", label: "Critique", count: stats.critique, cls: "bg-orange-50 text-orange-600 hover:bg-orange-100" },
    { key: "faible",   label: "Faible",   count: stats.faible,   cls: "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" },
    { key: "normal",   label: "Normal",   count: stats.normal,   cls: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
  ] as const

  const alertCount = stats.rupture + stats.critique

  return (
    <div className="space-y-5">
      {alertCount > 0 && !alertDismissed && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
          <Bell className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">
            <span className="font-semibold">{alertCount} produit{alertCount > 1 ? "s" : ""}</span> nécessite{alertCount > 1 ? "nt" : ""} une attention immédiate
            {stats.rupture > 0 && <> · <span className="font-medium">{stats.rupture} en rupture</span></>}
            {stats.critique > 0 && <> · <span className="font-medium">{stats.critique} en stock critique</span></>}
          </p>
          <button onClick={() => { setFilter("rupture"); setAlertDismissed(true) }} className="text-xs font-medium text-red-600 underline underline-offset-2 hover:text-red-800 whitespace-nowrap">Voir ruptures</button>
          <button onClick={() => setAlertDismissed(true)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1D6F42]">Inventaire</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-muted-foreground text-sm">État du stock de tous les produits</p>
            {lastRefresh && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60">
                <Clock className="w-3 h-3" />
                {lastRefresh.toLocaleTimeString("fr-MA", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Tooltip content={<>Exporter <strong>{selected.size > 0 ? selected.size + " sélectionnés" : filtered.length + " produits"}</strong> au format CSV</>}>
            <Button variant="outline" size="sm" onClick={() => exportCSV(selected.size > 0 ? selectedProducts : filtered)} className="rounded-xl gap-2 text-xs">
              <Download className="w-3.5 h-3.5" />CSV
            </Button>
          </Tooltip>
          <Tooltip content="Imprimer la liste">
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl gap-2 text-xs">
              <Printer className="w-3.5 h-3.5" />Imprimer
            </Button>
          </Tooltip>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={refreshing} className="rounded-xl gap-2 text-xs">
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />Actualiser
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total produits",  value: stats.total,    sub: `Valeur: ${stats.valeur.toLocaleString("fr-MA", { maximumFractionDigits: 0 })} DH`, icon: Package,       color: "text-gray-700",    bg: "bg-gray-50",    border: "border-gray-200",    iconBg: "bg-gray-100",    filterKey: "all"      },
          { label: "En rupture",      value: stats.rupture,  sub: "Action requise",     icon: XCircle,       color: "text-red-600",     bg: "bg-red-50",     border: "border-red-100",     iconBg: "bg-red-100",     filterKey: "rupture"  },
          { label: "Stock critique",  value: stats.critique, sub: "≤ 5 unités",         icon: AlertTriangle, color: "text-orange-600",  bg: "bg-orange-50",  border: "border-orange-100",  iconBg: "bg-orange-100",  filterKey: "critique" },
          { label: "Stock normal",    value: stats.normal,   sub: "> 10 unités",        icon: CheckCircle2,  color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-100", iconBg: "bg-emerald-100", filterKey: "normal"   },
        ].map(s => (
          <Card key={s.label} onClick={() => setFilter(s.filterKey as FilterStatus)} className={cn("border shadow-none rounded-2xl cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5", s.border, s.bg, filter === s.filterKey && "ring-2 ring-[#1D6F42] ring-offset-1")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl", s.iconBg)}><s.icon className={cn("w-4 h-4", s.color)} /></div>
              <div>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input ref={searchRef} placeholder="Rechercher (appuyez / pour focus)..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-20 rounded-xl border-gray-200 h-10" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {search && <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-gray-700"><X className="w-3.5 h-3.5" /></button>}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-muted-foreground border border-gray-200 rounded-md font-mono">/</kbd>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)} className="appearance-none pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1D6F42] h-10">
              <option value="designation">Nom A→Z</option>
              <option value="reference">Référence A→Z</option>
              <option value="categorie">Catégorie A→Z</option>
              <option value="stock-asc">Stock croissant</option>
              <option value="stock-desc">Stock décroissant</option>
              <option value="pct-asc">Taux % croissant</option>
              <option value="pct-desc">Taux % décroissant</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAdvanced(v => !v)} className={cn("rounded-xl gap-1.5 text-xs h-10", showAdvanced && "bg-[#1D6F42] text-white border-[#1D6F42]")}>
            <Filter className="w-3.5 h-3.5" />Filtres
          </Button>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-10">
            {(["list", "grid", "table"] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)} className={cn("px-3 h-full transition-colors", viewMode === v ? "bg-[#1D6F42] text-white" : "text-gray-400 hover:bg-gray-50")}>
                {v === "list"  && <List        className="w-4 h-4" />}
                {v === "grid"  && <LayoutGrid  className="w-4 h-4" />}
                {v === "table" && <ArrowUpDown className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showAdvanced && (
        <Card className="border border-gray-200 shadow-none rounded-2xl">
          <CardContent className="p-4 flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Catégorie</label>
              <div className="relative">
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="appearance-none pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1D6F42] h-9 min-w-[150px]">
                  <option value="all">Toutes les catégories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Stock min</label>
              <Input type="number" min={0} placeholder="0" value={minStock} onChange={e => setMinStock(e.target.value)} className="h-9 rounded-xl border-gray-200 text-xs w-24" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Stock max</label>
              <Input type="number" min={0} placeholder="∞" value={maxStock} onChange={e => setMaxStock(e.target.value)} className="h-9 rounded-xl border-gray-200 text-xs w-24" />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-9 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 gap-1">
                <X className="w-3.5 h-3.5" />Réinitialiser
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {filterChips.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border", filter === f.key ? "ring-2 ring-offset-1 ring-[#1D6F42] border-transparent shadow-sm" : "border-transparent", f.cls)}>
            {f.label}<span className="font-bold opacity-70">{f.count}</span>
          </button>
        ))}
        {hasActiveFilters && (
          <button onClick={resetFilters} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 border border-transparent transition-all">
            <X className="w-3 h-3" />Effacer filtres
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground self-center">{filtered.length} / {produits.length} produit{filtered.length > 1 ? "s" : ""}</span>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#1D6F42]/5 border border-[#1D6F42]/20 rounded-2xl">
          <CheckSquare className="w-4 h-4 text-[#1D6F42]" />
          <span className="text-sm font-medium text-[#1D6F42]">{selected.size} produit{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => exportCSV(selectedProducts)} className="text-xs rounded-xl gap-1.5 h-8"><Download className="w-3.5 h-3.5" />Export sélection</Button>
            <Button size="sm" variant="outline" onClick={handlePrint} className="text-xs rounded-xl gap-1.5 h-8"><Printer className="w-3.5 h-3.5" />Imprimer sélection</Button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-gray-700 px-2">Désélectionner tout</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border border-gray-200 shadow-none rounded-2xl">
          <CardContent className="p-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Aucun produit trouvé</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Modifiez votre recherche ou vos filtres</p>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="mt-3 text-xs rounded-xl">Réinitialiser les filtres</Button>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {paginated.map(p => {
            const status = getStockStatus(p.stockDisponible, p.stockMax)
            const StatusIcon = status.icon
            const pct = getPct(p.stockDisponible, p.stockMax)
            const isSelected = selected.has(p.id)
            return (
              <Card key={p.id} className={cn("border shadow-none rounded-2xl hover:shadow-md hover:border-gray-200 transition-all duration-200 group", isSelected ? "border-[#1D6F42] ring-1 ring-[#1D6F42]" : "border-gray-100")}>
                <CardContent className="p-4 flex items-center gap-4">
                  <button onClick={() => toggleSelect(p.id)} className="flex-shrink-0 text-gray-300 hover:text-[#1D6F42] transition-colors">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-[#1D6F42]" /> : <Square className="w-4 h-4" />}
                  </button>
                  <div className={cn("p-3 rounded-xl flex-shrink-0 transition-transform group-hover:scale-105", status.bg)}>
                    <Package className={cn("w-5 h-5", status.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-gray-900">{p.designation}</span>
                      <span className="font-mono text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded-md">{p.reference}</span>
                      {p.categorie && <Badge variant="outline" className="text-xs font-normal border-gray-200 text-gray-500">{p.categorie}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.description || "Aucune description"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: getBarColor(p.stockDisponible) }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <div className={cn("flex items-center gap-1 justify-end font-bold text-xl", status.color)}>
                      <StatusIcon className="w-4 h-4" />{p.stockDisponible}
                    </div>
                    {p.prixUnitaire && <p className="text-xs text-muted-foreground">{(p.stockDisponible * p.prixUnitaire).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} DH</p>}
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", status.bg, status.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />{status.label}
                    </span>
                    <button onClick={() => setActiveProduct(p)} className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-muted-foreground hover:text-gray-700 mt-0.5">
                      <Eye className="w-3 h-3" />Détail
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map(p => {
            const status = getStockStatus(p.stockDisponible, p.stockMax)
            const pct = getPct(p.stockDisponible, p.stockMax)
            const isSelected = selected.has(p.id)
            return (
              <Card key={p.id} className={cn("border shadow-none rounded-2xl hover:shadow-md transition-all duration-200 overflow-hidden group", isSelected ? "border-[#1D6F42] ring-1 ring-[#1D6F42]" : status.border)}>
                <div className="h-1 w-full" style={{ backgroundColor: getBarColor(p.stockDisponible) }} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleSelect(p.id)} className="text-gray-300 hover:text-[#1D6F42] transition-colors">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-[#1D6F42]" /> : <Square className="w-4 h-4" />}
                      </button>
                      <div className={cn("p-2.5 rounded-xl", status.bg)}><Package className={cn("w-4 h-4", status.color)} /></div>
                    </div>
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", status.bg, status.color)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />{status.label}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-gray-900 leading-snug mb-0.5">{p.designation}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.reference}</p>
                  {p.categorie && <Badge variant="outline" className="text-xs font-normal border-gray-200 text-gray-500 mt-1.5">{p.categorie}</Badge>}
                  <div className="mt-3 mb-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: getBarColor(p.stockDisponible) }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right mt-0.5">{pct}%</p>
                  </div>
                  <div className="flex items-end justify-between mt-2 pt-3 border-t border-gray-100">
                    <button onClick={() => setActiveProduct(p)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#1D6F42] transition-colors">
                      <Eye className="w-3.5 h-3.5" />Voir détail
                    </button>
                    <span className={cn("text-2xl font-bold", status.color)}>{p.stockDisponible}</span>
                  </div>
                  {p.prixUnitaire && <p className="text-[10px] text-muted-foreground text-right mt-0.5">Valeur : {(p.stockDisponible * p.prixUnitaire).toLocaleString("fr-MA", { minimumFractionDigits: 2 })} DH</p>}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border border-gray-200 shadow-none rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="w-10 px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-[#1D6F42]">
                      {selected.size === paginated.length && paginated.length > 0 ? <CheckSquare className="w-4 h-4 text-[#1D6F42]" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  {[{ label: "#", w: "w-10" },{ label: "Référence", w: "w-28" },{ label: "Désignation", w: "" },{ label: "Catégorie", w: "w-28" },{ label: "Stock", w: "w-20" },{ label: "Taux", w: "w-32" },{ label: "Statut", w: "w-28" },{ label: "Valeur", w: "w-28" },{ label: "", w: "w-10" }].map(h => (
                    <th key={h.label} className={cn("text-left text-xs font-semibold text-muted-foreground px-4 py-3", h.w)}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, idx) => {
                  const status = getStockStatus(p.stockDisponible, p.stockMax)
                  const StatusIcon = status.icon
                  const pct = getPct(p.stockDisponible, p.stockMax)
                  const isSelected = selected.has(p.id)
                  return (
                    <tr key={p.id} className={cn("border-b border-gray-50 hover:bg-gray-50/60 transition-colors group", isSelected && "bg-[#1D6F42]/5")}>
                      <td className="px-4 py-3"><button onClick={() => toggleSelect(p.id)} className="text-gray-300 hover:text-[#1D6F42]">{isSelected ? <CheckSquare className="w-4 h-4 text-[#1D6F42]" /> : <Square className="w-4 h-4" />}</button></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="px-4 py-3"><span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">{p.reference}</span></td>
                      <td className="px-4 py-3"><p className="font-medium text-gray-900 text-sm">{p.designation}</p>{p.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{p.description}</p>}</td>
                      <td className="px-4 py-3">{p.categorie ? <Badge variant="outline" className="text-xs font-normal border-gray-200 text-gray-500">{p.categorie}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3"><span className={cn("font-bold text-base", status.color)}>{p.stockDisponible}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: getBarColor(p.stockDisponible) }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", status.bg, status.color)}><StatusIcon className="w-3 h-3" />{status.label}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.prixUnitaire ? (p.stockDisponible * p.prixUnitaire).toLocaleString("fr-MA", { minimumFractionDigits: 2 }) + " DH" : "—"}</td>
                      <td className="px-4 py-3"><button onClick={() => setActiveProduct(p)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-gray-100"><Eye className="w-3.5 h-3.5 text-muted-foreground" /></button></td>
                    </tr>
                  )
                })}
              </tbody>
              {paginated.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={5} className="px-4 py-3 text-xs font-semibold text-gray-700">TOTAL — {filtered.length} produit{filtered.length > 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{filtered.reduce((a, p) => a + p.stockDisponible, 0)}</td>
                    <td className="px-4 py-3" /><td className="px-4 py-3" />
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{filtered.some(p => p.prixUnitaire) ? filtered.reduce((a, p) => a + (p.stockDisponible * (p.prixUnitaire || 0)), 0).toLocaleString("fr-MA", { minimumFractionDigits: 2 }) + " DH" : "—"}</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Lignes par page :</span>
            <div className="relative">
              <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1D6F42]">
                {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} sur {filtered.length}</span>
            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              return <button key={p} onClick={() => setPage(p)} className={cn("w-7 h-7 rounded-lg text-xs transition-colors", page === p ? "bg-[#1D6F42] text-white font-semibold" : "hover:bg-gray-100 text-gray-600")}>{p}</button>
            })}
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50 pt-2 flex-wrap">
        <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1 font-mono">/</kbd> Rechercher</span>
        <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1 font-mono">Esc</kbd> Effacer / Fermer</span>
      </div>

      {activeProduct && <ProductDrawer product={activeProduct} onClose={() => setActiveProduct(null)} />}
    </div>
  )
}