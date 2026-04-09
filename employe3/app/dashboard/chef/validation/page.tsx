"use client"

import { useState, useEffect, useMemo } from "react"
import {
  CheckCircle2, XCircle, SlidersHorizontal, MessageSquare,
  ChevronDown, ChevronUp, Search, Filter, Clock,
  AlertTriangle, Calendar, Package, Minus, Plus,
  ClipboardCheck, ArrowUpCircle, X, Check, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = "http://localhost:8081"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Priorite = "urgente" | "haute" | "normale"
type Statut   = "en_attente" | "approuvee" | "rejetee"

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
  urgence: string
  statut: string
  justification: string
  lignes: Article[]
  motifRefus?: string
  valideParNom?: string
}

// ─── CONFIGS ─────────────────────────────────────────────────────────────────

const PRIORITE_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  NORMAL:   { label: "Normale",  color: "text-slate-600",  bg: "bg-slate-50 border border-slate-200",  dot: "bg-slate-400"  },
  URGENT:   { label: "Urgente",  color: "text-amber-700",  bg: "bg-amber-50 border border-amber-200",  dot: "bg-amber-400"  },
  CRITIQUE: { label: "Critique", color: "text-red-700",    bg: "bg-red-50 border border-red-200",      dot: "bg-red-500"    },
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  EN_ATTENTE: { label: "En attente", color: "text-amber-700", bg: "bg-amber-50 border border-amber-200" },
  APPROUVEE:  { label: "Approuvée",  color: "text-green-700", bg: "bg-green-50 border border-green-200" },
  REFUSEE:    { label: "Rejetée",    color: "text-red-700",   bg: "bg-red-50 border border-red-200"     },
}

const AL_OMRANE_GREEN = "#004d2c"

// ─── MODAL ────────────────────────────────────────────────────────────────────

type ModalType = "approuver" | "rejeter" | null

