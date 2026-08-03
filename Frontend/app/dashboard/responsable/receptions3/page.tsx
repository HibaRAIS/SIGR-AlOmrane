"use client"

/**
 * Réceptions marchandises — Version Expert v13 (Finale & Purifiée)
 * ═══════════════════════════════════════════════════════════════════
 *
 * CORRECTIONS :
 *  - [SUPPRESSION ANNULATION] Retrait intégral du statut "ANNULEE" et de toute la logique
 *    de suppression/annulation (boutons, boîtes de dialogue, types).
 *  - Tous les composants (DateRangePicker, BonEntreeDialog, etc.) sont bien définis.
 *  - [RELIQUATS EXACTS] La génération d'un reliquat scanne toute la commande source.
 *  - [WORKFLOW STRICT] Les commandes "En cours" n'apparaissent plus dans "Nouvelle réception".
 *  - [NUMÉROTATION] Remplacement complet de "BR" par "RE" (N° Réception).
 *  - [EXPORTS DÉTAILLÉS] CSV, Excel et PDF hyper-détaillés (PMP, Reliquat, BE).
 */

import React, {
  useState, useMemo, useRef, useEffect, useCallback,
} from "react"
import { createPortal } from "react-dom"
import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ClipboardList, Plus, Eye, CalendarDays, Package,
  AlertTriangle, CheckCircle2, Minus, Search,
  FileDown, Printer, X, Hash, Building2, FileText,
  TrendingUp, TrendingDown, Edit, ArrowUpDown, ArrowUp,
  ArrowDown, Receipt, ChevronLeft, ChevronRight,
  Shield, CheckCheck, AlertCircle, Info,
  Paperclip, FileUp, ExternalLink, ZoomIn, ZoomOut,
  RotateCw, Download, ImageIcon, FileIcon, ArrowUpCircle,
  BarChart3, Clock, Check, ChevronsUpDown,
  Calendar, GitMerge, Layers, Link2, Lock,
  ListChecks, ExternalLinkIcon, History,
} from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { cn } from "@/lib/utils"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface LigneCommandeSource {
  produit: { id: number; designation: string; reference: string }
  quantite: number
  prixUnitaireHT: number
  tva: number
}

interface CommandeSource {
  id: number
  reference: string
  codeMarche: string
  statut: string
  fournisseur: { id: number; nom: string; ice: string }
  lignes: LigneCommandeSource[]
  dateCommande?: string
  methode?: string
  numeroMarche?: string
}

interface LigneReception {
  produit: { designation: string; reference?: string; id?: number }
  quantiteCommandee: number
  quantiteRecue: number
  prixUnitaireHT: number
  tva: number
  totalHT: number
  totalTTC: number
  pmpAvant?: number
  pmpApres?: number
  stockAvant?: number
  stockApres?: number
}

interface AuditLog {
  action: string
  user: string
  date: string
  detail?: string
}

interface DocumentJoint {
  nom: string
  url: string
  type: string
}

interface SignatureData {
  img?: string
  dateStr?: string
}

interface BonEntreeSignatures {
  responsableMagasin?: SignatureData
  chefLogistique?: SignatureData
}

type StatutReception = "CONFORME" | "PARTIELLE" | "COMPLEMENTAIRE"

interface Reliquat {
  id: string
  commandeId: number
  commandeReference: string
  fournisseurNom: string
  lignes: {
    produitDesignation: string
    produitReference: string
    produitId: number
    quantiteInitiale: number
    quantiteRestante: number
    prixUnitaireHT: number
    tva: number
  }[]
  dateCreation: string
  receptionSourceId: number        
  receptionSourceNumero: string
  statut: "EN_ATTENTE" | "PARTIELLEMENT_TRAITE" | "SOLDE"
  tranches: {
    receptionId: number
    receptionNumero: string
    date: string
    lignes: { produitId: number; quantiteRecue: number }[]
  }[]
}

interface Reception {
  id: number
  numero: string
  tranche: number
  statut: StatutReception
  dateReception: string
  bonLivraison: string
  numeroFacture: string
  codeMarche: string
  receptionnaire: string
  commandeId: number
  commande: { reference: string; fournisseur: { nom: string; ice?: string }; methode?: string }
  lignes: LigneReception[]
  notes: string
  totalHT: number
  totalTTC: number
  createdBy: string
  createdAt: string
  updatedBy?: string
  updatedAt?: string
  auditLog: AuditLog[]
  reliquatLie?: string
  reliquatSource?: string
  documentsJoints?: DocumentJoint[]
  bonEntreeSignatures?: BonEntreeSignatures
  bonEntreeGenere?: boolean
  confirme?: boolean
  confirmeAt?: string
  confirmeBy?: string
}

interface ToastMsg {
  id: string
  type: "success" | "error" | "info" | "warning"
  message: string
}

interface AvancementCommande {
  commandeId: number
  commandeReference: string
  statut: "EN_ATTENTE" | "EN_COURS" | "SOLDEE"
  lignes: {
    produitId: number
    designation: string
    reference: string
    quantiteCommandee: number
    quantiteRecue: number
    quantiteRestante: number
    pourcentage: number
    prixUnitaireHT: number
    tva: number
  }[]
  totalCommandee: number
  totalRecue: number
  pourcentageGlobal: number
}

// ═══════════════════════════════════════════════════════════════════
// DONNÉES MOCK RECALCULÉES
// ═══════════════════════════════════════════════════════════════════

const MOCK_COMMANDES: CommandeSource[] = [
  {
    id:1, reference:"CMD-2025-001", codeMarche:"MRC-2025-042",
    statut:"RECUE", methode:"Marché Public", numeroMarche:"AO-14/2025/ME",
    fournisseur:{ id:1, nom:"Distri Bureau SARL", ice:"001234567000089" },
    dateCommande:"2025-04-01",
    lignes:[
      { produit:{ id:1, designation:"Ramette papier A4 80g", reference:"PAP-A4-80G" }, quantite:100, prixUnitaireHT:37.50, tva:20 },
      { produit:{ id:2, designation:"Stylo bille bleu BIC",  reference:"STY-BL"     }, quantite:200, prixUnitaireHT:3.00,  tva:20 },
      { produit:{ id:3, designation:"Classeur dos 8cm",      reference:"CLS-8CM"    }, quantite:50,  prixUnitaireHT:24.00, tva:20 },
    ],
  },
  {
    id:2, reference:"CMD-2025-002", codeMarche:"",
    statut:"RECUE", methode:"Bon de Commande",
    fournisseur:{ id:2, nom:"Informatique Express", ice:"002345678000012" },
    dateCommande:"2025-04-10",
    lignes:[
      { produit:{ id:4, designation:"Cartouche HP 305 noire", reference:"HP305-BK" }, quantite:10, prixUnitaireHT:150.00, tva:20 },
      { produit:{ id:5, designation:"Toner Brother TN-2420",  reference:"TN2420"   }, quantite:5,  prixUnitaireHT:280.00, tva:20 },
    ],
  },
  {
    id:3, reference:"CMD-2025-003", codeMarche:"MRC-2025-063",
    statut:"RECUE", methode:"Marché Public", numeroMarche:"AO-11/2025/MS",
    fournisseur:{ id:3, nom:"Bureau Plus SARL", ice:"003456789000034" },
    dateCommande:"2025-04-15",
    lignes:[
      { produit:{ id:6, designation:"Agrafeuse métallique 26/6", reference:"AGR-METAL"  }, quantite:20, prixUnitaireHT:28.00, tva:20 },
      { produit:{ id:7, designation:"Boîte d'archives 9x32x23", reference:"ARCHIV-BOX" }, quantite:40, prixUnitaireHT:14.00, tva:20 },
    ],
  },
]

const INIT_RECEPTIONS: Reception[] = [
  {
    id:1, numero:"RE-2025-001", tranche:1, statut:"CONFORME",
    dateReception:"2025-04-15", bonLivraison:"BL-2025-0412",
    numeroFacture:"FAC-2025-789", codeMarche:"MRC-2025-042",
    receptionnaire:"Ahmed Kassimi", commandeId:1,
    confirme:true, confirmeAt:"2025-04-15T10:30:00", confirmeBy:"Nadia Benomar",
    commande:{ reference:"CMD-2025-001", methode:"Marché Public", fournisseur:{ nom:"Distri Bureau SARL", ice:"001234567000089" } },
    lignes:[
      { produit:{ designation:"Ramette papier A4 80g", reference:"PAP-A4-80G", id:1 }, quantiteCommandee:100, quantiteRecue:100, prixUnitaireHT:37.50, tva:20, totalHT:3750, totalTTC:4500, pmpAvant:36.00, pmpApres:37.50, stockAvant:350, stockApres:450 },
      { produit:{ designation:"Stylo bille bleu BIC",  reference:"STY-BL",     id:2 }, quantiteCommandee:200, quantiteRecue:200, prixUnitaireHT:3.00,  tva:20, totalHT:600,  totalTTC:720,  pmpAvant:2.90,  pmpApres:2.92,  stockAvant:600, stockApres:800 },
      { produit:{ designation:"Classeur dos 8cm",      reference:"CLS-8CM",    id:3 }, quantiteCommandee:50,  quantiteRecue:50,  prixUnitaireHT:24.00, tva:20, totalHT:1200, totalTTC:1440, pmpAvant:23.00, pmpApres:23.50, stockAvant:50,  stockApres:100 },
    ],
    notes:"", totalHT:5550, totalTTC:6660,
    createdBy:"Nadia Benomar", createdAt:"2025-04-15T10:30:00",
    bonEntreeGenere:true,
    bonEntreeSignatures:{ responsableMagasin:{ dateStr:"2025-04-15T10:30:00" } },
    auditLog:[],
  },
  {
    id:2, numero:"RE-2025-002", tranche:1, statut:"PARTIELLE",
    dateReception:"2025-04-20", bonLivraison:"BL-2025-0489",
    numeroFacture:"FAC-2025-801", codeMarche:"",
    receptionnaire:"Sara Idrissi", commandeId:2,
    confirme:true, confirmeAt:"2025-04-20T14:15:00", confirmeBy:"Nadia Benomar",
    commande:{ reference:"CMD-2025-002", methode:"Bon de Commande", fournisseur:{ nom:"Informatique Express", ice:"002345678000012" } },
    lignes:[
      { produit:{ designation:"Cartouche HP 305 noire", reference:"HP305-BK", id:4 }, quantiteCommandee:10, quantiteRecue:8, prixUnitaireHT:150.00, tva:20, totalHT:1200, totalTTC:1440, pmpAvant:145.00, pmpApres:148.33, stockAvant:14, stockApres:22 },
    ],
    notes:"2 cartouches manquantes et toners non livrés – avoir fournisseur en cours",
    totalHT:1200, totalTTC:1440,
    reliquatLie:"RLQ-2025-001",
    createdBy:"Nadia Benomar", createdAt:"2025-04-20T14:15:00",
    bonEntreeGenere:true,
    auditLog:[],
  },
]

const INIT_RELIQUATS: Reliquat[] = [
  {
    id:"RLQ-2025-001", commandeId:2, commandeReference:"CMD-2025-002", fournisseurNom:"Informatique Express",
    lignes:[
      { produitDesignation:"Cartouche HP 305 noire", produitReference:"HP305-BK", produitId:4, quantiteInitiale:2, quantiteRestante:2, prixUnitaireHT:150.00, tva:20 },
      { produitDesignation:"Toner Brother TN-2420",  produitReference:"TN2420",   produitId:5, quantiteInitiale:5, quantiteRestante:5, prixUnitaireHT:280.00, tva:20 }
    ],
    dateCreation:"2025-04-20T14:16:00", receptionSourceId:2, receptionSourceNumero:"RE-2025-002", statut:"EN_ATTENTE", tranches:[],
  },
]

// ═══════════════════════════════════════════════════════════════════
// PURE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

function calculerAvancement(cmd: CommandeSource, receptions: Reception[]): AvancementCommande {
  const recs = receptions.filter(r => r.commandeId === cmd.id && r.confirme)
  const qtesRecues = new Map<number, number>()
  recs.forEach(r => r.lignes.forEach(l => {
    if (l.produit.id) qtesRecues.set(l.produit.id, (qtesRecues.get(l.produit.id) ?? 0) + l.quantiteRecue)
  }))
  const lignes = cmd.lignes.map(l => {
    const recu = qtesRecues.get(l.produit.id) ?? 0
    const restante = Math.max(0, l.quantite - recu)
    return {
      produitId: l.produit.id,
      designation: l.produit.designation,
      reference: l.produit.reference,
      quantiteCommandee: l.quantite,
      quantiteRecue: recu,
      quantiteRestante: restante,
      pourcentage: l.quantite > 0 ? Math.round(recu / l.quantite * 100) : 0,
      prixUnitaireHT: l.prixUnitaireHT,
      tva: l.tva,
    }
  })
  const tc = cmd.lignes.reduce((s, l) => s + l.quantite, 0)
  const tr = lignes.reduce((s, l) => s + l.quantiteRecue, 0)
  const pct = tc > 0 ? Math.round(tr / tc * 100) : 0
  const statut: AvancementCommande["statut"] =
    tr === 0 ? "EN_ATTENTE" : pct >= 100 ? "SOLDEE" : "EN_COURS"
  return { commandeId: cmd.id, commandeReference: cmd.reference, statut, lignes, totalCommandee: tc, totalRecue: tr, pourcentageGlobal: pct }
}

function getLignesReliquat(
  cmd: CommandeSource,
  receptions: Reception[],
): { produitId: number; designation: string; reference: string; restant: number; prixUnitaireHT: number; tva: number }[] {
  const av = calculerAvancement(cmd, receptions)
  return av.lignes
    .filter(l => l.quantiteRestante > 0)
    .map(l => ({
      produitId: l.produitId,
      designation: l.designation,
      reference: l.reference,
      restant: l.quantiteRestante,
      prixUnitaireHT: l.prixUnitaireHT,
      tva: l.tva,
    }))
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES & HELPERS
// ═══════════════════════════════════════════════════════════════════

const STATUT_CFG: Record<StatutReception, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  CONFORME:      { label:"Conforme",       color:"text-emerald-700", bg:"bg-emerald-50",  border:"border-emerald-200", icon:CheckCircle2 },
  PARTIELLE:     { label:"Partielle",      color:"text-amber-700",   bg:"bg-amber-50",    border:"border-amber-200",   icon:Minus        },
  COMPLEMENTAIRE:{ label:"Complémentaire", color:"text-blue-700",    bg:"bg-blue-50",     border:"border-blue-200",    icon:GitMerge     },
}

const RLQ_CFG = {
  EN_ATTENTE:           { label:"En attente",           color:"text-amber-700",   bg:"bg-amber-50",    border:"border-amber-200"   },
  PARTIELLEMENT_TRAITE: { label:"Partiellement traité", color:"text-blue-700",    bg:"bg-blue-50",     border:"border-blue-200"    },
  SOLDE:                { label:"Soldé",                color:"text-emerald-700", bg:"bg-emerald-50",  border:"border-emerald-200" },
}

const PAGE_SIZES = [5, 10, 20, 50]
const ME = "Responsable Logistique"

