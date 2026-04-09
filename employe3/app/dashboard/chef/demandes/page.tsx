"use client"

import {
  useState, useMemo, useCallback,
  useRef, useEffect, useTransition,
} from "react"
import {
  Search, X, ChevronDown, ChevronUp, Calendar,
  Package, CheckCircle2, XCircle,
  Eye, FileText, ArrowUp, ArrowDown,
  Clock, ChevronRight, CircleDot,
} from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = "http://localhost:8081"

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type SortKey = "date" | "priorite" | "statut" | "employe"
type SortDir = "asc" | "desc"

interface Article {
  produitId: number
  produitDesignation: string
  produitReference: string
  quantite: number
}

interface Demande {
  id: number
  reference: string
  employeNom: string
  structureNom: string
  dateCreation: string
  dateValidation?: string
  urgence: string
  statut: string
  justification: string
  lignes: Article[]
  motifRefus?: string
  valideParNom?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const G = "#004d2c"

const STATUT_CFG: Record<string, { label: string; pill: string; dot: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", pill: "bg-amber-100 text-amber-800 ring-amber-200",     dot: "bg-amber-400",  color: "#b45309", bg: "#fffbeb" },
  APPROUVEE:  { label: "Approuvée",  pill: "bg-emerald-100 text-emerald-800 ring-emerald-200",dot: "bg-emerald-500",color: "#047857", bg: "#f0fdf4" },
  REFUSEE:    { label: "Rejetée",    pill: "bg-red-100 text-red-800 ring-red-200",            dot: "bg-red-500",    color: "#be123c", bg: "#fff1f2" },
}

const URGENCE_CFG: Record<string, { label: string; bar: string; ring: string; text: string; order: number }> = {
  CRITIQUE: { label: "Critique", bar: "#dc2626", ring: "ring-red-300",   text: "text-red-700",   order: 0 },
  URGENT:   { label: "Urgent",   bar: "#d97706", ring: "ring-amber-300", text: "text-amber-700", order: 1 },
  NORMAL:   { label: "Normal",   bar: "#94a3b8", ring: "ring-slate-200", text: "text-slate-500", order: 2 },
}

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

const fmtFull = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - +new Date(iso)) / 86400000)
  if (d === 0) return "Aujourd'hui"
  if (d === 1) return "Hier"
  if (d < 7) return `${d}j`
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

const initiales = (nom: string) => nom?.substring(0, 2).toUpperCase() ?? "??"

const COLORS = ["#6d28d9", "#0369a1", "#b45309", "#047857", "#be185d", "#0891b2", "#4f46e5"]
const getColor = (nom: string) => COLORS[nom?.charCodeAt(0) % COLORS.length] ?? G

// ════════════════════════════════════════════════════════════════════════════
// ATOMS
// ════════════════════════════════════════════════════════════════════════════

function Pip({ statut }: { statut: string }) {
  const cfg = STATUT_CFG[statut] ?? STATUT_CFG["EN_ATTENTE"]
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold ring-1", cfg.pill)}>
      <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot, statut === "EN_ATTENTE" && "animate-pulse")} />
      {cfg.label}
    </span>
  )
}

