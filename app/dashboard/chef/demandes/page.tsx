"use client"

import {
  useState, useMemo, useCallback,
  useRef, useEffect, useTransition,
} from "react"
import {
  Search, X, ChevronDown, ChevronUp, Calendar,
  Package, CheckCircle2, XCircle, Truck, Users,
  Eye, FileText, SlidersHorizontal, MessageSquare,
  CircleDot, ArrowUp, ArrowDown, Minus,
  Clock, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

type Statut   = "en_attente" | "approuvee" | "rejetee" | "en_preparation" | "livree" | "annulee"
type Priorite = "urgente" | "haute" | "normale"
type SortKey  = "date" | "priorite" | "statut" | "employe"
type SortDir  = "asc" | "desc"
type ViewMode = "table" | "cards"

interface Article {
  nom: string
  quantiteDemandee: number
  quantiteAccordee?: number
  unite: string
}
interface Employe {
  nom: string
  initiales: string
  service: string
  color: string
}
interface Demande {
  id: string
  reference: string
  employe: Employe
  dateCreation: string
  dateMaj: string
  priorite: Priorite
  statut: Statut
  articles: Article[]
  motifRejet?: string
  annotation?: string
}

// ════════════════════════════════════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════════════════════════════════════

const DATA: Demande[] = [
  {
    id:"1", reference:"DEM-2026-0145",
    employe:{ nom:"Fatima Zahra Idrissi", initiales:"FI", service:"Ressources Humaines",  color:"#6d28d9" },
    dateCreation:"2026-03-12", dateMaj:"2026-03-12", priorite:"urgente", statut:"en_attente",
    articles:[
      { nom:"Ramette papier A4",   quantiteDemandee:10, unite:"ramette" },
      { nom:"Stylos bille bleu",   quantiteDemandee:50, unite:"unité"   },
      { nom:"Chemises cartonnées", quantiteDemandee:20, unite:"unité"   },
    ],
  },
  {
    id:"2", reference:"DEM-2026-0143",
    employe:{ nom:"Youssef Bennani", initiales:"YB", service:"Technique", color:"#0369a1" },
    dateCreation:"2026-03-11", dateMaj:"2026-03-11", priorite:"haute", statut:"en_attente",
    articles:[
      { nom:"Cartouche encre HP noir", quantiteDemandee:4, unite:"unité" },
      { nom:"Clé USB 32 Go",           quantiteDemandee:5, unite:"unité" },
    ],
  },
  {
    id:"3", reference:"DEM-2026-0141",
    employe:{ nom:"Salma Ouazzani", initiales:"SO", service:"Comptabilité", color:"#b45309" },
    dateCreation:"2026-03-10", dateMaj:"2026-03-10", priorite:"normale", statut:"en_attente",
    articles:[
      { nom:"Classeurs A4 (8 cm)", quantiteDemandee:15, unite:"unité" },
      { nom:"Post-it 76x76mm",     quantiteDemandee:10, unite:"bloc"  },
      { nom:"Agrafeuse bureau",    quantiteDemandee:2,  unite:"unité" },
    ],
  },
  {
    id:"4", reference:"DEM-2026-0139",
    employe:{ nom:"Karim El Fassi", initiales:"KF", service:"Juridique", color:"#047857" },
    dateCreation:"2026-03-09", dateMaj:"2026-03-09", priorite:"haute", statut:"approuvee",
    articles:[
      { nom:"Registre comptable", quantiteDemandee:3, quantiteAccordee:2, unite:"unité" },
    ],
    annotation:"Livrer au bureau 204, attention matériel fragile.",
  },
  {
    id:"5", reference:"DEM-2026-0137",
    employe:{ nom:"Nadia Tahiri", initiales:"NT", service:"Communication", color:"#be185d" },
    dateCreation:"2026-03-08", dateMaj:"2026-03-09", priorite:"normale", statut:"rejetee",
    articles:[{ nom:"Écran 27 pouces", quantiteDemandee:2, unite:"unité" }],
    motifRejet:"Budget matériel informatique épuisé pour ce trimestre. Renouveler la demande au T2.",
  },
  {
    id:"6", reference:"DEM-2026-0134",
    employe:{ nom:"Omar Chakir", initiales:"OC", service:"Technique", color:"#0369a1" },
    dateCreation:"2026-03-07", dateMaj:"2026-03-10", priorite:"haute", statut:"en_preparation",
    articles:[
      { nom:"Souris optique USB", quantiteDemandee:3, quantiteAccordee:3, unite:"unité" },
      { nom:"Clavier azerty",     quantiteDemandee:2, quantiteAccordee:2, unite:"unité" },
    ],
  },
  {
    id:"7", reference:"DEM-2026-0128",
    employe:{ nom:"Fatima Zahra Idrissi", initiales:"FI", service:"Ressources Humaines", color:"#6d28d9" },
    dateCreation:"2026-03-03", dateMaj:"2026-03-06", priorite:"normale", statut:"livree",
    articles:[{ nom:"Ramette papier A4", quantiteDemandee:5, quantiteAccordee:5, unite:"ramette" }],
  },
  {
    id:"8", reference:"DEM-2026-0122",
    employe:{ nom:"Salma Ouazzani", initiales:"SO", service:"Comptabilité", color:"#b45309" },
    dateCreation:"2026-02-28", dateMaj:"2026-03-01", priorite:"normale", statut:"annulee",
    articles:[{ nom:"Tableau blanc magnétique", quantiteDemandee:1, unite:"unité" }],
  },
]

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

const G = "#004d2c"  // Al Omrane green

const S: Record<Statut, { label:string; pill:string; dot:string; progress:number }> = {
  en_attente:     { label:"En attente",     pill:"bg-amber-100 text-amber-800 ring-amber-200",  dot:"bg-amber-400",  progress:1 },
  approuvee:      { label:"Approuvée",      pill:"bg-emerald-100 text-emerald-800 ring-emerald-200", dot:"bg-emerald-500", progress:2 },
  en_preparation: { label:"En préparation", pill:"bg-sky-100 text-sky-800 ring-sky-200",       dot:"bg-sky-500",    progress:3 },
  livree:         { label:"Livrée",         pill:"bg-slate-100 text-slate-700 ring-slate-200", dot:"bg-slate-400",  progress:4 },
  rejetee:        { label:"Rejetée",        pill:"bg-red-100 text-red-800 ring-red-200",       dot:"bg-red-500",    progress:-1 },
  annulee:        { label:"Annulée",        pill:"bg-gray-100 text-gray-500 ring-gray-200",    dot:"bg-gray-300",   progress:-1 },
}

const P: Record<Priorite, { label:string; bar:string; ring:string; text:string; order:number }> = {
  urgente: { label:"Urgente", bar:"#dc2626", ring:"ring-red-300",   text:"text-red-700",   order:0 },
  haute:   { label:"Haute",   bar:"#d97706", ring:"ring-amber-300", text:"text-amber-700", order:1 },
  normale: { label:"Normale", bar:"#94a3b8", ring:"ring-slate-200", text:"text-slate-500", order:2 },
}

const TIMELINE = [
  { label:"Soumise",         sub:"par l'employé"       },
  { label:"En validation",   sub:"Chef de service"     },
  { label:"Approuvée",       sub:"Chef de service"     },
  { label:"En préparation",  sub:"Magasin central"     },
  { label:"Livrée",          sub:"Magasin central"     },
]

// ════════════════════════════════════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════════════════════════════════════

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day:"2-digit", month:"short" })