const fmt = (n: number) => n.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = (s?: string) => s ? new Date(s + (s.length === 10 ? "T00:00:00" : "")).toLocaleDateString("fr-FR") : "—"
const toYMD = (d: Date) => d.toISOString().split("T")[0]
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const genRE = (list: Reception[]) => {
  const yr = new Date().getFullYear()
  const max = list.map(r => { const m = r.numero.match(/^RE-\d{4}-(\d+)$/); return m ? +m[1] : 0 }).reduce((a, b) => Math.max(a, b), 0)
  return `RE-${yr}-${String(max + 1).padStart(3, "0")}`
}
const genRLQ = (list: Reliquat[]) => {
  const yr = new Date().getFullYear()
  const max = list.map(r => { const m = r.id.match(/^RLQ-\d{4}-(\d+)$/); return m ? +m[1] : 0 }).reduce((a, b) => Math.max(a, b), 0)
  return `RLQ-${yr}-${String(max + 1).padStart(3, "0")}`
}

const isImg = (d: DocumentJoint) => d.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(d.nom)
const isPdf = (d: DocumentJoint) => d.type === "application/pdf" || /\.pdf$/i.test(d.nom)

// ═══════════════════════════════════════════════════════════════════
// HOOKS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════

function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb() }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [ref, cb])
}

function smartPos(el: HTMLElement, w = 300) {
  const r = el.getBoundingClientRect(), dlg = el.closest('[role="dialog"]')
  if (dlg) {
    const dr = dlg.getBoundingClientRect()
    let l = r.left - dr.left
    if (r.left + w > window.innerWidth) l -= (r.left + w - window.innerWidth + 16)
    return { target: dlg, style: { position: "absolute" as const, top: r.bottom - dr.top + 4, left: l, width: r.width } }
  }
  let l = r.left
  if (r.left + w > window.innerWidth) l -= (r.left + w - window.innerWidth + 16)
  return { target: document.body, style: { position: "fixed" as const, top: r.bottom + 4, left: l, width: r.width } }
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANTS COMMUNS & UI AUXILIAIRES
// ═══════════════════════════════════════════════════════════════════

function Toasts({ toasts, onRemove }: { toasts: ToastMsg[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[200] space-y-2 pointer-events-none">
      {toasts.map(t => {
        const Icon = t.type === "success" ? CheckCheck : t.type === "error" ? AlertCircle : t.type === "warning" ? AlertTriangle : Info
        return (
          <div key={t.id} className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto border",
            t.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : t.type === "error" ? "bg-red-50 border-red-200 text-red-800"
                : t.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
          )}>
            <Icon className="w-4 h-4 shrink-0" />
            {t.message}
            <button onClick={() => onRemove(t.id)} className="ml-2 opacity-50 hover:opacity-100 pointer-events-auto" aria-label="Fermer"><X className="w-3.5 h-3.5" /></button>
          </div>
        )
      })}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sub, colorBg, colorText, isActive, onClick }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string
  colorBg: string; colorText: string; isActive: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} className={cn("group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full", isActive ? "border-emerald-700 ring-2 ring-emerald-700/20 shadow-md" : "border-gray-100 hover:border-gray-200")}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105", colorBg)}>
          <Icon className={cn("w-5 h-5", colorText)} />
        </div>
        {isActive && <div className="w-4 h-4 rounded-full bg-emerald-700 flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></div>}
      </div>
      <div className="text-xl font-bold text-gray-900 mb-0.5">{value}</div>
      <div className="text-[11px] font-medium text-gray-500">{label}</div>
      {sub && <div className="text-[9px] text-gray-400 mt-0.5 font-mono">{sub}</div>}
    </button>
  )
}

function CSelect({ value, onChange, opts, className }: { value: string; onChange: (v: string) => void; opts: { value: string; label: string }[]; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("rounded-xl border-gray-200 bg-white", className)}><SelectValue /></SelectTrigger>
      <SelectContent className="rounded-xl">{opts.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  )
}

function getSBadge(s: StatutReception) {
  const c = STATUT_CFG[s]
  const Icon = c.icon
  return (
    <span title={s === "CONFORME" ? "100% de la commande réceptionnée" : s === "PARTIELLE" ? "Quantités manquantes – reliquat généré" : ""}>
      <Badge className={cn(c.bg, c.color, "border", c.border, "text-[10px] whitespace-nowrap")}>
        <Icon className="w-3 h-3 mr-1" />{c.label}
      </Badge>
    </span>
  )
}

const FileSpreadsheetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M8 13h2" /><path d="M8 17h2" /><path d="M14 13h2" /><path d="M14 17h2" /></svg>