function Ava({ nom, sz = 8 }: { nom: string; sz?: number }) {
  return (
    <div className={cn(`w-${sz} h-${sz}`, "rounded-lg flex items-center justify-center font-bold text-white shrink-0 text-[11px] shadow-sm")}
      style={{ background: getColor(nom) }}>
      {initiales(nom)}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DRAWER
// ════════════════════════════════════════════════════════════════════════════

function Drawer({ d, onClose }: { d: Demande; onClose: () => void }) {
  const sCfg = STATUT_CFG[d.statut] ?? STATUT_CFG["EN_ATTENTE"]
  const uCfg = URGENCE_CFG[d.urgence] ?? URGENCE_CFG["NORMAL"]

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", h)
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = "" }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn .2s cubic-bezier(.4,0,.2,1)" }}>
        <style>{`@keyframes slideIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }`}</style>

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-gray-100 shrink-0">
          <Ava nom={d.employeNom} sz={10} />
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[15px] font-bold text-gray-900 truncate">{d.employeNom}</p>
            <p className="text-xs text-gray-400 mt-0.5">{d.structureNom}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">{d.reference}</code>
              <Pip statut={d.statut} />
              <span className={cn("text-[11px] font-semibold ring-1 rounded-full px-2.5 py-[3px]", uCfg.ring, uCfg.text)}>
                {uCfg.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Soumission</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{fmtFull(d.dateCreation)}</p>
            </div>
            {d.dateValidation && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Validation</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{fmtFull(d.dateValidation)}</p>
              </div>
            )}
          </div>

          {d.justification && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Justification</p>
              <p className="text-sm text-gray-600 leading-relaxed">{d.justification}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
              Articles · {d.lignes.length}
            </p>
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {d.lignes.map((l) => (
                <div key={l.produitId} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60">
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{l.produitDesignation}</p>
                    <p className="text-xs text-gray-400">{l.produitReference}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">x{l.quantite}</span>
                </div>
              ))}
            </div>
          </div>

          {d.valideParNom && d.valideParNom !== "Non encore validée" && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Validé par</p>
              <p className="text-sm font-semibold text-emerald-800">{d.valideParNom}</p>
            </div>
          )}

          {d.motifRefus && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Motif de rejet</p>
              <p className="text-sm text-red-700 leading-relaxed">{d.motifRefus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// TABLE ROW
// ════════════════════════════════════════════════════════════════════════════

function Row({ d, onOpen }: { d: Demande; onOpen: (d: Demande) => void }) {
  const [open, setOpen] = useState(false)
  const uCfg = URGENCE_CFG[d.urgence] ?? URGENCE_CFG["NORMAL"]

  return (
    <>
      <tr className="group border-b border-gray-100 last:border-0 hover:bg-[#f8faf9] transition-colors cursor-pointer" onClick={() => onOpen(d)}>
        <td className="w-1 py-0 pr-0 pl-0">
          <div className="w-[3px] h-full min-h-[56px] rounded-r-full mx-auto" style={{ background: uCfg.bar }} />
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Ava nom={d.employeNom} sz={8} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{d.employeNom}</p>
              <p className="text-[11px] text-gray-400 truncate">{d.structureNom}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3.5 hidden lg:table-cell">
          <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">{d.reference}</code>
        </td>
        <td className="px-3 py-3.5 hidden md:table-cell">
          <button onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors">
            <span className="font-semibold tabular-nums">{d.lignes.length}</span>
            <span className="text-gray-400">art.</span>
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </td>
        <td className="px-3 py-3.5 hidden xl:table-cell">
          <span className="text-xs text-gray-400 tabular-nums">{ago(d.dateCreation)}</span>
        </td>
        <td className="px-3 py-3.5 hidden sm:table-cell">
          <span className={cn("text-[11px] font-semibold ring-1 rounded-full px-2.5 py-[3px]", uCfg.ring, uCfg.text)}>
            {uCfg.label}
          </span>
        </td>
        <td className="px-3 py-3.5"><Pip statut={d.statut} /></td>
        <td className="px-4 py-3.5 text-right">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-lg hover:bg-gray-100 hover:text-gray-700">
            <Eye className="w-3.5 h-3.5" /> Voir
          </span>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-gray-100 bg-[#f8faf9]">
          <td colSpan={8} className="px-4 pb-3 pt-0">
            <div className="ml-11 rounded-xl border border-gray-100 overflow-hidden text-xs bg-white">
              {d.lignes.map((l, i) => (
                <div key={l.produitId} className={cn("flex items-center justify-between px-4 py-2.5", i < d.lignes.length - 1 && "border-b border-gray-50")}>
                  <span className="text-gray-600 font-medium">{l.produitDesignation}</span>
                  <span className="text-gray-500 tabular-nums font-semibold">x{l.quantite}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// SORTABLE HEADER
// ════════════════════════════════════════════════════════════════════════════

function Th({ label, sk, cur, dir, onSort, className }: {
  label: string; sk?: SortKey; cur: SortKey; dir: SortDir
  onSort: (k: SortKey) => void; className?: string
}) {
  const active = sk && cur === sk
  return (
    <th className={cn("px-3 py-3 text-left", className)}>
      {sk ? (
        <button onClick={() => onSort(sk)} className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors", active ? "text-gray-800" : "text-gray-400 hover:text-gray-600")}>
          {label}
          <span className="flex flex-col gap-[1px]">
            <ArrowUp   className={cn("w-2.5 h-2.5", active && dir === "asc"  ? "text-gray-700" : "text-gray-300")} />
            <ArrowDown className={cn("w-2.5 h-2.5", active && dir === "desc" ? "text-gray-700" : "text-gray-300")} />
          </span>
        </button>
      ) : (
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      )}
    </th>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function DemandesEquipePage() {
  const [demandes, setDemandes]   = useState<Demande[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState("")
  const [fStatut, setFStatut]     = useState("tous")
  const [sortKey, setSortKey]     = useState<SortKey>("date")
  const [sortDir, setSortDir]     = useState<SortDir>("desc")
  const [drawer, setDrawer]       = useState<Demande | null>(null)
  const [, startTransition]       = useTransition()
  const inputRef                  = useRef<HTMLInputElement>(null)

  const fetchDemandes = async () => {
    const token = localStorage.getItem("token")
    try {
      // Le chef voit toutes les demandes de son équipe
      const res = await fetch(`${API_URL}/api/demandes/a-valider`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setDemandes(data)
    } catch (e) {
      console.error("Erreur chargement", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDemandes() }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus() } }
    addEventListener("keydown", h)
    return () => removeEventListener("keydown", h)
  }, [])

  const sort = useCallback((k: SortKey) => {
    startTransition(() => {
      setSortDir(d => sortKey === k ? (d === "asc" ? "desc" : "asc") : "desc")
      setSortKey(k)
    })
  }, [sortKey])

  const stats = useMemo(() => ({
    total:     demandes.length,
    EN_ATTENTE: demandes.filter(d => d.statut === "EN_ATTENTE").length,
    APPROUVEE:  demandes.filter(d => d.statut === "APPROUVEE").length,
    REFUSEE:    demandes.filter(d => d.statut === "REFUSEE").length,
  }), [demandes])

  const rows = useMemo(() => {
    const list = demandes.filter(d => {
      if (fStatut !== "tous" && d.statut !== fStatut) return false
      if (q) {
        const lq = q.toLowerCase()
        return d.reference?.toLowerCase().includes(lq) || d.employeNom?.toLowerCase().includes(lq)
      }
      return true
    })
    return list.sort((a, b) => {
      let v = 0
      if (sortKey === "date")    v = a.dateCreation.localeCompare(b.dateCreation)
      if (sortKey === "priorite") v = (URGENCE_CFG[a.urgence]?.order ?? 2) - (URGENCE_CFG[b.urgence]?.order ?? 2)
      if (sortKey === "statut")  v = a.statut.localeCompare(b.statut)
      if (sortKey === "employe") v = a.employeNom.localeCompare(b.employeNom)
      return sortDir === "asc" ? v : -v
    })
  }, [demandes, q, fStatut, sortKey, sortDir])

  const hasFilters = q || fStatut !== "tous"

  const STAT_BTNS = [
    { value: "tous",       label: "Tous",       count: stats.total,      color: "#374151", bg: "#f9fafb", border: "#e5e7eb" },
    { value: "EN_ATTENTE", label: "En attente", count: stats.EN_ATTENTE, color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
    { value: "APPROUVEE",  label: "Approuvées", count: stats.APPROUVEE,  color: "#047857", bg: "#f0fdf4", border: "#bbf7d0" },
    { value: "REFUSEE",    label: "Rejetées",   count: stats.REFUSEE,    color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
  ]

  return (
    <>
      {drawer && <Drawer d={drawer} onClose={() => setDrawer(null)} />}

      <div className="space-y-5 pb-8">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Chef de Service</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">Demandes équipe</h1>
          </div>
          <p className="text-sm text-gray-400 pb-0.5">
            <span className="font-bold text-gray-700">{stats.EN_ATTENTE}</span> en attente de validation
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STAT_BTNS.map(s => (
            <button key={s.value} onClick={() => setFStatut(s.value)}
              className={cn("rounded-xl px-3 py-3 text-center border transition-all duration-150 hover:scale-[1.02] active:scale-[.98]", fStatut === s.value && "shadow-md scale-[1.02]")}
              style={{ background: s.bg, borderColor: fStatut === s.value ? s.color + "60" : s.border, boxShadow: fStatut === s.value ? `0 0 0 2px ${s.color}25` : undefined }}>
              <p className="text-xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.count}</p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)}
              placeholder="Rechercher par référence ou nom…"
              className="w-full pl-10 pr-20 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 placeholder:text-gray-300"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {q && <button onClick={() => setQ("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
              <kbd className="hidden sm:inline-flex text-[9px] text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
            </div>
          </div>
          {hasFilters && (
            <button onClick={() => { setQ(""); setFStatut("tous") }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">Chargement...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="w-[3px] p-0" />
                  <Th label="Employé"  sk="employe"  cur={sortKey} dir={sortDir} onSort={sort} className="px-4 py-3 w-56" />
                  <Th label="Réf."                   cur={sortKey} dir={sortDir} onSort={sort} className="hidden lg:table-cell w-40" />
                  <Th label="Articles"               cur={sortKey} dir={sortDir} onSort={sort} className="hidden md:table-cell w-24" />
                  <Th label="Date"     sk="date"     cur={sortKey} dir={sortDir} onSort={sort} className="hidden xl:table-cell w-20" />
                  <Th label="Urgence"  sk="priorite" cur={sortKey} dir={sortDir} onSort={sort} className="hidden sm:table-cell w-28" />
                  <Th label="Statut"   sk="statut"   cur={sortKey} dir={sortDir} onSort={sort} className="w-36" />
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500">Aucune demande</p>
                        <p className="text-xs text-gray-400 mt-0.5">Ajustez vos filtres</p>
                      </div>
                    </div>
                  </td></tr>
                ) : rows.map(d => <Row key={d.id} d={d} onOpen={setDrawer} />)}
              </tbody>
            </table>
          )}
          {rows.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-600">{rows.length}</span> résultat{rows.length > 1 ? "s" : ""}
                {rows.length !== demandes.length && <span className="text-gray-300"> / {demandes.length}</span>}
              </p>
              <p className="text-xs text-gray-400">Cliquer sur une ligne pour voir le détail</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}