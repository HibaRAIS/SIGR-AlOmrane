"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import {
  CheckCircle2, XCircle, SlidersHorizontal, MessageSquare,
  ChevronDown, ChevronUp, Search, Filter, Clock,
  AlertTriangle, User, Calendar, Package, Minus, Plus,
  ClipboardCheck, ArrowUpCircle, X, Check, FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Priorite = "urgente" | "haute" | "normale"
type Statut   = "en_attente" | "approuvee" | "rejetee"

interface Article {
  id: string
  nom: string
  quantiteDemandee: number
  quantiteAjustee: number
  unite: string
}

interface Demande {
  id: string
  reference: string
  employe: { nom: string; initiales: string; service: string }
  datesoumission: string
  priorite: Priorite
  statut: Statut
  articles: Article[]
  motifRejet?: string
  annotation?: string
}

// ─── DONNÉES MOCK ─────────────────────────────────────────────────────────────

const DEMANDES_INITIALES: Demande[] = [
  {
    id: "1",
    reference: "DEM-2026-0145",
    employe: { nom: "Fatima Zahra Idrissi", initiales: "FI", service: "Service RH" },
    datesoumission: "2026-03-12",
    priorite: "urgente",
    statut: "en_attente",
    articles: [
      { id: "a1", nom: "Ramette papier A4", quantiteDemandee: 10, quantiteAjustee: 10, unite: "ramette" },
      { id: "a2", nom: "Stylos bille bleu", quantiteDemandee: 50, quantiteAjustee: 50, unite: "unité" },
      { id: "a3", nom: "Chemises cartonnées", quantiteDemandee: 20, quantiteAjustee: 20, unite: "unité" },
    ],
  },
  {
    id: "2",
    reference: "DEM-2026-0143",
    employe: { nom: "Youssef Bennani", initiales: "YB", service: "Service Technique" },
    datesoumission: "2026-03-11",
    priorite: "haute",
    statut: "en_attente",
    articles: [
      { id: "b1", nom: "Cartouche encre HP noir", quantiteDemandee: 4, quantiteAjustee: 4, unite: "unité" },
      { id: "b2", nom: "Clé USB 32 Go", quantiteDemandee: 5, quantiteAjustee: 5, unite: "unité" },
    ],
  },
  {
    id: "3",
    reference: "DEM-2026-0141",
    employe: { nom: "Salma Ouazzani", initiales: "SO", service: "Service Comptabilité" },
    datesoumission: "2026-03-10",
    priorite: "normale",
    statut: "en_attente",
    articles: [
      { id: "c1", nom: "Classeurs A4 (8 cm)", quantiteDemandee: 15, quantiteAjustee: 15, unite: "unité" },
      { id: "c2", nom: "Post-it 76x76mm", quantiteDemandee: 10, quantiteAjustee: 10, unite: "bloc" },
      { id: "c3", nom: "Agrafeuse bureau", quantiteDemandee: 2, quantiteAjustee: 2, unite: "unité" },
      { id: "c4", nom: "Agrafes 26/6", quantiteDemandee: 10, quantiteAjustee: 10, unite: "boîte" },
    ],
  },
  {
    id: "4",
    reference: "DEM-2026-0139",
    employe: { nom: "Karim El Fassi", initiales: "KF", service: "Service Juridique" },
    datesoumission: "2026-03-09",
    priorite: "haute",
    statut: "approuvee",
    articles: [
      { id: "d1", nom: "Registre comptable", quantiteDemandee: 3, quantiteAjustee: 2, unite: "unité" },
    ],
    annotation: "Livrer au bureau 204, attention matériel fragile.",
  },
  {
    id: "5",
    reference: "DEM-2026-0137",
    employe: { nom: "Nadia Tahiri", initiales: "NT", service: "Service Communication" },
    datesoumission: "2026-03-08",
    priorite: "normale",
    statut: "rejetee",
    articles: [
      { id: "e1", nom: "Écran 27 pouces", quantiteDemandee: 2, quantiteAjustee: 2, unite: "unité" },
    ],
    motifRejet: "Budget matériel informatique épuisé pour ce trimestre. Renouveler la demande au T2.",
  },
]