function ExportMenu({ onCSV, onExcel, onPDF, disabled }: { onCSV: () => void; onExcel: () => void; onPDF: () => void; disabled?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="outline" disabled={disabled} className="h-9 rounded-xl border-2 border-gray-200 font-bold gap-2 bg-white text-gray-700 hover:bg-emerald-50 hover:border-emerald-700 hover:text-emerald-700"><FileDown className="w-4 h-4" /> <span className="hidden sm:inline">Exporter</span></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl">
        <DropdownMenuItem onClick={onCSV} className="gap-2 text-xs"><FileText className="w-4 h-4" />Fichier CSV détaillé</DropdownMenuItem>
        <DropdownMenuItem onClick={onExcel} className="gap-2 text-xs"><FileSpreadsheetIcon />Fichier Excel détaillé</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onPDF} className="gap-2 text-xs"><Printer className="w-4 h-4" />Document PDF détaillé</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SigPad({ label, value, onChange }: { label: string; value?: SignatureData; onChange: (d?: SignatureData) => void }) {
  const ref = useRef<SignatureCanvas | null>(null)
  const [signed, setSigned] = useState(!!value?.img)
  const clear = useCallback(() => { ref.current?.clear(); setSigned(false); onChange(undefined) }, [onChange])
  const save = useCallback(() => { if (!ref.current || ref.current.isEmpty()) return; setSigned(true); onChange({ img: ref.current.toDataURL("image/png"), dateStr: new Date().toISOString() }) }, [onChange])
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600 truncate">{label}</span>
        {value?.dateStr && <span className="text-[9px] text-gray-400 font-mono">{fmtDate(value.dateStr)}</span>}
      </div>
      {value?.img
        ? <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-2"><img src={value.img} alt={label} className="h-24 w-full object-contain" /></div>
        : <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden"><SignatureCanvas ref={ref} penColor="#0d3b66" canvasProps={{ className: "w-full h-28 rounded-xl" }} /></div>}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={clear} className="h-7 gap-1 text-xs rounded-lg"><X className="h-3 w-3" />Effacer</Button>
        {!signed && <Button type="button" size="sm" onClick={save} className="h-7 gap-1 bg-emerald-700 text-white hover:bg-emerald-800 text-xs rounded-lg"><CheckCheck className="h-3 w-3" />Valider</Button>}
      </div>
    </div>
  )
}

function BonEntreeA4({ r, sigs }: { r: Reception; sigs: BonEntreeSignatures }) {
  const ht = r.lignes.reduce((s, l) => s + l.totalHT, 0), ttc = r.lignes.reduce((s, l) => s + l.totalTTC, 0), now = new Date()
  const sigDefs = [
    { k: "responsableMagasin" as const, lbl: "Responsable Magasin" },
    { k: "chefLogistique" as const, lbl: "Chef Département\nLogistique" },
  ]
  return (
    <div style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", background: "#fff", color: "#111827", fontFamily: "Arial, sans-serif", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <style>{`@media print{@page{size:A4 portrait;margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #1D6F42", paddingBottom: "14px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "60px", height: "60px", border: "2px solid #1D6F42", borderRadius: "10px", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px" }}>
            <img src="/images/alomrane-logo.png" alt="Al Omrane" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 900, color: "#0d3b66" }}>GROUPE AL OMRANE</div>
            <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "3px" }}>Système Intégré de Gestion des Ressources</div>
            <div style={{ marginTop: "7px", background: "#1D6F42", color: "#fff", padding: "4px 12px", borderRadius: "6px", display: "inline-block", fontSize: "12px", fontWeight: 700 }}>
              BON D'ENTRÉE EN STOCK{r.statut === "PARTIELLE" ? " — RÉCEPTION PARTIELLE" : r.statut === "COMPLEMENTAIRE" ? " — TRANCHE COMPLÉMENTAIRE" : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
          <div style={{ border: "1px solid #1D6F42", borderRadius: "8px", padding: "7px 12px", background: "#E8F5E9", minWidth: "175px", textAlign: "center" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#1D6F42", borderBottom: "1px solid #1D6F42", paddingBottom: "3px", marginBottom: "3px", textTransform: "uppercase" }}>N° Réception</div>
            <div style={{ fontSize: "13px", fontWeight: 900, fontFamily: "monospace", color: "#0d3b66" }}>{r.numero}</div>
            <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>Tranche n°{r.tranche}</div>
          </div>
          <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "5px 12px", background: "#f9fafb", textAlign: "center" }}>
            <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase" }}>Date d'édition</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1f2937" }}>{now.toLocaleDateString("fr-FR")} {now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          {r.reliquatSource && <div style={{ border: "1px solid #3b82f6", borderRadius: "8px", padding: "5px 12px", background: "#eff6ff", textAlign: "center" }}>
            <div style={{ fontSize: "9px", color: "#1d4ed8", textTransform: "uppercase" }}>Apure le reliquat</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#1e40af", fontFamily: "monospace" }}>{r.reliquatSource}</div>
          </div>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", border: "1px solid #1D6F42", borderRadius: "8px", overflow: "hidden", marginBottom: "14px", fontSize: "10px" }}>
        {[["Réf. Commande", r.commande.reference], ["Fournisseur", r.commande.fournisseur.nom], ["N° BL", r.bonLivraison || "—"], ["Date réception", fmtDate(r.dateReception)]].map(([lbl, val], i) => (
          <div key={i} style={{ padding: "8px 10px", borderRight: i < 3 ? "1px solid #1D6F42" : undefined }}>
            <div style={{ fontWeight: 700, color: "#6b7280", textTransform: "uppercase", fontSize: "9px" }}>{lbl}</div>
            <div style={{ fontWeight: 700, color: "#0d3b66", marginTop: "2px" }}>{val}</div>
          </div>
        ))}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", marginBottom: "14px" }}>
        <thead>
          <tr style={{ background: "#0d3b66", color: "#fff" }}>
            {["N°", "Réf.", "Désignation", "Cmdée", "Reçue", "P.U. HT (MAD)", "TVA", "Total TTC (MAD)", "PMP avant", "PMP après", "Observation"].map((h, i) => (
              <th key={i} style={{ border: "1px solid #0d3b66", padding: "5px 5px", textAlign: i === 2 || i === 10 ? "left" : "center", background: i === 4 || i === 7 ? "#1D6F42" : i === 8 || i === 9 ? "#1a3a5c" : undefined, width: ["22px", "68px", undefined, "38px", "38px", "74px", "32px", "86px", "68px", "68px", "76px"][i] }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {r.lignes.map((l, i) => { const e = l.quantiteRecue - l.quantiteCommandee; return (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
              <td style={{ border: "1px solid #d1d5db", padding: "4px 5px", textAlign: "center", color: "#6b7280" }}>{i + 1}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "4px 5px", textAlign: "center", fontFamily: "monospace", color: "#0d3b66", fontWeight: 600 }}>{l.produit.reference || "—"}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "4px 5px", fontWeight: 600, color: "#1f2937" }}>{l.produit.designation}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "4px 5px", textAlign: "center", color: "#6b7280" }}>{l.quantiteCommandee}</td>
              <td style={{ border: "1px solid #1D6F42", padding: "4px 5px", textAlign: "center", fontWeight: 700, color: "#1D6F42", background: "#E8F5E9" }}>{l.quantiteRecue}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "4px 5px", textAlign: "right", fontFamily: "monospace" }}>{fmt(l.prixUnitaireHT)}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "4px 5px", textAlign: "center" }}>{l.tva}%</td>
              <td style={{ border: "1px solid #1D6F42", padding: "4px 5px", textAlign: "right", fontWeight: 700, color: "#1D6F42", background: "#E8F5E9" }}>{fmt(l.totalTTC)}</td>
              <td style={{ border: "1px solid #1a3a5c", padding: "4px 5px", textAlign: "right", fontFamily: "monospace", color: "#374151", background: "#f0f4ff" }}>{l.pmpAvant !== undefined ? fmt(l.pmpAvant) : "—"}</td>
              <td style={{ border: "1px solid #1a3a5c", padding: "4px 5px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#0d3b66", background: "#e8eeff" }}>{l.pmpApres !== undefined ? fmt(l.pmpApres) : "—"}</td>
              <td style={{ border: "1px solid #d1d5db", padding: "4px 5px", color: e < 0 ? "#c2410c" : e > 0 ? "#1d4ed8" : "#6b7280", fontStyle: "italic", fontSize: "8px" }}>
                {e === 0 ? "✓ Conforme" : e < 0 ? `Manque ${Math.abs(e)}` : `Surplus +${e}`}
              </td>
            </tr>
          )})}
          {Array.from({ length: Math.max(0, 6 - r.lignes.length) }).map((_, i) => (
            <tr key={`e${i}`}>{Array.from({ length: 11 }).map((__, j) => <td key={j} style={{ border: "1px solid #d1d5db", padding: "10px 5px", background: j === 4 || j === 7 ? "#f3f4f6" : j === 8 || j === 9 ? "#f5f7ff" : "#fff" }} />)}</tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#E8F5E9", fontWeight: 700, fontSize: "10px" }}>
            <td colSpan={4} style={{ border: "1px solid #1D6F42", padding: "6px 8px", textAlign: "right", color: "#0d3b66", textTransform: "uppercase" }}>Total Général</td>
            <td style={{ border: "1px solid #1D6F42", padding: "6px 8px", textAlign: "center", color: "#1D6F42" }}>{r.lignes.reduce((s, l) => s + l.quantiteRecue, 0)}</td>
            <td colSpan={2} style={{ border: "1px solid #1D6F42" }} />
            <td style={{ border: "1px solid #1D6F42", padding: "6px 8px", textAlign: "right", color: "#1D6F42", fontFamily: "monospace" }}>{fmt(ttc)}</td>
            <td colSpan={3} style={{ border: "1px solid #1D6F42", padding: "6px 8px", textAlign: "right", color: "#6b7280", fontSize: "8px", fontStyle: "italic" }}>Total HT : {fmt(ht)} MAD — TVA incluse par taux de ligne</td>
          </tr>
        </tfoot>
      </table>
      {r.statut !== "CONFORME" && <div style={{ marginBottom: "8px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "6px", padding: "7px 10px", fontSize: "9px", color: "#92400e" }}>
        <strong>⚠ {r.statut === "PARTIELLE" ? "RÉCEPTION PARTIELLE" : "TRANCHE COMPLÉMENTAIRE"} :</strong>{" "}
        {r.statut === "PARTIELLE" ? `Reliquat ${r.reliquatLie || "—"} ouvert. Une ou plusieurs livraisons complémentaires sont attendues.` : `Cette tranche apure le reliquat ${r.reliquatSource || "—"}.`}
      </div>}
      {r.notes && <div style={{ marginBottom: "8px", background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "6px", padding: "7px 10px", fontSize: "9px", color: "#92400e" }}><strong>Observations :</strong> {r.notes}</div>}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: "12px", marginTop: "auto", paddingTop: "10px" }}>
        {sigDefs.map(({ k, lbl }) => { const s = sigs[k]; return (
          <div key={k} style={{ flex: 1, border: "1px solid #1D6F42", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ background: "#E8F5E9", borderBottom: "1px solid #1D6F42", padding: "5px 6px", fontSize: "8px", fontWeight: 700, textAlign: "center", color: "#0d3b66", textTransform: "uppercase", whiteSpace: "pre-line" }}>{lbl}</div>
            <div style={{ height: "60px", background: "#fff", padding: "5px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {s?.img ? <img src={s.img} alt={lbl} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} /> : <span style={{ fontSize: "9px", color: "#9ca3af", fontStyle: "italic" }}>Signature & Cachet…</span>}
            </div>
            <div style={{ background: "#f9fafb", borderTop: "1px solid #1D6F42", padding: "3px 6px", fontSize: "8px", color: "#6b7280", display: "flex", justifyContent: "space-between" }}>
              <span>Date :</span><span style={{ fontFamily: "monospace", color: "#0d3b66" }}>{s?.dateStr ? fmtDate(s.dateStr) : "…/…/20…"}</span>
            </div>
          </div>
        )})}
      </div>
      <div style={{ borderTop: "2px solid #1D6F42", paddingTop: "6px", marginTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#6b7280" }}>
        <span>Document généré par SIGR — Groupe Al Omrane</span><span>Page 1/1</span>
      </div>
    </div>
  )
}

function BonEntreeDialog({ r, init, onClose, onSave }: { r: Reception; init: BonEntreeSignatures; onClose: () => void; onSave: (s: BonEntreeSignatures) => void }) {
  const [sigs, setSigs] = useState(init)
  const printRef = useRef<HTMLDivElement>(null)
  const upd = (k: keyof BonEntreeSignatures, d?: SignatureData) => setSigs(p => { const n = { ...p }; if (d) n[k] = d; else delete n[k]; return n })
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=1100")
    if (!w || !printRef.current) return
    const clone = printRef.current.cloneNode(true) as HTMLElement
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bon d'Entrée — ${r.numero}</title><style>@page{size:A4 portrait;margin:0}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}</style></head><body>${clone.outerHTML}</body></html>`)
    w.document.close(); w.focus(); setTimeout(() => { w.print(); w.close() }, 500)
  }
  return (
    <Dialog open onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] rounded-2xl overflow-hidden bg-gray-50 p-0 flex flex-col [&>button.absolute]:hidden" style={{ maxWidth: "74vw", width: "74vw" }}>
        <DialogTitle className="sr-only">Bon d'Entrée — {r.numero}</DialogTitle>
        <div className="bg-[#0d3b66] h-14 flex items-center justify-between px-6 flex-shrink-0">
          <div className="text-white font-bold flex items-center gap-3">
            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
            Bon d'Entrée en Stock — {r.numero}
            {r.statut !== "CONFORME" && <Badge className={cn(STATUT_CFG[r.statut].bg, STATUT_CFG[r.statut].color, "border", STATUT_CFG[r.statut].border, "text-xs ml-2")}>{STATUT_CFG[r.statut].label}</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { onSave(sigs); onClose() }} className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white h-8 text-sm"><CheckCheck className="w-4 h-4" />Enregistrer signatures</Button>
            <Button onClick={handlePrint} className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0 h-8 text-sm"><Printer className="w-4 h-4" />Imprimer / PDF</Button>
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full w-9 h-9 p-0" onClick={onClose} aria-label="Fermer"><X className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto flex items-start bg-[#525659] p-6 gap-6">
          <div className="flex-1 flex justify-center"><div ref={printRef} className="shadow-2xl flex-shrink-0 bg-white" style={{ width: "210mm", minHeight: "297mm" }}><BonEntreeA4 r={r} sigs={sigs} /></div></div>
          <div className="w-72 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-5 sticky top-0">
            <div><h3 className="text-sm font-bold text-gray-900 mb-1">Signatures numériques</h3><p className="text-xs text-gray-400">Signez dans chaque case.</p></div>
            {[{ k: "responsableMagasin" as const, l: "Responsable Magasin" }, { k: "chefLogistique" as const, l: "Chef Département Logistique" }].map(({ k, l }) => <SigPad key={k} label={l} value={sigs[k]} onChange={v => upd(k, v)} />)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DocViewer({ docs, initIdx = 0, open, onClose, title }: { docs: DocumentJoint[]; initIdx?: number; open: boolean; onClose: () => void; title?: string }) {
  const [idx, setIdx] = useState(initIdx); const [z, setZ] = useState(1); const [rot, setRot] = useState(0)
  useEffect(() => { setIdx(initIdx); setZ(1); setRot(0) }, [initIdx, open])
  if (!open || docs.length === 0) return null
  const d = docs[idx], img = isImg(d), pdf = isPdf(d)
  const prev = () => { setIdx(i => (i - 1 + docs.length) % docs.length); setZ(1); setRot(0) }
  const next = () => { setIdx(i => (i + 1) % docs.length); setZ(1); setRot(0) }
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[95vh] p-0 overflow-hidden bg-gray-950 border-gray-800">
        <DialogTitle><VisuallyHidden>{title ?? "Visionneuse"}</VisuallyHidden></DialogTitle>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-3 min-w-0">
            {img ? <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" /> : <FileIcon className="w-4 h-4 text-blue-400 shrink-0" />}
            <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{d.nom}</p>{title && <p className="text-xs text-gray-400">{title}</p>}</div>
          </div>
          <div className="flex items-center gap-1 ml-4 shrink-0">
            {docs.length > 1 && <div className="flex items-center gap-1 mr-2 bg-gray-800 rounded-lg px-2 py-1"><button onClick={prev} className="text-gray-400 hover:text-white p-0.5" aria-label="Précédent"><ChevronLeft className="w-4 h-4" /></button><span className="text-xs text-gray-300 mx-1 font-mono">{idx + 1}/{docs.length}</span><button onClick={next} className="text-gray-400 hover:text-white p-0.5" aria-label="Suivant"><ChevronRight className="w-4 h-4" /></button></div>}
            {img && <><button onClick={() => setZ(z => Math.max(0.25, z - 0.25))} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800" aria-label="Zoom-"><ZoomOut className="w-4 h-4" /></button><span className="text-xs text-gray-400 w-10 text-center font-mono">{Math.round(z * 100)}%</span><button onClick={() => setZ(z => Math.min(4, z + 0.25))} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800" aria-label="Zoom+"><ZoomIn className="w-4 h-4" /></button><button onClick={() => setRot(r => (r + 90) % 360)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800" aria-label="Rotation"><RotateCw className="w-4 h-4" /></button><div className="w-px h-5 bg-gray-700 mx-1" /></>}
            <a href={d.url} download={d.nom} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800" aria-label="Télécharger"><Download className="w-4 h-4" /></a>
            <a href={d.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800" aria-label="Ouvrir"><ExternalLink className="w-4 h-4" /></a>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-900/50 ml-1" aria-label="Fermer"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="relative bg-gray-950 flex items-center justify-center overflow-auto" style={{ minHeight: "60vh", maxHeight: "calc(95vh - 56px - 60px)" }}>
          {img && <div className="overflow-auto w-full h-full flex items-center justify-center p-4"><img src={d.url} alt={d.nom} style={{ transform: `scale(${z}) rotate(${rot}deg)`, transformOrigin: "center center", transition: "transform 0.2s ease", maxWidth: z === 1 ? "100%" : "none", maxHeight: z === 1 ? "calc(95vh - 180px)" : "none", objectFit: "contain", borderRadius: 8 }} /></div>}
          {pdf && <iframe src={d.url} title={d.nom} className="w-full border-0" style={{ height: "calc(95vh - 180px)", minHeight: 400 }} />}
          {!img && !pdf && <div className="flex flex-col items-center justify-center gap-4 py-20 text-center px-8"><div className="w-20 h-20 rounded-2xl bg-gray-800 flex items-center justify-center"><FileIcon className="w-10 h-10 text-gray-500" /></div><p className="text-white font-medium">{d.nom}</p><div className="flex gap-3"><a href={d.url} download={d.nom} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-xl"><Download className="w-4 h-4" />Télécharger</a><a href={d.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-xl"><ExternalLink className="w-4 h-4" />Ouvrir</a></div></div>}
        </div>
        {docs.length > 1 && <div className="flex gap-2 px-4 py-3 bg-gray-900 border-t border-gray-800 overflow-x-auto">{docs.map((dd, i) => <button key={i} onClick={() => { setIdx(i); setZ(1); setRot(0) }} className={`shrink-0 flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all border ${i === idx ? "border-emerald-500 bg-emerald-900/30" : "border-gray-700 bg-gray-800 hover:border-gray-500"}`}>{isImg(dd) ? <img src={dd.url} alt={dd.nom} className="w-14 h-10 object-cover rounded-lg" /> : <div className="w-14 h-10 bg-gray-700 rounded-lg flex items-center justify-center"><FileIcon className="w-5 h-5 text-gray-400" /></div>}<span className="text-[9px] text-gray-400 max-w-[56px] truncate">{dd.nom}</span></button>)}</div>}
      </DialogContent>
    </Dialog>
  )
}

function AcInput({ value, onChange, suggestions, placeholder, disabled, className, renderSuggestion, getKey, onSelect }: {
  value: string; onChange: (v: string) => void; suggestions: any[]; placeholder?: string; disabled?: boolean; className?: string;
  renderSuggestion: (item: any) => React.ReactNode; getKey: (item: any) => string; onSelect: (item: any) => void;
}) {
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <Input value={value} onChange={e => { onChange(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder={placeholder} disabled={disabled} className={className ?? "rounded-xl h-10 text-sm"} />
      {open && suggestions.length > 0 && !disabled && <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[99999] max-h-72 overflow-y-auto">{suggestions.map(it => <button key={getKey(it)} type="button" onMouseDown={e => { e.preventDefault(); onSelect(it); setOpen(false) }} className="w-full text-left hover:bg-emerald-50 border-b border-gray-100 last:border-b-0 transition-colors">{renderSuggestion(it)}</button>)}</div>}
    </div>
  )
}

function DocCard({ doc, index, onRemove, onPreview }: { doc: DocumentJoint; index: number; onRemove: (i: number) => void; onPreview: (i: number) => void }) {
  const img = isImg(doc), pdf = isPdf(doc)
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-sm transition-all">
      <button type="button" onClick={() => onPreview(index)} className="shrink-0 w-12 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center hover:opacity-90 relative">
        {img ? <><img src={doc.url} alt={doc.nom} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center"><Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 drop-shadow" /></div></>
          : pdf ? <div className="w-full h-full bg-red-50 flex flex-col items-center justify-center gap-0.5"><FileText className="w-5 h-5 text-red-400" /><span className="text-[8px] text-red-400 font-bold">PDF</span></div>
            : <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center gap-0.5"><FileIcon className="w-5 h-5 text-blue-400" /><span className="text-[8px] text-blue-400 font-bold uppercase">{doc.nom.split(".").pop()}</span></div>}
      </button>
      <div className="flex-1 min-w-0">
        <button type="button" onClick={() => onPreview(index)} className="text-xs font-medium text-gray-700 hover:text-emerald-700 truncate block text-left max-w-full">{doc.nom}</button>
        <div className="flex items-center gap-2 mt-0.5">
          <button type="button" onClick={() => onPreview(index)} className="text-[10px] text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />Voir</button>
          <span className="text-gray-200">·</span>
          <a href={doc.url} download={doc.nom} className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />Télécharger</a>
        </div>
      </div>
      <button type="button" onClick={() => onRemove(index)} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

function StatusFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false); const [cfg, setCfg] = useState<{ target: Element; style: any } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null); const dropdownRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [open])
  
  const openD = () => { if (triggerRef.current) { setCfg(smartPos(triggerRef.current, 220)); setOpen(true) } }
  
  const options = [
    { value: "ALL", label: "Tous les statuts", icon: ListChecks },
    { value: "CONFORME", label: "Conforme", icon: CheckCircle2, color: "text-emerald-600" },
    { value: "PARTIELLE", label: "Partielle", icon: Minus, color: "text-amber-600" },
    { value: "COMPLEMENTAIRE", label: "Complémentaire", icon: GitMerge, color: "text-blue-600" },
  ]
  const current = options.find(o => o.value === value) || options[0]

  return (
    <div className="relative">
      <button ref={triggerRef} type="button" onClick={() => open ? setOpen(false) : openD()} className={cn("flex items-center justify-between w-40 h-9 px-3 rounded-xl border text-xs font-medium transition-all outline-none", value !== "ALL" ? "border-emerald-700 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300")}>
        <span className="flex items-center gap-2 truncate">
          <current.icon className={cn("w-3.5 h-3.5", value !== "ALL" ? "text-emerald-700" : "text-gray-400")} />
          {current.label}
        </span>
        <ChevronsUpDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>
      {open && cfg && createPortal(
        <div ref={dropdownRef} style={{ ...cfg.style, width: 220, zIndex: 99999 }} className="bg-white border border-gray-200 rounded-xl shadow-2xl p-1.5 flex flex-col gap-0.5">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Filtrer par statut</div>
          {options.map(o => (
            <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }} className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors", value === o.value ? "bg-emerald-50 text-emerald-700 font-semibold" : "hover:bg-gray-50 text-gray-700 font-medium")}>
              <o.icon className={cn("w-4 h-4", o.color || "text-gray-400")} />{o.label}
            </button>
          ))}
        </div>, cfg.target
      )}
    </div>
  )
}

function FournisseurFilter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false); const [cfg, setCfg] = useState<{ target: Element; style: any } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null); const dropdownRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h)
  }, [open])
  
  const openD = () => { if (triggerRef.current) { setSearch(""); setCfg(smartPos(triggerRef.current, 280)); setOpen(true) } }
  
  const filteredOpts = options.filter(o => o.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative">
      <button ref={triggerRef} type="button" onClick={() => open ? setOpen(false) : openD()} className={cn("flex items-center justify-between w-44 h-9 px-3 rounded-xl border text-xs font-medium transition-all outline-none", value !== "ALL" ? "border-emerald-700 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300")}>
        <span className="flex items-center gap-2 truncate">
          <Building2 className={cn("w-3.5 h-3.5 shrink-0", value !== "ALL" ? "text-emerald-700" : "text-gray-400")} />
          <span className="truncate">{value === "ALL" ? "Tous les fournisseurs" : value}</span>
        </span>
        <ChevronsUpDown className="w-3 h-3 opacity-50 shrink-0" />
      </button>
      {open && cfg && createPortal(
        <div ref={dropdownRef} style={{ ...cfg.style, width: 280, zIndex: 99999 }} className="bg-white border border-gray-200 rounded-xl shadow-2xl p-2 flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            <input 
              autoFocus 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Rechercher un fournisseur..." 
              className="w-full h-8 pl-8 pr-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-600 bg-gray-50 focus:bg-white transition-colors" 
            />
          </div>
          <div className="max-h-60 overflow-y-auto flex flex-col gap-0.5">
            <button type="button" onClick={() => { onChange("ALL"); setOpen(false) }} className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors", value === "ALL" ? "bg-emerald-50 text-emerald-700 font-semibold" : "hover:bg-gray-50 text-gray-700 font-medium")}>
              Tous les fournisseurs
            </button>
            {filteredOpts.length === 0 ? (
              <div className="px-2.5 py-4 text-center text-xs text-gray-400">Aucun fournisseur trouvé</div>
            ) : (
              filteredOpts.map(o => (
                <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }} className={cn("flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-left transition-colors", value === o ? "bg-emerald-50 text-emerald-700 font-semibold" : "hover:bg-gray-50 text-gray-700 font-medium")}>
                  <span className="truncate">{o}</span>
                </button>
              ))
            )}
          </div>
        </div>, cfg.target
      )}
    </div>
  )
}