function ActionModal({
  type, demande, onClose, onConfirm
}: {
  type: ModalType
  demande: Demande | null
  onClose: () => void
  onConfirm: (motif?: string) => void
}) {
  const [motif, setMotif] = useState("")
  if (!type || !demande) return null

  const isRejet = type === "rejeter"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className={cn("p-2 rounded-xl", isRejet ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
            {isRejet ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold">{isRejet ? "Rejeter la demande" : "Approuver la demande"}</h3>
            <p className="text-xs text-gray-500">{demande.reference} · {demande.employeNom}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>

        <div className="px-6 py-5">
          {isRejet ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Motif de rejet <span className="text-red-500">*</span></label>
              <textarea
                value={motif}
                onChange={e => setMotif(e.target.value)}
                placeholder="Expliquez la raison du rejet..."
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <p className="text-xs text-gray-400">{motif.length} caractères</p>
            </div>
          ) : (
            <div className="rounded-xl bg-green-50 border border-green-100 p-4">
              <p className="text-sm text-green-800 font-medium mb-3">Articles à approuver :</p>
              {demande.lignes.map(l => (
                <div key={l.produitId} className="flex justify-between text-sm py-1">
                  <span className="text-gray-700">{l.produitDesignation}</span>
                  <span className="font-semibold text-green-700">x{l.quantite}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={() => onConfirm(isRejet ? motif : undefined)}
            disabled={isRejet && motif.length < 5}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors",
              isRejet ? "bg-red-600 hover:bg-red-700" : "bg-[#004d2c] hover:bg-[#003820]",
              isRejet && motif.length < 5 && "opacity-40 cursor-not-allowed"
            )}
          >
            {isRejet ? "Confirmer le rejet" : "Confirmer l'approbation"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DEMANDE CARD ─────────────────────────────────────────────────────────────

function DemandeCard({ demande, onAction }: { demande: Demande; onAction: (type: ModalType, d: Demande) => void }) {
  const [expanded, setExpanded] = useState(false)
  const pCfg = PRIORITE_CONFIG[demande.urgence] ?? PRIORITE_CONFIG["NORMAL"]
  const sCfg = STATUT_CONFIG[demande.statut] ?? STATUT_CONFIG["EN_ATTENTE"]
  const enAttente = demande.statut === "EN_ATTENTE"
  const initiales = demande.employeNom?.substring(0, 2).toUpperCase() ?? "??"

  return (
    <div className={cn("bg-white rounded-2xl border transition-all duration-200", enAttente ? "border-gray-200 shadow-sm hover:shadow-md" : "border-gray-100 opacity-80")}>
      <div className={cn("h-1 rounded-t-2xl", demande.urgence === "CRITIQUE" ? "bg-red-500" : demande.urgence === "URGENT" ? "bg-amber-400" : "bg-slate-300")} />

      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[13px] text-white shrink-0" style={{ background: AL_OMRANE_GREEN }}>
            {initiales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{demande.employeNom}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{demande.structureNom}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-gray-400">{demande.reference}</span>
              <span className="text-xs text-gray-300">·</span>
              <Calendar className="w-3 h-3 text-gray-300" />
              <span className="text-xs text-gray-400">
                {new Date(demande.dateCreation).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={cn("flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", pCfg.bg, pCfg.color)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", pCfg.dot)} />
              {pCfg.label}
            </span>
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", sCfg.bg, sCfg.color)}>
              {sCfg.label}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500">
            {demande.lignes.length} article{demande.lignes.length > 1 ? "s" : ""} —{" "}
            <span className="font-medium text-gray-700">
              {demande.lignes.slice(0, 2).map(l => l.produitDesignation).join(", ")}
              {demande.lignes.length > 2 && ` +${demande.lignes.length - 2} autres`}
            </span>
          </span>
          <button onClick={() => setExpanded(v => !v)} className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600">
            {expanded ? <><ChevronUp className="w-3 h-3" />Réduire</> : <><ChevronDown className="w-3 h-3" />Détails</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mx-5 mb-3 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Article</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Réf</th>
                <th className="text-right px-4 py-2 font-semibold text-gray-500">Qté</th>
              </tr>
            </thead>
            <tbody>
              {demande.lignes.map((l, i) => (
                <tr key={l.produitId} className={i < demande.lignes.length - 1 ? "border-b border-gray-100" : ""}>
                  <td className="px-4 py-2.5 text-gray-700">{l.produitDesignation}</td>
                  <td className="px-4 py-2.5 text-gray-400">{l.produitReference}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-700">{l.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {demande.justification && (
        <div className="mx-5 mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          <p className="text-xs text-gray-500"><span className="font-medium">Justification : </span>{demande.justification}</p>
        </div>
      )}

      {demande.motifRefus && (
        <div className="mx-5 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
          <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{demande.motifRefus}</p>
        </div>
      )}

      {enAttente && (
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-50">
          <button
            onClick={() => onAction("approuver", demande)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Approuver
          </button>
          <button
            onClick={() => onAction("rejeter", demande)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors ml-auto"
          >
            <X className="w-3.5 h-3.5" /> Rejeter
          </button>
        </div>
      )}
    </div>
  )
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────

export default function FileValidationPage() {
  const [demandes, setDemandes]   = useState<Demande[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState<{ type: ModalType; demande: Demande | null }>({ type: null, demande: null })
  const [search, setSearch]       = useState("")
  const [filtreStatut, setFiltreStatut] = useState("tous")

  const fetchDemandes = async () => {
    const token = localStorage.getItem("token")
    try {
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

  const handleConfirm = async (motif?: string) => {
    const token = localStorage.getItem("token")
    const { type, demande } = modal
    if (!type || !demande) return

    try {
      if (type === "approuver") {
        await fetch(`${API_URL}/api/demandes/${demande.id}/approuver`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}` }
        })
      } else if (type === "rejeter") {
        await fetch(`${API_URL}/api/demandes/${demande.id}/rejeter`, {
          method: "PUT",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ motifRefus: motif })
        })
      }
      setModal({ type: null, demande: null })
      fetchDemandes()
    } catch (e) {
      alert("Erreur lors de l'action")
    }
  }

  const stats = useMemo(() => ({
    total:      demandes.length,
    attente:    demandes.filter(d => d.statut === "EN_ATTENTE").length,
    approuvees: demandes.filter(d => d.statut === "APPROUVEE").length,
    rejetees:   demandes.filter(d => d.statut === "REFUSEE").length,
  }), [demandes])

  const filtered = demandes.filter(d => {
    const matchSearch = d.reference?.toLowerCase().includes(search.toLowerCase()) ||
                        d.employeNom?.toLowerCase().includes(search.toLowerCase())
    const matchStatut = filtreStatut === "tous" || d.statut === filtreStatut
    return matchSearch && matchStatut
  })

  return (
    <>
      <ActionModal
        type={modal.type}
        demande={modal.demande}
        onClose={() => setModal({ type: null, demande: null })}
        onConfirm={handleConfirm}
      />

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="w-5 h-5" style={{ color: AL_OMRANE_GREEN }} />
              <h1 className="text-xl font-bold text-gray-900">File de Validation</h1>
            </div>
            <p className="text-sm text-gray-500">Gérez les demandes de votre équipe.</p>
          </div>
          {stats.attente > 0 && (
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">{stats.attente} en attente</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total",      value: stats.total,      color: "text-gray-700",  bg: "bg-white border border-gray-200" },
            { label: "En attente", value: stats.attente,    color: "text-amber-700", bg: "bg-amber-50 border border-amber-200" },
            { label: "Approuvées", value: stats.approuvees, color: "text-green-700", bg: "bg-green-50 border border-green-200" },
            { label: "Rejetées",   value: stats.rejetees,   color: "text-red-700",   bg: "bg-red-50 border border-red-200" },
          ].map(s => (
            <div key={s.label} className={cn("rounded-xl px-4 py-3 text-center", s.bg)}>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par référence ou nom..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2"
            />
          </div>
          <div className="flex gap-1">
            {[
              { value: "tous",       label: "Tous" },
              { value: "EN_ATTENTE", label: "En attente" },
              { value: "APPROUVEE",  label: "Approuvées" },
              { value: "REFUSEE",    label: "Rejetées" },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => setFiltreStatut(s.value)}
                className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors", filtreStatut === s.value ? "text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")}
                style={filtreStatut === s.value ? { background: AL_OMRANE_GREEN } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {loading ? (
          <p className="text-center text-gray-400">Chargement...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {filtered.map(d => (
              <DemandeCard key={d.id} demande={d} onAction={(type, dem) => setModal({ type, demande: dem })} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}