// ─── CONFIGS ─────────────────────────────────────────────────────────────────

const PRIORITE_CONFIG: Record<Priorite, { label: string; color: string; bg: string; icon: typeof AlertTriangle; dot: string }> = {
  urgente: { label: "Urgente",  color: "text-red-700",    bg: "bg-red-50 border border-red-200",    icon: AlertTriangle, dot: "bg-red-500" },
  haute:   { label: "Haute",    color: "text-amber-700",  bg: "bg-amber-50 border border-amber-200",icon: ArrowUpCircle, dot: "bg-amber-400" },
  normale: { label: "Normale",  color: "text-slate-600",  bg: "bg-slate-50 border border-slate-200",icon: Clock,         dot: "bg-slate-400" },
}

const STATUT_CONFIG: Record<Statut, { label: string; color: string; bg: string }> = {
  en_attente: { label: "En attente",  color: "text-amber-700",  bg: "bg-amber-50 border border-amber-200" },
  approuvee:  { label: "Approuvée",   color: "text-green-700",  bg: "bg-green-50 border border-green-200" },
  rejetee:    { label: "Rejetée",     color: "text-red-700",    bg: "bg-red-50 border border-red-200" },
}

const AL_OMRANE_GREEN = "#004d2c"

// ─── MODAL ACTIONS ────────────────────────────────────────────────────────────

type ModalType = "approuver" | "rejeter" | "ajuster" | "annoter" | null

interface ModalState {
  type: ModalType
  demande: Demande | null
}