function DateRangePicker({ dateDebut, dateFin, onDebutChange, onFinChange }: { dateDebut: string; dateFin: string; onDebutChange: (v: string) => void; onFinChange: (v: string) => void }) {
  const [open, setOpen] = useState(false); const [cfg, setCfg] = useState<{ target: Element; style: any } | null>(null); const triggerRef = useRef<HTMLButtonElement>(null); const dropdownRef = useRef<HTMLDivElement>(null); const hasFilter = !!(dateDebut || dateFin)
  useEffect(() => { if (!open) return; const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h) }, [open])
  const openD = () => { if (triggerRef.current) { setCfg(smartPos(triggerRef.current, 300)); setOpen(true) } }
  const applyPreset = (p: string) => {
    const now = new Date(); let s = "", e = ""
    switch (p) {
      case "thisWeek": { const dow = now.getDay(); const mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1)); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); s = toYMD(mon); e = toYMD(sun); break }
      case "thisMonth": s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`; e = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0)); break
      case "thisYear": s = `${now.getFullYear()}-01-01`; e = toYMD(now); break
      case "lastYear": s = `${now.getFullYear() - 1}-01-01`; e = `${now.getFullYear() - 1}-12-31`; break
    }
    onDebutChange(s); onFinChange(e)
  }
  const label = useMemo(() => { if (!dateDebut && !dateFin) return "Période"; if (dateDebut && dateFin) return `${dateDebut} → ${dateFin}`; if (dateDebut) return `Depuis ${dateDebut}`; return `Jusqu'au ${dateFin}` }, [dateDebut, dateFin])
  return (
    <div className="relative">
      <button ref={triggerRef} type="button" onClick={() => open ? setOpen(false) : openD()} className={cn("flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-all whitespace-nowrap outline-none", hasFilter ? "border-emerald-700 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300")}>
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" /><span className="max-w-[130px] truncate">{label}</span><ChevronsUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />
      </button>
      {open && cfg && createPortal(
        <div ref={dropdownRef} style={{ ...cfg.style, width: 300, zIndex: 99999 }} className="bg-white border border-gray-200 rounded-xl shadow-2xl p-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Filtrer par période</p>
          <div className="flex flex-wrap gap-1.5">
            {[["Cette semaine", "thisWeek"], ["Ce mois", "thisMonth"], ["Cette année", "thisYear"], ["Année dernière", "lastYear"]].map(([lbl, k]) => <button key={k} type="button" onClick={() => applyPreset(k)} className="px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-[10px] font-medium text-gray-600 hover:bg-emerald-50 hover:border-emerald-700/40 hover:text-emerald-700 transition-colors">{lbl}</button>)}
          </div>
          <div className="space-y-2 border-t border-gray-100 pt-2">
            <div className="space-y-1"><label className="block text-[10px] font-bold text-gray-500">Date début</label><input type="date" value={dateDebut} onChange={e => onDebutChange(e.target.value)} className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-700" /></div>
            <div className="space-y-1"><label className="block text-[10px] font-bold text-gray-500">Date fin</label><input type="date" value={dateFin} min={dateDebut} onChange={e => onFinChange(e.target.value)} className="w-full h-8 px-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-emerald-700" /></div>
          </div>
          {hasFilter && <button type="button" onClick={() => { onDebutChange(""); onFinChange(""); setOpen(false) }} className="w-full flex items-center justify-center gap-1.5 h-7 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors"><X className="w-3 h-3" />Effacer la période</button>}
        </div>, cfg.target
      )}
    </div>
  )
}