const fmtFull = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })

const ago = (iso: string) => {
  const d = Math.floor((Date.now() - +new Date(iso)) / 86400000)
  if (d === 0) return "Aujourd'hui"
  if (d === 1) return "Hier"
  if (d < 7)  return `${d}j`
  return fmt(iso)
}

// ════════════════════════════════════════════════════════════════════════════
// ATOMS
// ════════════════════════════════════════════════════════════════════════════

function Pip({ statut }: { statut: Statut }) {
  const cfg = S[statut]
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold ring-1",
      cfg.pill
    )}>
      <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot,
        statut === "en_attente" && "animate-pulse"
      )} />
      {cfg.label}
    </span>
  )
}

function Ava({ e, sz = 8 }: { e: Employe; sz?: number }) {
  const cl = `w-${sz} h-${sz}`
  return (
    <div className={cn(cl, "rounded-lg flex items-center justify-center font-bold text-white shrink-0 text-[11px] shadow-sm")}
      style={{ background: e.color }}>
      {e.initiales}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DETAIL DRAWER (slide-in panel, not modal)
// ════════════════════════════════════════════════════════════════════════════

function Drawer({ d, onClose }: { d: Demande; onClose: () => void }) {
  const sc = S[d.statut]
  const pc = P[d.priorite]
  const prog = sc.progress
  const hasAcc = d.articles.some(a => a.quantiteAccordee !== undefined)
  const isNeg = prog === -1

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", h)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", h)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel — slide in from right */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn .2s cubic-bezier(.4,0,.2,1)" }}>

        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0 }
            to   { transform: translateX(0);    opacity: 1 }
          }
        `}</style>

        {/* Header du drawer */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-gray-100 shrink-0">
          <Ava e={d.employe} sz={10} />
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[15px] font-bold text-gray-900 truncate leading-snug">{d.employe.nom}</p>
            <p className="text-xs text-gray-400 mt-0.5">{d.employe.service}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                {d.reference}
              </code>
              <Pip statut={d.statut} />
              <span className={cn("text-[11px] font-semibold ring-1 rounded-full px-2.5 py-[3px]", pc.ring, pc.text)}>
                {d.priorite === "urgente" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5 -mb-px" />}
                {pc.label}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0 -mt-1 -mr-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8 [&::-webkit-scrollbar]:hidden scrollbar-none">

          {/* Méta-données */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label:"Soumission",         value: fmtFull(d.dateCreation) },
              { label:"Dernière activité",  value: ago(d.dateMaj)          },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-gray-50/80 border border-gray-100 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{m.label}</p>
                <p className="text-sm font-bold text-gray-800 mt-1">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Articles */}
          <section>
            <header className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Articles <span className="ml-1 text-gray-300">·</span> <span className="text-gray-500">{d.articles.length}</span>
              </p>
            </header>
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {d.articles.map((a, i) => {
                const reduced = a.quantiteAccordee !== undefined && a.quantiteAccordee < a.quantiteDemandee
                const full    = a.quantiteAccordee !== undefined && a.quantiteAccordee === a.quantiteDemandee
                return (
                  <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors">
                    <span className="text-sm text-gray-700 font-medium flex-1 min-w-0 truncate pr-4">{a.nom}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm tabular-nums text-gray-500">
                        {a.quantiteDemandee}
                        <span className="text-xs text-gray-400 ml-1">{a.unite}</span>
                      </span>
                      {a.quantiteAccordee !== undefined && (
                        <>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          <span className={cn(
                            "text-sm tabular-nums font-semibold",
                            reduced ? "text-amber-600" : "text-emerald-600"
                          )}>
                            {a.quantiteAccordee}
                            <span className="text-xs font-normal ml-1">{a.unite}</span>
                          </span>
                          {reduced && (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-bold">
                              −{a.quantiteDemandee - a.quantiteAccordee}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Timeline */}
          {!isNeg && (
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Progression</p>
              <div className="relative space-y-0">
                {TIMELINE.map((step, i) => {
                  const done    = i < prog
                  const current = i === prog
                  const future  = i > prog

                  return (
                    <div key={i} className="relative flex gap-4">
                      {/* Connector */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "size-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all",
                          done    ? "border-transparent shadow-sm"       : "",
                          current ? "border-[#004d2c] bg-white shadow-md": "",
                          future  ? "border-gray-150 bg-white"           : "",
                        )} style={done ? { background: G } : {}}>
                          {done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : current
                            ? <CircleDot className="w-3.5 h-3.5" style={{ color: G }} />
                            : <div className="size-2 rounded-full bg-gray-200" />
                          }
                        </div>
                        {i < TIMELINE.length - 1 && (
                          <div className={cn(
                            "w-px flex-1 my-0.5",
                            done ? "bg-emerald-200" : "bg-gray-100"
                          )} style={{ minHeight: 20 }} />
                        )}
                      </div>

                      {/* Label */}
                      <div className={cn("pb-5", i === TIMELINE.length - 1 && "pb-0")}>
                        <p className={cn(
                          "text-sm font-semibold leading-none",
                          done || current ? "text-gray-900" : "text-gray-300"
                        )}>
                          {step.label}
                          {current && (
                            <span className="ml-2 text-[10px] font-bold rounded-full px-2 py-0.5"
                              style={{ background: `${G}18`, color: G }}>
                              En cours
                            </span>
                          )}
                        </p>
                        <p className={cn(
                          "text-xs mt-0.5",
                          done || current ? "text-gray-400" : "text-gray-200"
                        )}>
                          {step.sub}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Motif rejet */}
          {d.motifRejet && (
            <section className="rounded-xl border border-red-100 bg-red-50 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Motif de rejet</p>
              <p className="text-sm text-red-700 leading-relaxed">{d.motifRejet}</p>
            </section>
          )}

          {/* Annotation */}
          {d.annotation && (
            <section className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Note magasinier</p>
              <p className="text-sm text-indigo-700 leading-relaxed">{d.annotation}</p>
            </section>
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

  return (
    <>
      <tr
        className="group border-b border-gray-100 last:border-0 hover:bg-[#f8faf9] transition-colors cursor-pointer"
        onClick={() => onOpen(d)}
      >
        {/* Priorité bar */}
        <td className="w-1 py-0 pr-0 pl-0">
          <div className="w-[3px] h-full min-h-[56px] rounded-r-full mx-auto"
            style={{ background: P[d.priorite].bar }} />
        </td>

        {/* Employé */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Ava e={d.employe} sz={8} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{d.employe.nom}</p>
              <p className="text-[11px] text-gray-400 truncate">{d.employe.service}</p>
            </div>
          </div>
        </td>

        {/* Référence */}
        <td className="px-3 py-3.5 hidden lg:table-cell">
          <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
            {d.reference}
          </code>
        </td>

        {/* Articles */}
        <td className="px-3 py-3.5 hidden md:table-cell">
          <button
            onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors group/btn"
          >
            <span className="font-semibold tabular-nums">{d.articles.length}</span>
            <span className="text-gray-400">art.</span>
            {open
              ? <ChevronUp   className="w-3 h-3 text-gray-400" />
              : <ChevronDown className="w-3 h-3 text-gray-400 group-hover/btn:text-gray-600" />
            }
          </button>
        </td>

        {/* Date */}
        <td className="px-3 py-3.5 hidden xl:table-cell">
          <span className="text-xs text-gray-400 tabular-nums">{ago(d.dateCreation)}</span>
        </td>

        {/* Priorité */}
        <td className="px-3 py-3.5 hidden sm:table-cell">
          <span className={cn(
            "text-[11px] font-semibold ring-1 rounded-full px-2.5 py-[3px]",
            P[d.priorite].ring, P[d.priorite].text
          )}>
            {d.priorite === "urgente" && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5 -mb-px" />
            )}
            {P[d.priorite].label}
          </span>
        </td>

        {/* Statut */}
        <td className="px-3 py-3.5">
          <Pip statut={d.statut} />
        </td>

        {/* Action */}
        <td className="px-4 py-3.5 text-right">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400
            opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1.5 rounded-lg
            hover:bg-gray-100 hover:text-gray-700">
            <Eye className="w-3.5 h-3.5" />
            Voir
          </span>
        </td>
      </tr>

      {/* Articles expand — en dehors du tr principal */}
      {open && (
        <tr className="border-b border-gray-100 bg-[#f8faf9]">
          <td colSpan={8} className="px-4 pb-3 pt-0">
            <div className="ml-11 rounded-xl border border-gray-100 overflow-hidden text-xs bg-white">
              {d.articles.map((a, i) => (
                <div key={i} className={cn(
                  "flex items-center justify-between px-4 py-2.5",
                  i < d.articles.length - 1 && "border-b border-gray-50"
                )}>
                  <span className="text-gray-600 font-medium">{a.nom}</span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-gray-500">{a.quantiteDemandee} {a.unite}</span>
                    {a.quantiteAccordee !== undefined && (
                      <>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className={a.quantiteAccordee < a.quantiteDemandee ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                          {a.quantiteAccordee} {a.unite}
                        </span>
                      </>
                    )}
                  </div>
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
// SORTABLE COLUMN HEADER
// ════════════════════════════════════════════════════════════════════════════

function Th({
  label, sk, cur, dir, onSort, className,
}: {
  label: string; sk?: SortKey; cur: SortKey; dir: SortDir
  onSort: (k: SortKey) => void; className?: string
}) {
  const active = sk && cur === sk
  return (
    <th className={cn("px-3 py-3 text-left", className)}>
      {sk ? (
        <button
          onClick={() => onSort(sk)}
          className={cn(
            "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
            active ? "text-gray-800" : "text-gray-400 hover:text-gray-600"
          )}
        >
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

const STATUT_LABELS: Record<Statut | "tous", string> = {
  tous:"Tous", en_attente:"En attente", approuvee:"Approuvées",
  en_preparation:"Préparation", rejetee:"Rejetées", livree:"Livrées", annulee:"Annulées",
}

export default function DemandesEquipePage() {
  const [q, setQ]                           = useState("")
  const [fStatut, setFStatut]               = useState<Statut | "tous">("tous")
  const [fPriorite, setFPriorite]           = useState<Priorite | "tous">("tous" as any)
  const [fService, setFService]             = useState("tous")
  const [sortKey, setSortKey]               = useState<SortKey>("date")
  const [sortDir, setSortDir]               = useState<SortDir>("desc")
  const [drawer, setDrawer]                 = useState<Demande | null>(null)
  const [, startTransition]                 = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    addEventListener("keydown", h)
    return () => removeEventListener("keydown", h)
  }, [])

  const sort = useCallback((k: SortKey) => {
    startTransition(() => {
      setSortDir(d => sortKey === k ? (d === "asc" ? "desc" : "asc") : "desc")
      setSortKey(k)
    })
  }, [sortKey])

  const stats = useMemo(() => DATA.reduce((acc, d) => {
    acc.total++
    acc[d.statut] = (acc[d.statut] ?? 0) + 1
    return acc
  }, { total: 0 } as Record<string, number>), [])

  const services = useMemo(() => ["tous", ...new Set(DATA.map(d => d.employe.service))], [])

  const rows = useMemo(() => {
    const list = DATA.filter(d => {
      if (fStatut !== "tous"   && d.statut !== fStatut) return false
      if ((fPriorite as string) !== "tous" && d.priorite !== fPriorite) return false
      if (fService !== "tous"  && d.employe.service !== fService) return false
      if (q) {
        const lq = q.toLowerCase()
        return d.reference.toLowerCase().includes(lq)
          || d.employe.nom.toLowerCase().includes(lq)
          || d.employe.service.toLowerCase().includes(lq)
          || d.articles.some(a => a.nom.toLowerCase().includes(lq))
      }
      return true
    })
    return list.sort((a, b) => {
      let v = 0
      if (sortKey === "date")     v = a.dateCreation.localeCompare(b.dateCreation)
      if (sortKey === "priorite") v = P[a.priorite].order - P[b.priorite].order
      if (sortKey === "statut")   v = a.statut.localeCompare(b.statut)
      if (sortKey === "employe")  v = a.employe.nom.localeCompare(b.employe.nom)
      return sortDir === "asc" ? v : -v
    })
  }, [q, fStatut, fPriorite, fService, sortKey, sortDir])

  const hasFilters = q || fStatut !== "tous" || (fPriorite as string) !== "tous" || fService !== "tous"

  return (
    <>
      {drawer && <Drawer d={drawer} onClose={() => setDrawer(null)} />}

      <div className="space-y-5 pb-8">

        {/* ── Page header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Chef de Service</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">
              Demandes équipe
            </h1>
          </div>
          <p className="text-sm text-gray-400 pb-0.5">
            <span className="font-bold text-gray-700">{DATA.filter(d=>d.statut==="en_attente").length}</span>
            {" "}en attente de validation
          </p>
        </div>

        {/* ── Stat strip ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(["tous","en_attente","approuvee","en_preparation","rejetee","livree"] as const).map(s => {
            const val = s === "tous" ? stats.total : (stats[s] ?? 0)
            const active = fStatut === s
            const colors: Record<string, string> = {
              tous:"#374151", en_attente:"#b45309", approuvee:"#047857",
              en_preparation:"#0369a1", rejetee:"#be123c", livree:"#475569",
            }
            const bgs: Record<string, string> = {
              tous:"#f9fafb", en_attente:"#fffbeb", approuvee:"#f0fdf4",
              en_preparation:"#f0f9ff", rejetee:"#fff1f2", livree:"#f8fafc",
            }
            const borders: Record<string, string> = {
              tous:"#e5e7eb", en_attente:"#fde68a", approuvee:"#bbf7d0",
              en_preparation:"#bae6fd", rejetee:"#fecdd3", livree:"#e2e8f0",
            }
            return (
              <button
                key={s}
                onClick={() => setFStatut(s)}
                className={cn(
                  "rounded-xl px-3 py-3 text-center border transition-all duration-150",
                  "hover:scale-[1.02] active:scale-[.98]",
                  active && "shadow-md scale-[1.02]"
                )}
                style={{
                  background: bgs[s],
                  borderColor: active ? colors[s] + "60" : borders[s],
                  boxShadow: active ? `0 0 0 2px ${colors[s]}25` : undefined,
                }}
              >
                <p className="text-xl font-extrabold tabular-nums" style={{ color: colors[s] }}>{val}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-0.5 leading-tight">
                  {STATUT_LABELS[s]}
                </p>
              </button>
            )
          })}
        </div>

        {/* ── Search + filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher…"
              className={cn(
                "w-full pl-10 pr-20 py-2.5 text-sm rounded-xl border bg-white transition-all",
                "placeholder:text-gray-300 focus:outline-none",
                q
                  ? "border-gray-400 ring-1 ring-gray-300"
                  : "border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-200"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {q && (
                <button onClick={() => setQ("")} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex text-[9px] text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 font-mono tracking-wide">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Priorité */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {(["tous","urgente","haute","normale"] as const).map(p => {
              const active = fPriorite === (p as any)
              const color = p === "urgente" ? "#dc2626" : p === "haute" ? "#d97706" : p === "normale" ? "#64748b" : G
              return (
                <button
                  key={p}
                  onClick={() => setFPriorite(p as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                    active ? "text-white shadow-sm" : "text-gray-400 hover:text-gray-700"
                  )}
                  style={active ? { background: color } : {}}
                >
                  {p === "tous" ? "Toutes" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              )
            })}
          </div>

          {/* Service */}
          <select
            value={fService}
            onChange={e => setFService(e.target.value)}
            className="text-[11px] font-semibold px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 focus:outline-none cursor-pointer hover:border-gray-300 transition-colors"
          >
            {services.map(s => (
              <option key={s} value={s}>{s === "tous" ? "Tous les services" : s}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setQ(""); setFStatut("tous"); setFPriorite("tous" as any); setFService("tous") }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-400 hover:text-red-500 hover:border-red-300 transition-all"
            >
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="w-[3px] p-0" />
                <Th label="Employé"   sk="employe"  cur={sortKey} dir={sortDir} onSort={sort} className="px-4 py-3 w-56" />
                <Th label="Réf."                    cur={sortKey} dir={sortDir} onSort={sort} className="hidden lg:table-cell w-40" />
                <Th label="Articles"                cur={sortKey} dir={sortDir} onSort={sort} className="hidden md:table-cell w-24" />
                <Th label="Date"      sk="date"     cur={sortKey} dir={sortDir} onSort={sort} className="hidden xl:table-cell w-20" />
                <Th label="Priorité"  sk="priorite" cur={sortKey} dir={sortDir} onSort={sort} className="hidden sm:table-cell w-28" />
                <Th label="Statut"    sk="statut"   cur={sortKey} dir={sortDir} onSort={sort} className="w-36" />
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-500">Aucune demande</p>
                        <p className="text-xs text-gray-400 mt-0.5">Ajustez vos filtres</p>
                      </div>
                      {hasFilters && (
                        <button
                          onClick={() => { setQ(""); setFStatut("tous"); setFPriorite("tous" as any); setFService("tous") }}
                          className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map(d => <Row key={d.id} d={d} onOpen={setDrawer} />)
              )}
            </tbody>
          </table>

          {/* Table footer */}
          {rows.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-400">
                <span className="font-bold text-gray-600">{rows.length}</span> résultat{rows.length > 1 ? "s" : ""}
                {rows.length !== DATA.length && <span className="text-gray-300"> / {DATA.length}</span>}
              </p>
              <p className="text-xs text-gray-400">
                Cliquer sur une ligne pour voir le détail
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}