function ActionModal({
  modal,
  onClose,
  onConfirm,
}: {
  modal: ModalState
  onClose: () => void
  onConfirm: (data: Record<string, unknown>) => void
}) {
  const [motif, setMotif]         = useState("")
  const [annotation, setAnnotation] = useState(modal.demande?.annotation ?? "")
  const [articles, setArticles]   = useState<Article[]>(
    modal.demande?.articles.map(a => ({ ...a })) ?? []
  )

  if (!modal.type || !modal.demande) return null

  const adjustQty = (id: string, delta: number) => {
    setArticles(prev => prev.map(a =>
      a.id === id
        ? { ...a, quantiteAjustee: Math.max(0, Math.min(a.quantiteDemandee, a.quantiteAjustee + delta)) }
        : a
    ))
  }

  const configs: Record<NonNullable<ModalType>, { title: string; icon: React.ElementType; iconColor: string; confirmLabel: string; confirmColor: string }> = {
    approuver: { title: "Approuver la demande", icon: CheckCircle2,     iconColor: "text-green-600", confirmLabel: "Confirmer l'approbation", confirmColor: "bg-[#004d2c] hover:bg-[#003820]" },
    rejeter:   { title: "Rejeter la demande",   icon: XCircle,          iconColor: "text-red-600",   confirmLabel: "Confirmer le rejet",       confirmColor: "bg-red-600 hover:bg-red-700" },
    ajuster:   { title: "Ajuster les quantités",icon: SlidersHorizontal,iconColor: "text-blue-600",  confirmLabel: "Enregistrer les ajustements",confirmColor: "bg-blue-600 hover:bg-blue-700" },
    annoter:   { title: "Annotation magasinier",icon: MessageSquare,    iconColor: "text-indigo-600",confirmLabel: "Enregistrer l'annotation", confirmColor: "bg-indigo-600 hover:bg-indigo-700" },
  }

  const cfg = configs[modal.type]
  const Icon = cfg.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className={cn("p-2 rounded-xl bg-gray-50", cfg.iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">{cfg.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{modal.demande.reference} · {modal.demande.employe.nom}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* APPROUVER */}
          {modal.type === "approuver" && (
            <div className="rounded-xl bg-green-50 border border-green-100 p-4">
              <p className="text-sm text-green-800 font-medium">Récapitulatif des articles à approuver</p>
              <ul className="mt-3 space-y-2">
                {modal.demande.articles.map(a => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{a.nom}</span>
                    <span className="font-semibold text-green-700">{a.quantiteDemandee} {a.unite}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* REJETER */}
          {modal.type === "rejeter" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Motif de rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motif}
                onChange={e => setMotif(e.target.value)}
                placeholder="Expliquez la raison du rejet pour informer l'employé..."
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent placeholder:text-gray-300"
              />
              <p className="text-xs text-gray-400">{motif.length} caractères — minimum recommandé : 20</p>
            </div>
          )}

          {/* AJUSTER */}
          {modal.type === "ajuster" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Ajustez les quantités accordées (≤ quantité demandée)</p>
              {articles.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="flex-1 text-sm text-gray-700 truncate">{a.nom}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => adjustQty(a.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-12 text-center text-sm font-semibold">
                      {a.quantiteAjustee}
                      <span className="text-[10px] text-gray-400 font-normal ml-0.5">/{a.quantiteDemandee}</span>
                    </span>
                    <button
                      onClick={() => adjustQty(a.id, +1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-xs text-gray-400 w-10">{a.unite}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ANNOTER */}
          {modal.type === "annoter" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message pour le magasinier</label>
              <textarea
                value={annotation}
                onChange={e => setAnnotation(e.target.value)}
                placeholder="Ex : Livrer au bureau 204, attention matériel fragile..."
                rows={4}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder:text-gray-300"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (modal.type === "rejeter" && motif.length < 5) return
              onConfirm({
                type: modal.type,
                demandeId: modal.demande!.id,
                motif,
                annotation,
                articles,
              })
            }}
            disabled={modal.type === "rejeter" && motif.length < 5}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-colors",
              cfg.confirmColor,
              modal.type === "rejeter" && motif.length < 5 && "opacity-40 cursor-not-allowed"
            )}
          >
            {cfg.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── DEMANDE CARD ─────────────────────────────────────────────────────────────

function DemandeCard({
  demande,
  onAction,
}: {
  demande: Demande
  onAction: (type: ModalType, demande: Demande) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const pCfg = PRIORITE_CONFIG[demande.priorite]
  const sCfg = STATUT_CONFIG[demande.statut]
  const PIcon = pCfg.icon
  const enAttente = demande.statut === "en_attente"

  return (
    <div className={cn(
      "bg-white rounded-2xl border transition-all duration-200",
      enAttente ? "border-gray-200 shadow-sm hover:shadow-md" : "border-gray-100 opacity-80"
    )}>
      {/* Bande priorité */}
      <div className={cn(
        "h-1 rounded-t-2xl",
        demande.priorite === "urgente" ? "bg-red-500" :
        demande.priorite === "haute"   ? "bg-amber-400" : "bg-slate-300"
      )} />

      {/* Header card */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar employé */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[13px] text-white shrink-0"
            style={{ background: AL_OMRANE_GREEN }}
          >
            {demande.employe.initiales}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{demande.employe.nom}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{demande.employe.service}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{demande.reference}</span>
              <span className="text-xs text-gray-300">·</span>
              <Calendar className="w-3 h-3 text-gray-300" />
              <span className="text-xs text-gray-400">
                {new Date(demande.datesoumission).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Badges droite */}
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

        {/* Articles (résumé) */}
        <div className="mt-3 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500">
            {demande.articles.length} article{demande.articles.length > 1 ? "s" : ""} —{" "}
            <span className="font-medium text-gray-700">
              {demande.articles.map(a => a.nom).slice(0, 2).join(", ")}
              {demande.articles.length > 2 && ` +${demande.articles.length - 2} autres`}
            </span>
          </span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" />Réduire</> : <><ChevronDown className="w-3 h-3" />Détails</>}
          </button>
        </div>
      </div>

      {/* Articles détaillés (expand) */}
      {expanded && (
        <div className="mx-5 mb-3 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Article</th>
                <th className="text-right px-4 py-2 font-semibold text-gray-500">Demandé</th>
                {demande.statut === "approuvee" && <th className="text-right px-4 py-2 font-semibold text-gray-500">Accordé</th>}
              </tr>
            </thead>
            <tbody>
              {demande.articles.map((a, i) => (
                <tr key={a.id} className={i < demande.articles.length - 1 ? "border-b border-gray-100" : ""}>
                  <td className="px-4 py-2.5 text-gray-700">{a.nom}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-gray-700">{a.quantiteDemandee} {a.unite}</td>
                  {demande.statut === "approuvee" && (
                    <td className={cn("px-4 py-2.5 text-right font-semibold",
                      a.quantiteAjustee < a.quantiteDemandee ? "text-amber-600" : "text-green-600"
                    )}>
                      {a.quantiteAjustee} {a.unite}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Motif rejet / Annotation */}
      {demande.motifRejet && (
        <div className="mx-5 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
          <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{demande.motifRejet}</p>
        </div>
      )}
      {demande.annotation && (
        <div className="mx-5 mb-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-700">{demande.annotation}</p>
        </div>
      )}

      {/* Actions */}
      {enAttente && (
        <div className="flex items-center gap-2 px-5 py-3 border-t border-gray-50">
          <button
            onClick={() => onAction("approuver", demande)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Approuver
          </button>
          <button
            onClick={() => onAction("ajuster", demande)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Ajuster
          </button>
          <button
            onClick={() => onAction("annoter", demande)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Annoter
          </button>
          <button
            onClick={() => onAction("rejeter", demande)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            Rejeter
          </button>
        </div>
      )}
    </div>
  )
}

// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────────

export default function FileValidationPage() {
  const [demandes, setDemandes]     = useState<Demande[]>(DEMANDES_INITIALES)
  const [modal, setModal]           = useState<ModalState>({ type: null, demande: null })
  const [search, setSearch]         = useState("")
  const [filtreStatut, setFiltreStatut]     = useState<Statut | "tous">("tous")
  const [filtrePriorite, setFiltrePriorite] = useState<Priorite | "toutes">("toutes")
  const [filtreEmploye, setFiltreEmploye]   = useState("")

  // Stats
  const stats = useMemo(() => ({
    total:      demandes.length,
    attente:    demandes.filter(d => d.statut === "en_attente").length,
    approuvees: demandes.filter(d => d.statut === "approuvee").length,
    rejetees:   demandes.filter(d => d.statut === "rejetee").length,
  }), [demandes])

  // Filtrage
  const demandesFiltrees = useMemo(() => {
    return demandes.filter(d => {
      if (filtreStatut !== "tous" && d.statut !== filtreStatut) return false
      if (filtrePriorite !== "toutes" && d.priorite !== filtrePriorite) return false
      if (search && !d.reference.toLowerCase().includes(search.toLowerCase()) &&
          !d.employe.nom.toLowerCase().includes(search.toLowerCase())) return false
      if (filtreEmploye && !d.employe.nom.toLowerCase().includes(filtreEmploye.toLowerCase())) return false
      return true
    })
  }, [demandes, filtreStatut, filtrePriorite, search, filtreEmploye])

  const openModal = (type: ModalType, demande: Demande) =>
    setModal({ type, demande })

  const closeModal = () => setModal({ type: null, demande: null })

  const handleConfirm = (data: Record<string, unknown>) => {
    setDemandes(prev => prev.map(d => {
      if (d.id !== data.demandeId) return d
      switch (data.type) {
        case "approuver":
          return { ...d, statut: "approuvee" as Statut }
        case "rejeter":
          return { ...d, statut: "rejetee" as Statut, motifRejet: data.motif as string }
        case "ajuster":
          return { ...d, statut: "approuvee" as Statut, articles: data.articles as Article[] }
        case "annoter":
          return { ...d, annotation: data.annotation as string }
        default:
          return d
      }
    }))
    closeModal()
  }

  const employes = [...new Set(demandes.map(d => d.employe.nom))]

  return (
    <>
      {/* Modal */}
      {modal.type && (
        <ActionModal modal={modal} onClose={closeModal} onConfirm={handleConfirm} />
      )}

      <div className="space-y-6">

        {/* ── En-tête page ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardCheck className="w-5 h-5" style={{ color: AL_OMRANE_GREEN }} />
              <h1 className="text-xl font-bold text-gray-900">File de Validation</h1>
            </div>
            <p className="text-sm text-gray-500">
              Gérez les demandes de votre équipe — approbation, ajustement et suivi.
            </p>
          </div>
          {stats.attente > 0 && (
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                {stats.attente} en attente
              </span>
            </div>
          )}
        </div>

        {/* ── Stats rapides ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total",       value: stats.total,      color: "text-gray-700",  bg: "bg-white border border-gray-200" },
            { label: "En attente",  value: stats.attente,    color: "text-amber-700", bg: "bg-amber-50 border border-amber-200" },
            { label: "Approuvées",  value: stats.approuvees, color: "text-green-700", bg: "bg-green-50 border border-green-200" },
            { label: "Rejetées",    value: stats.rejetees,   color: "text-red-700",   bg: "bg-red-50 border border-red-200" },
          ].map(s => (
            <div key={s.label} className={cn("rounded-xl px-4 py-3 text-center", s.bg)}>
              <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par référence ou nom d'employé..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-300"
              style={{ "--tw-ring-color": AL_OMRANE_GREEN } as React.CSSProperties}
            />
          </div>

          {/* Filtres pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-3.5 h-3.5 text-gray-400" />

            {/* Statut */}
            <div className="flex gap-1">
              {(["tous", "en_attente", "approuvee", "rejetee"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFiltreStatut(s)}
                  className={cn(
                    "text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors",
                    filtreStatut === s
                      ? "text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                  style={filtreStatut === s ? { background: AL_OMRANE_GREEN } : {}}
                >
                  {{ tous: "Tous", en_attente: "En attente", approuvee: "Approuvées", rejetee: "Rejetées" }[s]}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-gray-200" />

            {/* Priorité */}
            <div className="flex gap-1">
              {(["toutes", "urgente", "haute", "normale"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setFiltrePriorite(p)}
                  className={cn(
                    "text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors",
                    filtrePriorite === p
                      ? p === "urgente" ? "bg-red-500 text-white"
                      : p === "haute"   ? "bg-amber-400 text-white"
                      : p === "normale" ? "bg-slate-400 text-white"
                      : "text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                  style={filtrePriorite === p && p === "toutes" ? { background: AL_OMRANE_GREEN } : {}}
                >
                  {{ toutes: "Toutes priorités", urgente: "Urgente", haute: "Haute", normale: "Normale" }[p]}
                </button>
              ))}
            </div>

            {/* Reset */}
            {(search || filtreStatut !== "tous" || filtrePriorite !== "toutes") && (
              <button
                onClick={() => { setSearch(""); setFiltreStatut("tous"); setFiltrePriorite("toutes") }}
                className="ml-auto text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* ── Liste des demandes ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {demandesFiltrees.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Aucune demande trouvée</p>
              <p className="text-xs mt-1">Modifiez vos filtres pour afficher des résultats</p>
            </div>
          ) : (
            demandesFiltrees.map(d => (
              <DemandeCard key={d.id} demande={d} onAction={openModal} />
            ))
          )}
        </div>

        {/* Footer count */}
        {demandesFiltrees.length > 0 && (
          <p className="text-center text-xs text-gray-400 pb-4">
            {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? "s" : ""} affichée{demandesFiltrees.length > 1 ? "s" : ""}
            {demandesFiltrees.length !== demandes.length && ` sur ${demandes.length}`}
          </p>
        )}
      </div>
    </>
  )
}