function ReliquatsDialog({ reliquats, receptions, commandes, open, onClose, onCreerComplementaire }: {
  reliquats: Reliquat[]
  receptions: Reception[]
  commandes: CommandeSource[]
  open: boolean
  onClose: () => void
  onCreerComplementaire: (rlq: Reliquat) => void
}) {
  const [filtreStatut, setFiltreStatut] = useState<"TOUS" | "EN_ATTENTE" | "PARTIELLEMENT_TRAITE" | "SOLDE">("TOUS")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const rlqFiltres = useMemo(() =>
    filtreStatut === "TOUS" ? reliquats : reliquats.filter(r => r.statut === filtreStatut),
    [reliquats, filtreStatut]
  )

  const ouvertsCount = reliquats.filter(r => r.statut !== "SOLDE").length
  const soldesCount = reliquats.filter(r => r.statut === "SOLDE").length

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Suivi des reliquats</DialogTitle>

        <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                Suivi des reliquats
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Reliquats issus des réceptions partielles — intégralement liés à leurs commandes sources
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-xl border border-amber-200 p-3 text-center">
              <p className="text-xl font-black text-amber-700">{ouvertsCount}</p>
              <p className="text-[10px] font-semibold text-amber-600">En cours</p>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 p-3 text-center">
              <p className="text-xl font-black text-emerald-700">{soldesCount}</p>
              <p className="text-[10px] font-semibold text-emerald-600">Soldés</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
              <p className="text-xl font-black text-gray-700">{reliquats.length}</p>
              <p className="text-[10px] font-semibold text-gray-500">Total</p>
            </div>
          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {(["TOUS", "EN_ATTENTE", "PARTIELLEMENT_TRAITE", "SOLDE"] as const).map(f => (
              <button key={f} onClick={() => setFiltreStatut(f)}
                className={cn("px-3 py-1 rounded-lg text-[10px] font-bold border transition-all",
                  filtreStatut === f
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-700"
                )}>
                {f === "TOUS" ? `Tous (${reliquats.length})` : f === "EN_ATTENTE" ? `En attente (${reliquats.filter(r => r.statut === "EN_ATTENTE").length})` : f === "PARTIELLEMENT_TRAITE" ? `Partiels (${reliquats.filter(r => r.statut === "PARTIELLEMENT_TRAITE").length})` : `Soldés (${soldesCount})`}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {rlqFiltres.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-300" />
              <p className="text-sm font-semibold text-gray-400">Aucun reliquat {filtreStatut !== "TOUS" ? "dans cette catégorie" : ""}</p>
              {filtreStatut === "TOUS" && <p className="text-xs text-gray-300">Toutes les réceptions sont soldées.</p>}
            </div>
          ) : rlqFiltres.map(rlq => {
            const cfg = RLQ_CFG[rlq.statut]
            const cmd = commandes.find(c => c.id === rlq.commandeId)
            const receptionSource = receptions.find(r => r.id === rlq.receptionSourceId)
            const tranchesCompl = receptions.filter(r => r.reliquatSource === rlq.id)
            const totalRestant = rlq.lignes.reduce((s, l) => s + l.quantiteRestante, 0)
            const totalInitial = rlq.lignes.reduce((s, l) => s + l.quantiteInitiale, 0)
            const pctAvancement = totalInitial > 0 ? Math.round((1 - totalRestant / totalInitial) * 100) : 100
            const montantRestant = rlq.lignes.reduce((s, l) => s + l.quantiteRestante * l.prixUnitaireHT * (1 + l.tva / 100), 0)
            const isExpanded = expandedId === rlq.id

            return (
              <div key={rlq.id} className={cn("border rounded-xl overflow-hidden transition-all", rlq.statut === "SOLDE" ? "border-emerald-200 opacity-80" : "border-amber-200")}>
                <div
                  role="button"
                  tabIndex={0}
                  className="w-full text-left outline-none cursor-pointer group"
                  onClick={() => setExpandedId(isExpanded ? null : rlq.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(isExpanded ? null : rlq.id) } }}
                >
                  <div className={cn("flex items-center justify-between px-4 py-3 border-b transition-colors", rlq.statut === "SOLDE" ? "bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70" : "bg-amber-50 border-amber-100 hover:bg-amber-100/70")}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-amber-700">{rlq.id}</span>
                          <Badge className={cn(cfg.bg, cfg.color, "border", cfg.border, "text-[10px]")}>{cfg.label}</Badge>
                          {rlq.statut === "SOLDE" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                          <Building2 className="w-3 h-3" />
                          <span className="font-medium text-gray-700">{rlq.fournisseurNom}</span>
                          <span>·</span>
                          <span className="font-mono">{rlq.commandeReference}</span>
                          <span>·</span>
                          <span>Créé le {fmtDate(rlq.dateCreation)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-800">{pctAvancement}% traité</p>
                        <p className="text-[10px] text-gray-500">{totalRestant} unité(s) restante(s)</p>
                      </div>
                      {rlq.statut !== "SOLDE" && montantRestant > 0 && (
                        <div className="text-right hidden md:block">
                          <p className="text-xs font-bold text-amber-700">{fmt(montantRestant)} MAD</p>
                          <p className="text-[10px] text-gray-400">TTC restant</p>
                        </div>
                      )}
                      {rlq.statut !== "SOLDE" && (
                        <Button
                          size="sm"
                          onClick={() => { onClose(); onCreerComplementaire(rlq) }}
                          className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1 h-8 shadow-sm group-hover:text-white"
                        >
                          <Plus className="w-3 h-3" />Réc. complémentaire
                        </Button>
                      )}
                      <ChevronRight className={cn("w-4 h-4 text-gray-400 transition-transform", isExpanded && "rotate-90")} />
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2 bg-white border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", rlq.statut === "SOLDE" ? "bg-emerald-500" : pctAvancement > 50 ? "bg-blue-500" : "bg-amber-400")}
                        style={{ width: `${pctAvancement}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-10 text-right">{pctAvancement}%</span>
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                    <span>Réception source : <span className="font-mono font-semibold text-gray-600">{rlq.receptionSourceNumero}</span></span>
                    <span>{tranchesCompl.length} tranche(s) complémentaire(s)</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 py-3 bg-white space-y-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Articles du reliquat</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left pb-1.5 text-gray-400 font-medium">Désignation</th>
                            <th className="text-center pb-1.5 text-gray-400 font-medium w-20">Réf.</th>
                            <th className="text-right pb-1.5 text-gray-400 font-medium w-24">Qté initiale</th>
                            <th className="text-right pb-1.5 text-gray-400 font-medium w-24">Qté restante</th>
                            <th className="text-right pb-1.5 text-gray-400 font-medium w-28">P.U. HT</th>
                            <th className="text-right pb-1.5 text-gray-400 font-medium w-28">Montant TTC</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rlq.lignes.map((l, i) => {
                            const pctLigne = l.quantiteInitiale > 0 ? Math.round((1 - l.quantiteRestante / l.quantiteInitiale) * 100) : 100
                            return (
                              <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="py-2 font-medium text-gray-700">{l.produitDesignation}</td>
                                <td className="py-2 text-center font-mono text-gray-500">{l.produitReference}</td>
                                <td className="py-2 text-right text-gray-500">{l.quantiteInitiale}</td>
                                <td className="py-2 text-right">
                                  <span className={cn("font-bold", l.quantiteRestante === 0 ? "text-emerald-600" : "text-amber-700")}>
                                    {l.quantiteRestante}
                                  </span>
                                  <span className="text-gray-400 ml-1 text-[10px]">({pctLigne}% traité)</span>
                                </td>
                                <td className="py-2 text-right font-mono text-gray-600">{fmt(l.prixUnitaireHT)} MAD</td>
                                <td className="py-2 text-right font-mono font-semibold text-amber-700">
                                  {fmt(l.quantiteRestante * l.prixUnitaireHT * (1 + l.tva / 100))} MAD
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {tranchesCompl.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Historique des tranches reçues</p>
                        <div className="space-y-1.5">
                          {tranchesCompl.map(tr => {
                            const StatutIcon = STATUT_CFG[tr.statut].icon
                            return (
                              <div key={tr.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                                <StatutIcon className={cn("w-3.5 h-3.5 flex-shrink-0", STATUT_CFG[tr.statut].color)} />
                                <span className="font-mono text-xs font-bold text-emerald-700">{tr.numero}</span>
                                <span className="text-xs text-gray-500">Tranche {tr.tranche}</span>
                                <span className="text-xs text-gray-400">· {fmtDate(tr.dateReception)}</span>
                                <span className="ml-auto text-xs font-semibold text-gray-700">{fmt(tr.totalTTC)} MAD TTC</span>
                                {tr.confirme
                                  ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[9px]"><CheckCheck className="w-2.5 h-2.5 mr-1" />Confirmée</Badge>
                                  : <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[9px]"><Clock className="w-2.5 h-2.5 mr-1" />En attente</Badge>
                                }
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <Link2 className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500">Réception source :</span>
                      {receptionSource ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-700">{receptionSource.numero}</span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-400">{rlq.receptionSourceNumero}</span>
                      )}
                      {cmd && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] text-gray-500">Commande :</span>
                          <span className="text-[10px] font-mono font-semibold text-blue-700">{cmd.reference}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" className="rounded-xl text-xs" onClick={onClose}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL (PAGE)
// ═══════════════════════════════════════════════════════════════════

export default function ReceptionsPage() {
  const [receptions, setReceptions] = useState<Reception[]>(INIT_RECEPTIONS)
  const [reliquats, setReliquats] = useState<Reliquat[]>(INIT_RELIQUATS)
  const [commandes] = useState<CommandeSource[]>(MOCK_COMMANDES)
  const [toasts, setToasts] = useState<ToastMsg[]>([])
  
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [bonEntreeOpen, setBonEntreeOpen] = useState(false)
  const [reliquatsOpen, setReliquatsOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modeCompl, setModeCompl] = useState<Reliquat | null>(null)
  
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerDocs, setViewerDocs] = useState<DocumentJoint[]>([])
  const [viewerIdx, setViewerIdx] = useState(0)
  const [viewerTitle, setViewerTitle] = useState("")
  const openViewer = useCallback((docs: DocumentJoint[], idx = 0, title = "") => { setViewerDocs(docs); setViewerIdx(idx); setViewerTitle(title); setViewerOpen(true) }, [])
  
  const [selected, setSelected] = useState<Reception | null>(null)
  const [bonEntreeRec, setBonEntreeRec] = useState<Reception | null>(null)
  const [pendingConfirm, setPendingConfirm] = useState<Reception | null>(null)
  const [pmpPreview, setPmpPreview] = useState<{ designation: string; pmpAvant: number; pmpApres: number; variation: number; variationPct: number }[]>([])

  const [search, setSearch] = useState("")
  const [filterStatut, setFilterStatut] = useState("ALL")
  const [filterFourn, setFilterFourn] = useState("ALL")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [kpi, setKpi] = useState<"all" | StatutReception>("all")

  type SK = "date" | "numero" | "fournisseur" | "totalTTC" | "statut"
  const [sortCol, setSortCol] = useState<SK>("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [submitted, setSubmitted] = useState(false)

  const addToast = useCallback((type: ToastMsg["type"], msg: string) => { const id = uid(); setToasts(p => [...p, { id, type, message: msg }]); setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4500) }, [])
  const rmToast = useCallback((id: string) => setToasts(p => p.filter(t => t.id !== id)), [])

  const emptyForm = { commandeId: "", bonLivraison: "", numeroFacture: "", codeMarche: "", dateReception: new Date().toISOString().slice(0, 10), notes: "", lignes: [] as any[], documentsJoints: [] as DocumentJoint[] }
  const [form, setForm] = useState(emptyForm)
  const [cmdSearch, setCmdSearch] = useState("")
  
  const selCmd = useMemo(() => commandes.find(c => c.id === +form.commandeId), [commandes, form.commandeId])
  const isMarchePublic = selCmd?.methode === "Marché Public" || (editMode && selected?.commande?.methode === "Marché Public")
  const isBonCommande = selCmd?.methode === "Bon de Commande" || (editMode && selected?.commande?.methode === "Bon de Commande")

  const commandesDisponibles = useMemo(() => {
    return commandes.filter(cmd => {
      const av = calculerAvancement(cmd, receptions)
      return av.statut === "EN_ATTENTE"
    })
  }, [commandes, receptions])

  const filtCmds = useMemo(() => {
    const q = cmdSearch.toLowerCase().trim()
    if (!q) return commandesDisponibles
    return commandesDisponibles.filter(c =>
      c.reference.toLowerCase().includes(q) ||
      c.fournisseur.nom.toLowerCase().includes(q) ||
      c.fournisseur.ice.toLowerCase().includes(q) ||
      c.codeMarche.toLowerCase().includes(q) ||
      (c.numeroMarche || "").toLowerCase().includes(q)
    )
  }, [cmdSearch, commandesDisponibles])

  const handleSelCmd = useCallback((cmd: CommandeSource) => {
    setForm(f => ({
      ...f,
      commandeId: String(cmd.id),
      codeMarche: cmd.codeMarche,
      lignes: cmd.lignes.map(l => ({
        produitId: l.produit.id,
        produitDesignation: l.produit.designation,
        produitReference: l.produit.reference,
        quantiteCommandee: l.quantite,
        quantiteRecue: l.quantite,
        prixUnitaireHT: l.prixUnitaireHT,
        tva: l.tva,
      }))
    }))
    setCmdSearch(`${cmd.reference} – ${cmd.fournisseur.nom}`)
  }, [])

  const handleSelReliq = useCallback((rlq: Reliquat) => {
    const cmd = commandes.find(c => c.id === rlq.commandeId)
    const lignesRestantes = getLignesReliquat(cmd!, receptions)
    setForm({
      commandeId: String(cmd?.id ?? ""),
      bonLivraison: "",
      numeroFacture: "",
      codeMarche: cmd?.codeMarche ?? "",
      dateReception: new Date().toISOString().slice(0, 10),
      notes: `Tranche complémentaire apurant le reliquat ${rlq.id}`,
      documentsJoints: [],
      lignes: lignesRestantes.map(l => ({
        produitId: l.produitId,
        produitDesignation: l.designation,
        produitReference: l.reference,
        quantiteCommandee: l.restant,
        quantiteRecue: l.restant,
        prixUnitaireHT: l.prixUnitaireHT,
        tva: l.tva,
      }))
    })
    if (cmd) setCmdSearch(`${cmd.reference} – ${cmd.fournisseur.nom}`)
  }, [commandes, receptions])

  const updateLigne = useCallback((i: number, f: string, v: any) => {
    setForm(fm => {
      const ls = [...fm.lignes]
      if (f === "quantiteRecue") {
        const max = ls[i].quantiteCommandee
        ls[i] = { ...ls[i], [f]: Math.min(Math.max(0, Number(v)), max) }
      } else ls[i] = { ...ls[i], [f]: v }
      return { ...fm, lignes: ls }
    })
  }, [])

  const totHT = form.lignes.reduce((s, l) => s + l.quantiteRecue * l.prixUnitaireHT, 0)
  const totTTC = form.lignes.reduce((s, l) => s + l.quantiteRecue * l.prixUnitaireHT * (1 + l.tva / 100), 0)

  const statutCalc = useMemo((): StatutReception | null => {
    if (form.lignes.length === 0) return null
    if (modeCompl) return "COMPLEMENTAIRE"
    const tout = form.lignes.every((l: any) => l.quantiteRecue === l.quantiteCommandee)
    return tout ? "CONFORME" : "PARTIELLE"
  }, [form.lignes, modeCompl])

  const handleBL = (r: string) => setForm(f => ({ ...f, bonLivraison: r }))
  const handleFAC = (r: string) => { let v = r.toUpperCase().replace(/\s/g, ""); if (v && !v.startsWith("FAC-") && /^\d/.test(v)) v = "FAC-" + v; setForm(f => ({ ...f, numeroFacture: v })) }

  const errors = useMemo(() => ({
    commandeId: !form.commandeId,
    bonLivraison: !form.bonLivraison.trim(),
    dateReception: !form.dateReception,
  }), [form])
  const hasErrors = errors.commandeId || errors.bonLivraison || errors.dateReception

  const openEdit = useCallback((r: Reception) => {
    const cmd = commandes.find(c => c.reference === r.commande.reference)
    setForm({
      commandeId: String(cmd?.id ?? ""),
      bonLivraison: r.bonLivraison,
      numeroFacture: r.numeroFacture,
      codeMarche: r.codeMarche,
      dateReception: r.dateReception,
      notes: r.notes,
      documentsJoints: r.documentsJoints ?? [],
      lignes: r.lignes.map(l => ({
        produitId: l.produit.id,
        produitDesignation: l.produit.designation,
        produitReference: l.produit.reference ?? "",
        quantiteCommandee: l.quantiteCommandee,
        quantiteRecue: l.quantiteRecue,
        prixUnitaireHT: l.prixUnitaireHT,
        tva: l.tva,
      }))
    })
    setCmdSearch(cmd ? `${cmd.reference} – ${cmd.fournisseur.nom}` : r.commande.reference)
    setSubmitted(false); setSelected(r); setEditMode(true); setModeCompl(null); setModalOpen(true)
  }, [commandes])

  const openCreate = useCallback(() => {
    setEditMode(false); setModeCompl(null); setForm(emptyForm); setCmdSearch(""); setSubmitted(false); setSelected(null); setModalOpen(true)
  }, [emptyForm])

  const openCreerCompl = useCallback((rlq: Reliquat) => {
    setEditMode(false); setModeCompl(rlq); setSubmitted(false); setSelected(null); handleSelReliq(rlq); setModalOpen(true)
  }, [handleSelReliq])

  const closeModal = useCallback(() => {
    setModalOpen(false); setForm(emptyForm); setCmdSearch(""); setEditMode(false); setModeCompl(null); setSelected(null); setSubmitted(false)
  }, [emptyForm])

  const handleSave = useCallback(() => {
    setSubmitted(true)
    if (hasErrors) { addToast("error", "Champs obligatoires manquants"); return }
    const cmd = commandes.find(c => c.id === +form.commandeId)
    const statut = statutCalc ?? "CONFORME"
    const now = new Date().toISOString()
    const lignes: LigneReception[] = form.lignes.map((l: any) => ({
      produit: { designation: l.produitDesignation, reference: l.produitReference, id: l.produitId },
      quantiteCommandee: l.quantiteCommandee,
      quantiteRecue: l.quantiteRecue,
      prixUnitaireHT: l.prixUnitaireHT,
      tva: l.tva,
      totalHT: l.quantiteRecue * l.prixUnitaireHT,
      totalTTC: l.quantiteRecue * l.prixUnitaireHT * (1 + l.tva / 100),
      pmpAvant: undefined,
      pmpApres: undefined,
    }))

    if (editMode && selected) {
      const upd: Reception = {
        ...selected,
        statut,
        bonLivraison: form.bonLivraison,
        numeroFacture: form.numeroFacture,
        codeMarche: form.codeMarche,
        dateReception: form.dateReception,
        notes: form.notes,
        documentsJoints: form.documentsJoints,
        lignes: lignes.map((l, i) => ({
          ...l,
          pmpAvant: selected.lignes[i]?.pmpAvant,
          pmpApres: selected.lignes[i]?.pmpApres,
          stockAvant: selected.lignes[i]?.stockAvant,
          stockApres: selected.lignes[i]?.stockApres,
        })),
        totalHT: totHT,
        totalTTC: totTTC,
        updatedBy: ME,
        updatedAt: now,
        auditLog: [...selected.auditLog, { action: "Modification", user: ME, date: now, detail: "Informations modifiées" }]
      }
      setReceptions(p => p.map(r => r.id === selected.id ? upd : r))
      addToast("success", `Réception ${selected.numero} modifiée`)
      closeModal()
    } else {
      const numero = genRE(receptions)
      const tranche = modeCompl
        ? Math.max(...receptions.filter(r => r.commandeId === cmd?.id).map(r => r.tranche), 0) + 1
        : 1
      const nouvelle: Reception = {
        id: Date.now(),
        numero,
        tranche,
        statut,
        dateReception: form.dateReception,
        bonLivraison: form.bonLivraison,
        numeroFacture: form.numeroFacture,
        codeMarche: form.codeMarche,
        receptionnaire: "",
        commandeId: cmd?.id ?? 0,
        commande: { reference: cmd?.reference ?? "—", methode: cmd?.methode, fournisseur: { nom: cmd?.fournisseur.nom ?? "—", ice: cmd?.fournisseur.ice } },
        lignes,
        notes: form.notes,
        totalHT: totHT,
        totalTTC: totTTC,
        reliquatLie: undefined,
        reliquatSource: modeCompl?.id,
        documentsJoints: form.documentsJoints,
        createdBy: ME,
        createdAt: now,
        confirme: false,
        bonEntreeGenere: false,
        bonEntreeSignatures: {},
        auditLog: [{ action: "Création", user: ME, date: now, detail: modeCompl ? `Tranche complémentaire depuis ${modeCompl.id}` : `Tranche ${tranche} de ${cmd?.reference}` }]
      }
      setReceptions(p => [nouvelle, ...p])
      closeModal()
      
      const preview = lignes.map(l => {
        const pmpAv = 0 
        const pmpAp = l.prixUnitaireHT
        const variation = pmpAp - pmpAv
        const variationPct = pmpAv > 0 ? (variation / pmpAv) * 100 : 0
        return { designation: l.produit.designation, pmpAvant: pmpAv, pmpApres: pmpAp, variation, variationPct }
      })
      setPmpPreview(preview)
      setPendingConfirm(nouvelle)
      setConfirmOpen(true)
    }
  }, [form, hasErrors, commandes, statutCalc, editMode, selected, receptions, modeCompl, addToast, closeModal, totHT, totTTC])

  const confirmStock = useCallback((r: Reception) => {
    setReceptions(p => p.map(rec => {
      if (rec.id === r.id) {
        const lignesMaj = rec.lignes.map(l => ({
          ...l,
          pmpAvant: l.pmpAvant ?? 0,
          pmpApres: l.pmpApres ?? l.prixUnitaireHT,
        }))
        return { ...rec, confirme: true, confirmeAt: new Date().toISOString(), confirmeBy: ME, lignes: lignesMaj }
      }
      return rec
    }))

    const cmd = commandes.find(c => c.id === r.commandeId)

    if (r.statut === "PARTIELLE") {
      const recsAvecConfirmation = receptions.map(rec => rec.id === r.id ? { ...rec, confirme: true } : rec)
      const lignesManquantes = cmd ? getLignesReliquat(cmd, recsAvecConfirmation) : []
      
      if (lignesManquantes.length > 0) {
        const id = genRLQ(reliquats)
        const nrlq: Reliquat = {
          id,
          commandeId: r.commandeId,
          commandeReference: r.commande.reference,
          fournisseurNom: r.commande.fournisseur.nom,
          lignes: lignesManquantes.map(lr => ({
            produitDesignation: lr.designation,
            produitReference: lr.reference,
            produitId: lr.produitId,
            quantiteInitiale: lr.restant,
            quantiteRestante: lr.restant,
            prixUnitaireHT: lr.prixUnitaireHT,
            tva: lr.tva,
          })),
          dateCreation: new Date().toISOString(),
          receptionSourceId: r.id,
          receptionSourceNumero: r.numero,
          statut: "EN_ATTENTE",
          tranches: [],
        }
        setReliquats(p => [nrlq, ...p])
        setReceptions(p => p.map(rec => rec.id === r.id ? { ...rec, reliquatLie: id } : rec))
        addToast("warning", `Reliquat ${id} créé — ${lignesManquantes.length} article(s) restant(s)`)
      }
    }

    if (r.statut === "COMPLEMENTAIRE" && r.reliquatSource) {
      const recsAvecConfirmation = receptions.map(rec => rec.id === r.id ? { ...rec, confirme: true } : rec)
      const lignesRestantes = cmd ? getLignesReliquat(cmd, recsAvecConfirmation) : []
      const soldee = lignesRestantes.length === 0

      setReliquats(p => p.map(rlq => {
        if (rlq.id !== r.reliquatSource) return rlq
        const nouvellesLignes = rlq.lignes.map(lrlq => {
          const restante = lignesRestantes.find(lr => lr.produitId === lrlq.produitId)
          return { ...lrlq, quantiteRestante: restante ? restante.restant : 0 }
        })
        return {
          ...rlq,
          lignes: nouvellesLignes,
          statut: soldee ? "SOLDE" : "PARTIELLEMENT_TRAITE",
          tranches: [...rlq.tranches, {
            receptionId: r.id,
            receptionNumero: r.numero,
            date: r.dateReception,
            lignes: r.lignes.map(l => ({ produitId: l.produit.id ?? 0, quantiteRecue: l.quantiteRecue })),
          }],
        }
      }))

      if (soldee) {
        addToast("success", `Reliquat ${r.reliquatSource} soldé — commande entièrement réceptionnée !`)
      } else {
        addToast("info", `Reliquat ${r.reliquatSource} mis à jour — ${lignesRestantes.reduce((s, l) => s + l.restant, 0)} unité(s) encore attendue(s)`)
      }
    }

    addToast("success", `Réception ${r.numero} confirmée — stock mis à jour`)
    setConfirmOpen(false)
    setPendingConfirm(null)
    setPmpPreview([])
    
    setTimeout(() => {
      const updatedRec = { ...r, confirme: true, lignes: r.lignes.map(l => ({...l, pmpAvant: l.pmpAvant ?? 0, pmpApres: l.pmpApres ?? l.prixUnitaireHT})) }
      setBonEntreeRec(updatedRec)
      setBonEntreeOpen(true)
    }, 300)
  }, [reliquats, commandes, receptions, addToast])

  const handleOpenBE = useCallback((r: Reception) => {
    if (!r.confirme) { setPendingConfirm(r); setConfirmOpen(true); return }
    setBonEntreeRec(r); setBonEntreeOpen(true)
  }, [])

  const saveSigs = useCallback((r: Reception, sigs: BonEntreeSignatures) => {
    setReceptions(p => p.map(rec => rec.id === r.id ? { ...rec, bonEntreeGenere: true, bonEntreeSignatures: sigs } : rec))
    addToast("success", "Signatures enregistrées")
    setBonEntreeOpen(false)
    setBonEntreeRec(null)
  }, [addToast])

  const fourns = useMemo(() => [...new Set(receptions.map(r => r.commande.fournisseur.nom))].sort(), [receptions])

  const filtered = useMemo(() => {
    let d = receptions.filter(r => {
      const q = search.toLowerCase()
      const ms = r.numero.toLowerCase().includes(q) ||
        r.commande.reference.toLowerCase().includes(q) ||
        r.bonLivraison.toLowerCase().includes(q) ||
        r.numeroFacture.toLowerCase().includes(q) ||
        r.codeMarche.toLowerCase().includes(q) ||
        r.commande.fournisseur.nom.toLowerCase().includes(q)
      return ms &&
        (kpi === "all" || r.statut === kpi) &&
        (filterStatut === "ALL" || r.statut === filterStatut) &&
        (filterFourn === "ALL" || r.commande.fournisseur.nom === filterFourn) &&
        (!dateDebut || r.dateReception >= dateDebut) &&
        (!dateFin || r.dateReception <= dateFin)
    })
    d.sort((a, b) => {
      let av: any, bv: any
      switch (sortCol) {
        case "date": av = a.dateReception; bv = b.dateReception; break
        case "numero": av = a.numero; bv = b.numero; break
        case "fournisseur": av = a.commande.fournisseur.nom; bv = b.commande.fournisseur.nom; break
        case "totalTTC": av = a.totalTTC; bv = b.totalTTC; break
        case "statut": av = a.statut; bv = b.statut; break
        default: av = a.dateReception; bv = b.dateReception
      }
      if (typeof av === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortDir === "asc" ? av - bv : bv - av
    })
    return d
  }, [receptions, search, filterStatut, filterFourn, dateDebut, dateFin, kpi, sortCol, sortDir])

  // --- EXPERT EXPORTS LOGIC ---
  const getFlattenedExportData = useCallback(() => {
    return filtered.flatMap(r => r.lignes.map(l => ({
      "N° Réception": r.numero,
      "N° BL": r.bonLivraison || "—",
      "N° Commande": r.commande.reference,
      "Date": fmtDate(r.dateReception),
      "Fournisseur": r.commande.fournisseur.nom,
      "Statut": STATUT_CFG[r.statut].label,
      "Article (Réf)": l.produit.reference || "—",
      "Désignation": l.produit.designation,
      "Qté Cmdée": l.quantiteCommandee.toString(),
      "Qté Reçue": l.quantiteRecue.toString(),
      "P.U. HT": fmt(l.prixUnitaireHT),
      "Total TTC": fmt(l.totalTTC),
      "PMP Avant": l.pmpAvant !== undefined ? fmt(l.pmpAvant) : "—",
      "PMP Après": l.pmpApres !== undefined ? fmt(l.pmpApres) : "—",
      "Bon d'Entrée": r.bonEntreeGenere ? `Généré` : "Non",
      "Reliquat Lié": r.reliquatLie || r.reliquatSource || "—"
    })))
  }, [filtered])

  const expCSV = useCallback(() => {
    if (filtered.length === 0) { addToast("error", "Aucune donnée à exporter"); return }
    const flatData = getFlattenedExportData()
    if (flatData.length === 0) return
    const headers = Object.keys(flatData[0])
    const rows = flatData.map(row => headers.map(h => `"${String((row as any)[h]).replace(/"/g, '""')}"`).join(";"))
    const csv = [headers.join(";"), ...rows].join("\n")
    const b = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); 
    a.download = `receptions_detail_${new Date().toISOString().slice(0, 10)}.csv`; 
    a.click(); URL.revokeObjectURL(a.href); 
    addToast("success", `Export CSV détaillé généré`)
  }, [filtered, getFlattenedExportData, addToast])

  const expXLS = useCallback(async () => {
    if (filtered.length === 0) { addToast("error", "Aucune donnée à exporter"); return }
    try {
      const X = await import("xlsx")
      const flatData = getFlattenedExportData()
      if (flatData.length === 0) return
      const headers = Object.keys(flatData[0])
      const rows = flatData.map(row => headers.map(h => (row as any)[h]))
      const ws = X.utils.aoa_to_sheet([headers, ...rows])
      const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, "Détail Articles")
      X.writeFile(wb, `receptions_detail_${new Date().toISOString().slice(0, 10)}.xlsx`)
      addToast("success", `Export Excel détaillé généré`)
    } catch { addToast("error", "Erreur export Excel") }
  }, [filtered, getFlattenedExportData, addToast])

  const handleExportPDF = async () => {
    if (filtered.length === 0) { addToast("error", "Aucune donnée à exporter"); return }
    try {
      const { default: jsPDF }    = await import("jspdf")
      const { default: autoTable } = await import("jspdf-autotable")

      const doc       = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin    = 15
      const logoUrl   = "/images/alomrane-logo.png"

      let logoDataUrl = ""
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = logoUrl
        await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej() })
        const canvas = document.createElement("canvas")
        canvas.width = img.width; canvas.height = img.height
        canvas.getContext("2d")?.drawImage(img, 0, 0)
        logoDataUrl = canvas.toDataURL("image/png")
      } catch { /* logo silently skipped */ }

      const addHeaderFooter = (currentPage: number, totalPages: number) => {
        if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", margin, 1, 45, 35)
        doc.setFontSize(18); doc.setTextColor(27, 94, 32); doc.setFont("helvetica", "bold")
        doc.text("AL OMRANE — SOUSS MASSA", logoDataUrl ? margin + 50 : margin, 18)
        doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal")
        doc.text("Détail Analytique des Réceptions par Article", logoDataUrl ? margin + 50 : margin, 25)
        doc.setFontSize(8)
        doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, margin, 32)
        doc.setDrawColor(200, 200, 200); doc.line(margin, 35, pageWidth - margin, 35)
        const footerY = doc.internal.pageSize.getHeight() - 10
        doc.setFontSize(7); doc.setTextColor(150, 150, 150)
        doc.text(`Document confidentiel — Page ${currentPage} / ${totalPages}`, margin, footerY)
        doc.text("Al Omrane — Tous droits réservés", pageWidth - margin - 40, footerY, { align: "right" })
      }

      const flatData = getFlattenedExportData()
      if (flatData.length === 0) return
      
      const headers = ["N° Récep", "N° BL", "Commande", "Fournisseur", "Statut", "Réf Article", "Désignation", "Q.Cmd", "Q.Reçue", "P.U HT", "T. TTC", "PMP Av.", "PMP Ap."]
      const rows = flatData.map(r => [
        r["N° Réception"], r["N° BL"], r["N° Commande"], r["Fournisseur"], r["Statut"], r["Article (Réf)"], 
        r["Désignation"], r["Qté Cmdée"], r["Qté Reçue"], r["P.U. HT"], r["Total TTC"], r["PMP Avant"], r["PMP Après"]
      ])

      autoTable(doc, {
        head: [headers], body: rows, startY: 40,
        margin: { top: 40, left: margin, right: margin, bottom: 20 },
        styles: { fontSize: 6.5, cellPadding: 2, valign: "middle", halign: "left", textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        columnStyles: { 6: { cellWidth: 35 }, 9: { halign: "right" }, 10: { halign: "right", fontStyle: "bold", textColor: [27, 94, 32] }, 11: { halign: "right" }, 12: { halign: "right" } },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: data => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
      })

      doc.save(`receptions_detail_${new Date().toISOString().split("T")[0]}.pdf`)
      addToast("success", "PDF détaillé exporté")
    } catch {
      addToast("error", "Erreur lors de l'export PDF")
    }
  }

  const handleSort = useCallback((col: SK) => { if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortCol(col); setSortDir("asc") } }, [sortCol])
  const SortIcon = ({ col }: { col: SK }) => sortCol !== col ? <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" /> : sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize])
  const resetFilters = useCallback(() => { setSearch(""); setFilterStatut("ALL"); setFilterFourn("ALL"); setDateDebut(""); setDateFin(""); setPage(1); setKpi("all") }, [])
  
  const stats = useMemo(() => ({
    total: receptions.length,
    CONFORME: receptions.filter(r => r.statut === "CONFORME").length,
    PARTIELLE: receptions.filter(r => r.statut === "PARTIELLE").length,
    COMPLEMENTAIRE: receptions.filter(r => r.statut === "COMPLEMENTAIRE").length,
    totalTTC: receptions.reduce((s, r) => s + r.totalTTC, 0),
    montantConforme: receptions.filter(r => r.statut === "CONFORME").reduce((s, r) => s + r.totalTTC, 0),
    montantPartielle: receptions.filter(r => r.statut === "PARTIELLE").reduce((s, r) => s + r.totalTTC, 0),
    reliquatsOuverts: reliquats.filter(r => r.statut !== "SOLDE").length,
  }), [receptions, reliquats])
  
  const filtersActifs = search || filterStatut !== "ALL" || filterFourn !== "ALL" || dateDebut || dateFin || kpi !== "all"

  return (
    <main className="flex-1 space-y-5 p-4 md:p-6 min-h-screen bg-gray-50/30">
      <Toasts toasts={toasts} onRemove={rmToast} />
      <DocViewer docs={viewerDocs} initIdx={viewerIdx} open={viewerOpen} onClose={() => setViewerOpen(false)} title={viewerTitle} />
      
      {bonEntreeOpen && bonEntreeRec && <BonEntreeDialog r={bonEntreeRec} init={bonEntreeRec.bonEntreeSignatures ?? {}} onClose={() => { setBonEntreeOpen(false); setBonEntreeRec(null) }} onSave={s => saveSigs(bonEntreeRec, s)} />}

      <ReliquatsDialog reliquats={reliquats} receptions={receptions} commandes={commandes} open={reliquatsOpen} onClose={() => setReliquatsOpen(false)} onCreerComplementaire={openCreerCompl} />

      <Dialog open={confirmOpen} onOpenChange={o => { if (!o) { setConfirmOpen(false); setPendingConfirm(null); setPmpPreview([]) } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <ArrowUpCircle className="w-5 h-5" />Confirmer la réception
            </DialogTitle>
            <DialogDescription>
              Cette action met à jour le stock et calcule le PMP pondéré. Elle est irréversible.
            </DialogDescription>
          </DialogHeader>
          {pendingConfirm && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-700/30 space-y-2">
                <p className="text-xs font-bold text-emerald-700 uppercase">Récapitulatif</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">N° Réception :</span> <span className="font-mono font-bold text-emerald-700">{pendingConfirm.numero}</span></div>
                  <div><span className="text-gray-400">Fournisseur :</span> <span className="font-medium">{pendingConfirm.commande.fournisseur.nom}</span></div>
                  <div><span className="text-gray-400">Statut :</span> <span className={cn("font-semibold", STATUT_CFG[pendingConfirm.statut].color)}>{STATUT_CFG[pendingConfirm.statut].label}</span></div>
                  <div><span className="text-gray-400">Articles :</span> <span className="font-medium">{pendingConfirm.lignes.length} ligne(s)</span></div>
                  <div><span className="text-gray-400">Total HT :</span> <span className="font-mono font-semibold">{fmt(pendingConfirm.totalHT)} MAD</span></div>
                  <div><span className="text-gray-400">Total TTC :</span> <span className="font-mono font-bold text-emerald-700">{fmt(pendingConfirm.totalTTC)} MAD</span></div>
                </div>
              </div>

              {pendingConfirm.lignes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    Impact sur le stock & PMP
                  </p>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-400 uppercase">Article</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-400 uppercase">Qté reçue</th>
                          <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-400 uppercase">P.U. HT</th>
                          <th className="px-3 py-2 text-right text-[10px] font-bold text-blue-500 uppercase bg-blue-50">PMP avant</th>
                          <th className="px-3 py-2 text-right text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50">PMP après</th>
                          <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-400 uppercase">Variation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pmpPreview.map((l, i) => {
                          const isHausse = l.variation > 0; const isBaisse = l.variation < 0
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-3 py-2 font-medium text-gray-700 truncate max-w-[140px]" title={l.designation}>{l.designation}</td>
                              <td className="px-3 py-2 text-center font-bold text-emerald-700">{pendingConfirm.lignes[i].quantiteRecue}</td>
                              <td className="px-3 py-2 text-right font-mono">{fmt(pendingConfirm.lignes[i].prixUnitaireHT)}</td>
                              <td className="px-3 py-2 text-right font-mono bg-blue-50/50 text-gray-500">
                                {l.pmpAvant > 0 ? fmt(l.pmpAvant) : <span className="text-gray-300 italic">—</span>}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold bg-emerald-50/50 text-emerald-800">
                                {fmt(l.pmpApres)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {l.pmpAvant === 0 ? (
                                  <span className="text-[10px] text-gray-400 italic">1er entrée</span>
                                ) : l.variation === 0 ? (
                                  <span className="text-[10px] text-gray-400">=</span>
                                ) : (
                                  <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-bold", isHausse ? "text-red-600" : "text-emerald-600")}>
                                    {isHausse ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {isHausse ? "+" : ""}{fmt(l.variation)}
                                    <span className="text-[9px] ml-0.5 opacity-70">({l.variationPct > 0 ? "+" : ""}{l.variationPct.toFixed(1)}%)</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => { setConfirmOpen(false); setPendingConfirm(null); setPmpPreview([]) }}>Annuler</Button>
            <Button onClick={() => pendingConfirm && confirmStock(pendingConfirm)} className="bg-emerald-700 hover:bg-emerald-800 rounded-xl text-xs gap-1 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />Confirmer & mettre à jour le stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-emerald-700" />Réceptions marchandises
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            Suivi des tranches de livraison
            {stats.reliquatsOuverts > 0 && (
              <button onClick={() => setReliquatsOpen(true)} className="inline-flex items-center gap-1 text-amber-700 font-semibold hover:text-amber-800 hover:underline transition-colors">
                <AlertTriangle className="w-3.5 h-3.5" />{stats.reliquatsOuverts} reliquat(s) en attente
              </button>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filtersActifs && <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 transition-all"><X className="w-3 h-3" />Réinitialiser</button>}
          
          <Button variant="outline" onClick={() => setReliquatsOpen(true)} className={cn("h-9 rounded-xl border-2 font-bold gap-2 text-xs transition-colors", stats.reliquatsOuverts > 0 ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-900 hover:border-amber-400" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-800")}>
            <Layers className="w-4 h-4" />Reliquats{stats.reliquatsOuverts > 0 && <span className="bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{stats.reliquatsOuverts}</span>}
          </Button>
          <ExportMenu onCSV={expCSV} onExcel={expXLS} onPDF={handleExportPDF} disabled={filtered.length === 0} />
          <Button onClick={openCreate} className="h-9 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 gap-2 shadow-sm"><Plus className="w-4 h-4" />Nouvelle réception</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={BarChart3} label="Toutes" value={stats.total} sub={`${stats.CONFORME} conforme(s)`} colorBg="bg-gray-50" colorText="text-gray-700" isActive={kpi === "all"} onClick={() => { setKpi("all"); setFilterStatut("ALL"); setPage(1) }} />
        <KpiCard icon={CheckCircle2} label="Conformes" value={stats.CONFORME} sub={`${(stats.montantConforme / 1000).toFixed(0)}k MAD`} colorBg="bg-emerald-50" colorText="text-emerald-700" isActive={kpi === "CONFORME"} onClick={() => { setKpi("CONFORME"); setFilterStatut("CONFORME"); setPage(1) }} />
        <KpiCard icon={Minus} label="Partielles" value={stats.PARTIELLE} sub={`${(stats.montantPartielle / 1000).toFixed(0)}k MAD`} colorBg="bg-amber-50" colorText="text-amber-700" isActive={kpi === "PARTIELLE"} onClick={() => { setKpi("PARTIELLE"); setFilterStatut("PARTIELLE"); setPage(1) }} />
        <KpiCard icon={GitMerge} label="Complémentaires" value={stats.COMPLEMENTAIRE} sub="Issues des reliquats" colorBg="bg-blue-50" colorText="text-blue-700" isActive={kpi === "COMPLEMENTAIRE"} onClick={() => { setKpi("COMPLEMENTAIRE"); setFilterStatut("COMPLEMENTAIRE"); setPage(1) }} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px] max-w-[240px]">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input placeholder="N° Réception, BL, facture, code marché…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-full h-9 pl-8 pr-7 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none placeholder-gray-400 focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700/20" />
              {search && <button onClick={() => { setSearch(""); setPage(1) }} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600" aria-label="Effacer"><X className="w-3.5 h-3.5" /></button>}
            </div>
            
            <StatusFilter value={filterStatut} onChange={v => { setFilterStatut(v); setKpi(v === "ALL" ? "all" : v as any); setPage(1) }} />
            <FournisseurFilter value={filterFourn} onChange={v => { setFilterFourn(v); setPage(1) }} options={fourns} />
            <DateRangePicker dateDebut={dateDebut} dateFin={dateFin} onDebutChange={v => { setDateDebut(v); setPage(1) }} onFinChange={v => { setDateFin(v); setPage(1) }} />
            
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-gray-400"><span className="font-semibold text-gray-700">{filtered.length}</span> résultat{filtered.length > 1 ? "s" : ""}{totalPages > 1 && <span> · p.{page}/{totalPages}</span>}</span>
              <div className="h-4 w-px bg-gray-200" />
              <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-[90px] rounded-xl h-8 text-xs bg-gray-50 border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}/page</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="w-full overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {(["N° Réception", "Date", "N° BL", "Facture", "Code Marché", "Commande", "Fournisseur", "Statut", "Total TTC", "Stock", "Docs", "BE", ""] as string[]).map((lbl, i) => (
                  <th key={lbl} className={cn("px-2 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-gray-400",
                    ["w-[9%]", "w-[7%]", "w-[9%]", "w-[9%]", "w-[8%]", "w-[8%]", "w-[12%]", "w-[9%]", "w-[8%]", "w-[4%]", "w-[4%]", "w-[4%]", "w-[9%]"][i],
                    i === 1 || i === 7 || i === 8 ? "cursor-pointer hover:text-gray-600 select-none" : undefined
                  )} onClick={() => { if (i === 1) handleSort("date"); if (i === 7) handleSort("statut"); if (i === 8) handleSort("totalTTC") }}>
                    <span className="inline-flex items-center gap-0.5">{lbl}{(i === 1 || i === 7 || i === 8) && <SortIcon col={i === 1 ? "date" : i === 7 ? "statut" : "totalTTC"} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr><td colSpan={13} className="px-4 py-16 text-center"><Package className="w-10 h-10 text-gray-200 mx-auto" /><p className="text-sm font-semibold text-gray-400 mt-2">Aucune réception</p></td></tr>
              ) : paginated.map(r => {
                const hasDocs = r.documentsJoints && r.documentsJoints.length > 0
                return (
                  <tr key={r.id} className={cn("group transition-colors cursor-pointer hover:bg-emerald-50/30")} onClick={() => { setSelected(r); setDetailOpen(true) }}>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className={cn("text-[11px] font-mono font-bold text-emerald-700")}>{r.numero}</span>
                        </div>
                        {r.statut === "COMPLEMENTAIRE" && r.reliquatSource && (() => {
                          const rlq = reliquats.find(x => x.id === r.reliquatSource)
                          return rlq ? (
                            <span className="text-[9px] text-blue-600 flex items-center gap-0.5" title={`Tranche du reliquat ${rlq.id}`}>
                              <Link2 className="w-2.5 h-2.5" /> de {rlq.receptionSourceNumero}
                            </span>
                          ) : null
                        })()}
                        {r.statut === "PARTIELLE" && r.reliquatLie && (() => {
                          const rlq = reliquats.find(x => x.id === r.reliquatLie)
                          return rlq?.statut === "SOLDE" ? (
                            <span className="text-[9px] text-emerald-600 flex items-center gap-0.5 font-medium" title="Reliquat soldé">
                              <CheckCheck className="w-2.5 h-2.5" /> Complétée
                            </span>
                          ) : (
                            <span className="text-[9px] text-amber-600 flex items-center gap-0.5 font-medium" title="Reliquat en cours">
                              <Clock className="w-2.5 h-2.5" /> En attente
                            </span>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-2 py-2.5"><span className="text-[10px] text-gray-600">{fmtDate(r.dateReception)}</span></td>
                    <td className="px-2 py-2.5 truncate"><span className="text-[10px] font-mono text-gray-600">{r.bonLivraison || "—"}</span></td>
                    <td className="px-2 py-2.5 truncate">{r.numeroFacture ? <span className="text-[10px] font-mono text-gray-600">{r.numeroFacture}</span> : <span className="text-gray-300 text-[10px]">—</span>}</td>
                    <td className="px-2 py-2.5 truncate">{r.codeMarche ? <span className="text-[10px] font-mono text-violet-700 font-semibold">{r.codeMarche}</span> : <span className="text-gray-300 text-[10px]">—</span>}</td>
                    <td className="px-2 py-2.5 truncate"><span className="text-[10px] font-medium text-gray-700">{r.commande.reference}</span></td>
                    <td className="px-2 py-2.5 truncate"><span className="text-[10px] text-gray-700 font-medium">{r.commande.fournisseur.nom}</span></td>
                    <td className="px-2 py-2.5">{getSBadge(r.statut)}</td>
                    <td className="px-2 py-2.5 text-right"><span className="text-[10px] font-mono font-bold text-gray-900">{fmt(r.totalTTC)}</span></td>
                    <td className="px-2 py-2.5 text-center">
                      {r.confirme
                          ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600" title="Stock mis à jour"><CheckCheck className="w-3 h-3" /></span>
                          : <button onClick={e => { e.stopPropagation(); setPendingConfirm(r); setPmpPreview([]); setConfirmOpen(true) }} className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 hover:bg-amber-200 transition-colors" title="Confirmer"><Clock className="w-3 h-3" /></button>
                      }
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      {hasDocs
                        ? <button onClick={e => { e.stopPropagation(); openViewer(r.documentsJoints!, 0, `${r.numero} – pièces jointes`) }} className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full"><Paperclip className="w-2.5 h-2.5" />{r.documentsJoints!.length}</button>
                        : <span className="text-gray-300 text-[10px]">—</span>}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <button onClick={e => { e.stopPropagation(); handleOpenBE(r) }}
                        className={cn("inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors",
                            r.bonEntreeGenere ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-700 hover:text-white" :
                              r.confirme ? "bg-amber-50 text-amber-600 hover:bg-amber-100" :
                                "bg-gray-100 text-gray-300 cursor-not-allowed"
                        )}
                        title={r.confirme ? (r.bonEntreeGenere ? "Voir le bon d'entrée" : "Générer le bon d'entrée") : "Confirmez d'abord"}>
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-2 py-2.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <button onClick={() => { setSelected(r); setDetailOpen(true) }} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors" aria-label="Détails"><Eye className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={() => openEdit(r)}
                          className={cn("w-7 h-7 flex items-center justify-center rounded-full transition-colors text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                          )}
                          aria-label="Modifier"
                          title={r.confirme ? "Modifier les informations administratives" : "Modifier"}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-muted-foreground">Affichage {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} sur {filtered.length}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0 text-xs" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
              <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i; return <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className={cn("rounded-xl h-8 w-8 p-0 text-xs", p === page && "bg-emerald-700 text-white")} onClick={() => setPage(p)}>{p}</Button> })}
              <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0 text-xs" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={o => { if (!o) closeModal() }}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50 rounded-t-xl sticky top-0 z-10">
            <DialogTitle className="text-lg flex items-center gap-2 text-emerald-700">
              {editMode ? <Edit className="w-5 h-5" /> : modeCompl ? <GitMerge className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editMode ? `Modifier – ${selected?.numero}` : modeCompl ? `Tranche complémentaire — ${modeCompl.id}` : "Nouvelle réception"}
            </DialogTitle>
            <DialogDescription>
              {editMode
                ? "Modifiez les informations administratives. Les quantités sont verrouillées après enregistrement."
                : modeCompl
                  ? `Complétez les quantités réellement reçues pour apurer le reliquat ${modeCompl.id}.`
                  : "Étape 1/2 : saisissez les informations. Étape 2 : confirmez la mise à jour du stock."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-5 space-y-6">
            {modeCompl && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <GitMerge className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <div><span className="font-semibold">Tranche complémentaire</span> — Reliquat <span className="font-mono font-bold">{modeCompl.id}</span> issu de <span className="font-mono font-bold">{modeCompl.receptionSourceNumero}</span>. Les quantités affichées sont les quantités restantes réelles.</div>
              </div>
            )}
            {!editMode && !modeCompl && (
              <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-700/30 rounded-xl text-xs text-emerald-700">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div><span className="font-semibold">Flux en 2 étapes :</span> (1) Enregistrez la réception → (2) Confirmez la mise à jour du stock (PMP recalculé). Le bon d'entrée est généré après la confirmation.</div>
              </div>
            )}
            {editMode && selected?.confirme && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div><span className="font-semibold">Quantités verrouillées</span> — Cette réception a été confirmée et a impacté le stock. Seules les informations administratives (BL, facture, date, notes, documents) peuvent être modifiées.</div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2 pb-2 border-b"><FileText className="w-4 h-4 text-emerald-700" />Identification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium">Commande fournisseur (reçue) <span className="text-red-500">*</span></Label>
                  <AcInput value={cmdSearch} onChange={v => { setCmdSearch(v); setForm(f => ({ ...f, commandeId: "" })) }}
                    suggestions={filtCmds} placeholder="Tapez : référence, fournisseur, ICE, code marché..."
                    disabled={editMode || !!modeCompl}
                    className={cn("rounded-xl h-10 text-sm", submitted && errors.commandeId && "border-red-400")}
                    getKey={(c: CommandeSource) => String(c.id)}
                    onSelect={handleSelCmd}
                    renderSuggestion={(c: CommandeSource) => (
                      <div className="px-4 py-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-semibold text-sm text-emerald-700">{c.reference}</div>
                            <div className="text-xs text-gray-700 font-medium">{c.fournisseur.nom}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-400 font-mono">ICE : {c.fournisseur.ice}</span>
                              {c.methode && <Badge className="text-[9px] bg-violet-50 text-violet-700 border-violet-200 border">{c.methode}</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  />
                  {submitted && errors.commandeId && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Veuillez sélectionner une commande</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Building2 className="w-3 h-3" />Fournisseur</Label>
                  <Input value={selCmd?.fournisseur.nom ?? (editMode ? selected?.commande.fournisseur.nom ?? "" : modeCompl?.fournisseurNom ?? "")} disabled className="rounded-xl h-10 text-sm bg-gray-50 text-gray-500" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">ICE Fournisseur</Label>
                  <Input value={selCmd?.fournisseur.ice ?? (editMode ? selected?.commande.fournisseur.ice ?? "" : "")} disabled className="rounded-xl h-10 text-sm bg-gray-50 font-mono text-gray-500" placeholder="—" />
                </div>
                
                {!isBonCommande && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3" />Code Marché
                      {isMarchePublic && (
                        <span title="Verrouillé car issu d'un Marché Public">
                          <Lock className="w-3 h-3 text-gray-400 ml-1" />
                        </span>
                      )}
                    </Label>
                    <Input 
                      value={form.codeMarche} 
                      onChange={e => setForm(f => ({ ...f, codeMarche: e.target.value }))} 
                      disabled={isMarchePublic}
                      placeholder={isMarchePublic ? "Automatique par le marché" : "Ex: MRC-2025-042"} 
                      className="rounded-xl h-10 text-sm font-mono disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed" 
                    />
                    {isMarchePublic && <p className="text-[10px] text-gray-400">Renseigné automatiquement</p>}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Hash className="w-3 h-3" />N° BL <span className="text-red-500">*</span></Label>
                  <Input value={form.bonLivraison} onChange={e => handleBL(e.target.value)} placeholder="Entrez le N° BL" className={cn("rounded-xl h-10 text-sm", submitted && errors.bonLivraison && "border-red-400")} />
                  {submitted && errors.bonLivraison && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Champ obligatoire</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Receipt className="w-3 h-3" />N° Facture <span className="text-xs text-gray-400 font-normal ml-1">(optionnel)</span></Label>
                  <Input value={form.numeroFacture} onChange={e => handleFAC(e.target.value)} placeholder="FAC-2025-789" className="rounded-xl h-10 text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><CalendarDays className="w-3 h-3" />Date de réception <span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.dateReception} onChange={e => setForm(f => ({ ...f, dateReception: e.target.value }))} className={cn("rounded-xl h-10 text-sm", submitted && errors.dateReception && "border-red-400")} />
                </div>
              </div>
            </div>
            {form.lignes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700" />
                    {modeCompl ? "Articles du reliquat" : editMode ? "Articles reçus (quantités verrouillées)" : "Vérification des articles reçus"}
                  </h3>
                  {statutCalc && !editMode && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Statut calculé :</span>
                      <Badge className={cn(STATUT_CFG[statutCalc].bg, STATUT_CFG[statutCalc].color, "border", STATUT_CFG[statutCalc].border, "text-xs")}>{STATUT_CFG[statutCalc].label}</Badge>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 text-xs">
                        <TableHead>Désignation</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead className="text-right">{modeCompl ? "Qté restante" : "Qté cmdée"}</TableHead>
                        <TableHead className="text-right">
                          {editMode ? (
                            <span className="flex items-center justify-end gap-1"><Lock className="w-3 h-3 text-gray-400" />Qté reçue</span>
                          ) : (
                            <>Qté reçue <span className="text-red-500">*</span></>
                          )}
                        </TableHead>
                        <TableHead className="text-right">P.U HT</TableHead>
                        <TableHead className="text-right">TVA</TableHead>
                        <TableHead className="text-right">Total HT</TableHead>
                        <TableHead className="text-right">Total TTC</TableHead>
                        <TableHead className="text-center w-16">Écart</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {form.lignes.map((l: any, i: number) => {
                        const e = l.quantiteRecue - l.quantiteCommandee
                        const lht = l.quantiteRecue * l.prixUnitaireHT
                        const lttc = lht * (1 + l.tva / 100)
                        return (
                          <TableRow key={i} className={e < 0 ? "bg-orange-50/50" : e > 0 ? "bg-blue-50/50" : ""}>
                            <TableCell className="text-sm font-medium max-w-[180px]"><span title={l.produitDesignation} className="block truncate">{l.produitDesignation}</span></TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">{l.produitReference}</TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">{l.quantiteCommandee}</TableCell>
                            <TableCell className="text-right">
                              {editMode ? (
                                <span className="text-sm font-semibold text-gray-700 flex items-center justify-end gap-1">
                                  <Lock className="w-3 h-3 text-gray-300" />
                                  {l.quantiteRecue}
                                </span>
                              ) : (
                                <Input
                                  type="number"
                                  min={0}
                                  max={l.quantiteCommandee}
                                  value={l.quantiteRecue}
                                  onChange={e => updateLigne(i, "quantiteRecue", Number(e.target.value))}
                                  className="w-20 h-8 text-sm text-right rounded-lg ml-auto"
                                />
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(l.prixUnitaireHT)}</TableCell>
                            <TableCell className="text-right text-sm">{l.tva}%</TableCell>
                            <TableCell className="text-right font-mono text-sm">{fmt(lht)}</TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">{fmt(lttc)}</TableCell>
                            <TableCell className="text-center">
                              {e === 0
                                ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                : <Badge className={cn("text-xs border-0", e > 0 ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>{e > 0 ? `+${e}` : e}</Badge>
                              }
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-3 flex justify-end">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 space-y-1 text-sm min-w-[280px]">
                    <div className="flex justify-between gap-8"><span className="text-muted-foreground">Total HT</span><span className="font-mono font-medium">{fmt(totHT)} MAD</span></div>
                    <div className="flex justify-between gap-8"><span className="text-muted-foreground">TVA</span><span className="font-mono font-medium">{fmt(totTTC - totHT)} MAD</span></div>
                    <div className="flex justify-between gap-8 border-t pt-1 mt-1"><span className="font-semibold text-emerald-700">Total TTC</span><span className="font-mono font-bold text-emerald-700">{fmt(totTTC)} MAD</span></div>
                  </div>
                </div>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2 pb-2 border-b">
                <Paperclip className="w-4 h-4 text-emerald-700" />Documents joints
                <span className="text-xs font-normal text-gray-400">(BL, facture, photos...)</span>
                {form.documentsJoints?.length > 0 && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px] ml-auto">{form.documentsJoints.length} fichier(s)</Badge>}
              </h3>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-700 hover:bg-emerald-50/30 transition-all group">
                <div className="flex flex-col items-center gap-1.5"><FileUp className="w-6 h-6 text-gray-300 group-hover:text-emerald-700" /><p className="text-xs text-gray-400 group-hover:text-emerald-700">Glisser-déposer ou <span className="underline">parcourir</span></p><p className="text-[10px] text-gray-300">PDF, JPG, PNG — max 10 Mo</p></div>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { Array.from(e.target.files ?? []).forEach(file => { const url = URL.createObjectURL(file); setForm(f => ({ ...f, documentsJoints: [...(f.documentsJoints ?? []), { nom: file.name, url, type: file.type }] })) }); e.target.value = "" }} />
              </label>
              {form.documentsJoints?.length > 0 && <div className="mt-3 space-y-1.5">{form.documentsJoints.map((doc: DocumentJoint, i: number) => <DocCard key={i} doc={doc} index={i} onRemove={idx => setForm(f => ({ ...f, documentsJoints: f.documentsJoints.filter((_: any, j: number) => j !== idx) }))} onPreview={idx => openViewer(form.documentsJoints, idx, "Aperçu – Documents joints")} />)}</div>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes / Observations</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Ex: colis endommagé, manque étiquette..." className="rounded-xl text-sm resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-gray-50 rounded-b-xl gap-2 sticky bottom-0">
            <Button variant="outline" className="rounded-xl text-xs" onClick={closeModal}><X className="w-3.5 h-3.5 mr-1" />Annuler</Button>
            <Button onClick={handleSave} className="bg-emerald-700 hover:bg-emerald-800 rounded-xl text-xs gap-1 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {editMode ? "Enregistrer les modifications" : modeCompl ? "Enregistrer & confirmer le stock" : "Enregistrer → Étape 2 : Stock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto p-0">
         
          {selected && (() => {
            const cfg = STATUT_CFG[selected.statut]
            const rlq = reliquats.find(r => r.id === selected.reliquatLie)
            return (
              <>
                 <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50 rounded-t-xl sticky top-0 z-10">
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <span className="font-mono font-bold text-emerald-700">{selected.numero}</span>
                    <Badge className={cn(cfg.bg, cfg.color, "border", cfg.border, "text-xs")} title={selected.statut === "CONFORME" ? "100% réceptionné" : ""}>{cfg.label}</Badge>
                    {selected.bonEntreeGenere && <Badge className="bg-emerald-700/10 text-emerald-700 border-emerald-700/20 border text-xs gap-1"><ArrowUpCircle className="w-3 h-3" />BE généré</Badge>}
                    {selected.confirme
                      ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-xs gap-1"><CheckCheck className="w-3 h-3" />Stock confirmé</Badge>
                      : <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-xs gap-1"><Clock className="w-3 h-3" />Stock en attente</Badge>
                    }
                  </DialogTitle>
                  <DialogDescription>
                    Créé le {fmtDate(selected.createdAt)} par {selected.createdBy}
                    {selected.updatedAt && ` · Modifié le ${fmtDate(selected.updatedAt)} par ${selected.updatedBy}`}
                  </DialogDescription>
                </DialogHeader>
                <div className="px-6 py-5 space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                    {([
                      ["N° Réception", selected.numero, ClipboardList],
                      ["N° BL", selected.bonLivraison, Hash],
                      ["Facture", selected.numeroFacture || "—", Receipt],
                      ["Code Marché", selected.codeMarche || "—", FileText],
                      ["Commande", selected.commande.reference, FileText],
                      ["Fournisseur", selected.commande.fournisseur.nom, Building2],
                      ["ICE", selected.commande.fournisseur.ice ?? "—", Shield],
                      ["Date réception", fmtDate(selected.dateReception), CalendarDays],
                      ["Articles", `${selected.lignes.length}`, Package],
                    ] as [string, string, React.ElementType][]).map(([lbl, val, IconComp]) => (
                      <div key={lbl}>
                        <p className="text-muted-foreground flex items-center gap-1 mb-0.5">
                          <IconComp className="w-3 h-3" />{lbl}
                        </p>
                        <p className="font-semibold text-gray-800 font-mono text-xs break-all">{val}</p>
                      </div>
                    ))}
                  </div>

                  {!selected.confirme
                      ? <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><div><p className="text-xs font-semibold text-amber-800">Stock non mis à jour</p><p className="text-[10px] text-amber-600">La mise à jour du stock et le calcul du PMP sont en attente de confirmation.</p></div></div>
                        <Button size="sm" onClick={() => { setDetailOpen(false); setPendingConfirm(selected); setPmpPreview([]); setConfirmOpen(true) }} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs gap-1"><ArrowUpCircle className="w-3.5 h-3.5" />Confirmer stock</Button>
                      </div>
                      : <div className="flex items-center justify-between gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2"><CheckCheck className="w-4 h-4 text-emerald-600" /><div><p className="text-xs font-semibold text-emerald-800">Stock mis à jour — PMP recalculé</p><p className="text-[10px] text-emerald-600">Confirmé le {fmtDate(selected.confirmeAt!)} par {selected.confirmeBy}</p></div></div>
                      </div>
                  }

                  <div className={cn("flex items-center justify-between gap-3 p-3 rounded-xl border", selected.bonEntreeGenere ? "bg-emerald-50 border-emerald-700/30" : "bg-gray-50 border-gray-200")}>
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className={cn("w-4 h-4", selected.bonEntreeGenere ? "text-emerald-700" : "text-gray-400")} />
                      <div><p className="text-xs font-semibold text-gray-800">Bon d'Entrée BE-{selected.numero}</p><p className="text-[10px] text-gray-500">{selected.bonEntreeGenere ? "Généré · Signatures disponibles" : selected.confirme ? "Non généré — cliquez pour générer" : "Disponible après confirmation du stock"}</p></div>
                    </div>
                    <Button size="sm" onClick={() => { setDetailOpen(false); handleOpenBE(selected) }} disabled={!selected.confirme} className={cn("rounded-xl text-xs gap-1", selected.bonEntreeGenere ? "bg-emerald-700 hover:bg-emerald-800 text-white" : selected.confirme ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed")}>
                      <ArrowUpCircle className="w-3.5 h-3.5" />{selected.bonEntreeGenere ? "Voir" : "Générer"}
                    </Button>
                  </div>

                  {rlq && (
                    <div className={cn("p-4 rounded-xl border", rlq.statut === "SOLDE" ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200")}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Layers className={cn("w-5 h-5", rlq.statut === "SOLDE" ? "text-emerald-600" : "text-amber-600")} />
                          <div>
                            <p className={cn("text-sm font-bold", rlq.statut === "SOLDE" ? "text-emerald-800" : "text-amber-800")}>Reliquat généré : {rlq.id}</p>
                            <p className={cn("text-xs", rlq.statut === "SOLDE" ? "text-emerald-600" : "text-amber-600")}>
                              {rlq.lignes.reduce((s, l) => s + l.quantiteRestante, 0)} article(s) restant(s) · Statut : {RLQ_CFG[rlq.statut].label}
                            </p>
                          </div>
                        </div>
                        {rlq.statut !== "SOLDE" ? (
                          <Button size="sm" onClick={() => { setDetailOpen(false); openCreerCompl(rlq) }} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs gap-1 shadow-sm">
                            <Plus className="w-3 h-3" />Réc. complémentaire
                          </Button>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 border text-xs gap-1 py-1">
                            <CheckCheck className="w-3.5 h-3.5" />Réception complétée
                          </Badge>
                        )}
                      </div>
                      
                      {(() => {
                        const tranchesFilles = receptions.filter(x => x.reliquatSource === rlq.id)
                        if (tranchesFilles.length === 0) return null
                        return (
                          <div className="mt-4 pt-4 border-t border-black/5">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">Tranches complémentaires liées à ce reliquat</p>
                            <div className="space-y-2">
                              {tranchesFilles.map(tf => (
                                <div key={tf.id} className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-black/5 text-xs">
                                  <div className="flex items-center gap-2">
                                    <GitMerge className="w-3.5 h-3.5 text-blue-600" />
                                    <span className="font-mono font-bold text-blue-800">{tf.numero}</span>
                                    <span className="text-gray-500">du {fmtDate(tf.dateReception)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-medium">{fmt(tf.totalTTC)} MAD</span>
                                    {tf.confirme 
                                      ? <span title="Confirmée"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></span> 
                                      : <span title="En attente"><Clock className="w-3.5 h-3.5 text-amber-500" /></span>
                                    }
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {selected.reliquatSource && (() => {
                    const rs = reliquats.find(x => x.id === selected.reliquatSource)
                    if (!rs) return null
                    return (
                      <div className="p-3 rounded-xl border bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-3">
                          <Link2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-blue-800">Tranche complémentaire</p>
                            <p className="text-[10px] text-blue-600">
                              Liée au reliquat <span className="font-bold">{rs.id}</span> issu de la réception source <span className="font-mono font-bold">{rs.receptionSourceNumero}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Détail des articles et impact PMP</h3>
                    <div className="rounded-xl border border-gray-200 overflow-hidden overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 text-xs">
                            <TableHead>Désignation</TableHead><TableHead>Réf.</TableHead>
                            <TableHead className="text-right">Cmdée</TableHead><TableHead className="text-right">Reçue</TableHead>
                            <TableHead className="text-right">P.U HT</TableHead><TableHead className="text-right">TVA</TableHead>
                            <TableHead className="text-right">Total HT</TableHead><TableHead className="text-right">Total TTC</TableHead>
                            <TableHead className="text-right bg-blue-50">PMP avant</TableHead><TableHead className="text-right bg-blue-50">PMP après</TableHead>
                            <TableHead className="text-center">Écart</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.lignes.map((l, i) => {
                            const e = l.quantiteRecue - l.quantiteCommandee
                            return (
                              <TableRow key={i} className={e < 0 ? "bg-orange-50/40" : ""}>
                                <TableCell className="text-sm font-medium">{l.produit.designation}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{l.produit.reference ?? "—"}</TableCell>
                                <TableCell className="text-right text-sm">{l.quantiteCommandee}</TableCell>
                                <TableCell className={cn("text-right text-sm font-semibold", e < 0 ? "text-orange-600" : "text-emerald-700")}>{l.quantiteRecue}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{fmt(l.prixUnitaireHT)}</TableCell>
                                <TableCell className="text-right text-sm">{l.tva}%</TableCell>
                                <TableCell className="text-right font-mono text-sm">{fmt(l.totalHT)}</TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold">{fmt(l.totalTTC)}</TableCell>
                                <TableCell className="text-right font-mono text-xs bg-blue-50/50 text-gray-500">{l.pmpAvant !== undefined ? fmt(l.pmpAvant) : "—"}</TableCell>
                                <TableCell className="text-right font-mono text-xs bg-blue-50/70 font-bold text-blue-800">{l.pmpApres !== undefined ? fmt(l.pmpApres) : "—"}</TableCell>
                                <TableCell className="text-center">{e === 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Badge className={cn("text-xs border-0", e > 0 ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>{e > 0 ? `+${e}` : e}</Badge>}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 space-y-1 text-sm min-w-[280px]">
                        <div className="flex justify-between gap-8"><span className="text-muted-foreground">Total HT</span><span className="font-mono font-medium">{fmt(selected.totalHT)} MAD</span></div>
                        <div className="flex justify-between gap-8"><span className="text-muted-foreground">TVA</span><span className="font-mono font-medium">{fmt(selected.totalTTC - selected.totalHT)} MAD</span></div>
                        <div className="flex justify-between gap-8 border-t pt-1 mt-1"><span className="font-semibold text-emerald-700">Total TTC</span><span className="font-mono font-bold text-emerald-700">{fmt(selected.totalTTC)} MAD</span></div>
                      </div>
                    </div>
                  </div>

                  {selected.documentsJoints && selected.documentsJoints.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2"><Paperclip className="w-4 h-4 text-emerald-700" />Pièces jointes <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px]">{selected.documentsJoints.length}</Badge></h3>
                      <div className="space-y-1.5">
                        {selected.documentsJoints.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors">
                            {isImg(doc) ? <img src={doc.url} alt={doc.nom} className="w-10 h-8 object-cover rounded-lg shrink-0 border border-gray-200" />
                              : isPdf(doc) ? <div className="w-10 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-red-400" /></div>
                                : <div className="w-10 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0"><FileIcon className="w-4 h-4 text-blue-400" /></div>}
                            <span className="text-xs text-gray-700 flex-1 truncate font-medium">{doc.nom}</span>
                            <button onClick={() => openViewer(selected.documentsJoints!, i, `${selected.numero} – pièces jointes`)} className="text-[10px] text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"><Eye className="w-3 h-3" />Voir</button>
                            <a href={doc.url} download={doc.nom} className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 ml-2"><Download className="w-3 h-3" />Télécharger</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.notes && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />Remarques</p>
                      <p className="text-sm text-amber-900">{selected.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs">
                    <History className="w-3.5 h-3.5 text-gray-400" />
                    <a href={`/journal?reference=${selected.numero}`} className="text-emerald-700 hover:underline font-medium flex items-center gap-1">
                      Voir le journal complet <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-gray-50 rounded-b-xl gap-2 sticky bottom-0 flex-wrap">
                  <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={() => { setDetailOpen(false); openEdit(selected) }}><Edit className="w-3.5 h-3.5" />Modifier</Button>
                  {!selected.confirme && (
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs gap-1" onClick={() => { setDetailOpen(false); setPendingConfirm(selected); setPmpPreview([]); setConfirmOpen(true) }}>
                      <ArrowUpCircle className="w-3.5 h-3.5" />Confirmer stock
                    </Button>
                  )}
                  <Button size="sm" disabled={!selected.confirme} className={cn("rounded-xl text-xs gap-1", selected.bonEntreeGenere ? "bg-emerald-700 hover:bg-emerald-800 text-white" : selected.confirme ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed")} onClick={() => { setDetailOpen(false); handleOpenBE(selected) }}>
                    <ArrowUpCircle className="w-3.5 h-3.5" />{selected.bonEntreeGenere ? "Bon d'entrée" : "Générer BE"}
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setDetailOpen(false)}>Fermer</Button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </main>
  )
}
