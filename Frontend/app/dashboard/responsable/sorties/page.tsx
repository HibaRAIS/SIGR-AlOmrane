'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Search,
  FileText,
  Clock,
  AlertTriangle,
  Package,
  Filter,
  Printer,
  ArrowRight,
  XCircle,
  Check,
  Trash2,
  Play,
  Info,
  RotateCcw,
  ChevronDown,
  ListFilter,
  X,
  Download,
  Eye,
  Calendar,
  User,
  Building,
  Tag,
  ClipboardList,
  CheckCircle2,
  Box,
  MapPin,
  Save,
  UploadCloud,
  FileCheck
} from "lucide-react"
import SignatureCanvas from "react-signature-canvas"
import { useReactToPrint } from "react-to-print"
import { cn } from "@/lib/utils"
import { sortieService } from '@/services/sortie.service'
import type {
  DemandeResponse,
  DemandeResponseResponsable,
  DemandeDetailResponse,
  BonSortieDetailResponse,
  LigneSortieDetail,
  LigneDetailResponse,
  SignatureResponse,
  ArticleStock,
  SignatureRequest,
  LivraisonRequest,
  PreparationRequest,
} from '@/types/sortie'

// ─── Types locaux pour l'interface ─────────────────────────────────────────
type Priorite = 'NORMAL' | 'URGENT' | 'CRITIQUE'
type StatutDemande = 'VALIDEE' | 'REFUSEE' | 'EN_PREPARATION' | 'LIVREE'

interface Produit {
  codeArticle: string;
  designation: string;
}

interface LigneDemande {
  produitReference: string;
  produitDesignation: string;
  quantite: number;
  quantiteAccordee: number;
}

interface LignePreparation extends LigneDemande {
  quantiteServie: number;
  observation: string;
}

interface ValideurInfo {
  nom: string;
  date: string;
}

interface SignatureData {
  img?: string;
  dateStr?: string;
}

interface DemandeData {
  id: number;
  reference: string;
  employeNom: string;
  matriculeDemandeur: string;
  structureNom: string;
  urgence: Priorite;
  dateCreation: string;
  dateRefus?: string;
  dateLivraison?: string;
  statut: StatutDemande;
  commentaire: string;
  noteMagasinier?: string;
  lignes: LigneDemande[];
  valideurs?: {
    chefHierarchique?: ValideurInfo;
    chefDept?: ValideurInfo;
    directeur?: ValideurInfo;
  };
  lignesPreparees?: LignePreparation[];
  observationsPreparation?: string;
  fichierAccuseImporte?: string;
  signatures?: Record<string, SignatureData>;
}

interface AccuseReception {
  numero: string;
  demande: DemandeData;
  dateEdition: Date;
  lignes: LignePreparation[];
  signatures: Record<string, SignatureData>;
}

// ─── Constantes de style ────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<Priorite, string> = {
  NORMAL: "bg-gray-100 text-gray-700 border-gray-200",
  URGENT: "bg-amber-50 text-amber-700 border-amber-200",
  CRITIQUE: "bg-red-50 text-red-700 border-red-200",
}

const STATUS_LABELS: Record<StatutDemande, string> = {
  VALIDEE: "Validée",
  REFUSEE: "Refusée",
  EN_PREPARATION: "En préparation",
  LIVREE: "Livrée",
}

const STATUS_STYLES: Record<StatutDemande, string> = {
  VALIDEE: "bg-green-50 text-green-700 border-green-200",
  REFUSEE: "bg-red-50 text-red-700 border-red-200",
  EN_PREPARATION: "bg-purple-50 text-purple-700 border-purple-200",
  LIVREE: "bg-teal-50 text-teal-700 border-teal-200",
}

// ─── Composants de Base ─────────────────────────────────────────────────────

function SignaturePad({ label, value, onChange }: { label: string; value?: SignatureData; onChange: (data: SignatureData | undefined) => void; }) {
  const ref = useRef<SignatureCanvas | null>(null);
  const [signed, setSigned] = useState(!!value?.img);

  const clear = () => {
    ref.current?.clear();
    setSigned(false);
    onChange(undefined);
  };
  const save = () => {
    if (!ref.current || ref.current.isEmpty()) return;
    const url = ref.current.toDataURL("image/png");
    setSigned(true);
    onChange({ img: url, dateStr: new Date().toISOString() });
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600 truncate" title={label}>{label}</div>
        {value?.dateStr && <div className="text-[8px] text-gray-400">Signé le {new Date(value.dateStr).toLocaleDateString('fr-FR')}</div>}
      </div>
      {value?.img ? (
        <div className="rounded-lg border-2 border-[#1D6F42] bg-[#F1F8E9] p-2 relative">
          <img src={value.img} alt={label} className="h-24 w-full object-contain" />
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <SignatureCanvas
            ref={ref}
            penColor="#0d3b66"
            canvasProps={{ className: "w-full h-28 rounded-lg" }}
          />
        </div>
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={clear} className="h-7 gap-1 text-xs">
          <Eraser className="h-3 w-3" /> Effacer
        </Button>
        {!signed && (
          <Button type="button" size="sm" onClick={save} className="h-7 gap-1 bg-[#1D6F42] text-xs text-white hover:bg-[#1B5E20]">
            <Check className="h-3 w-3" /> Valider
          </Button>
        )}
      </div>
    </div>
  );
}

const Eraser = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <path d="M22 21H7" />
    <path d="m5 11 9 9" />
  </svg>
);

// ─── Accusé de Réception A4 (Document ERP Expert Sans Prix) ─────────────────

const formatNumber = (n: number) => new Intl.NumberFormat("fr-MA").format(n)
const formatDateTime = (d: Date | string) => new Date(d).toLocaleDateString("fr-MA", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })

function SignatureBox({ label, signature }: { label: string; signature?: SignatureData }) {
  return (
    <div className="flex flex-col flex-1 border border-[#1D6F42] rounded-lg bg-[#ffffff] overflow-hidden shadow-sm page-break-inside-avoid">
      <div className="bg-[#E8F5E9] border-b border-[#1D6F42] px-2 py-1.5 text-[9px] font-extrabold text-center min-h-[36px] flex items-center justify-center leading-tight text-[#0d3b66] uppercase tracking-wide">
        {label}
      </div>
      <div className="h-[65px] flex items-center justify-center p-1 bg-[#ffffff] relative">
        {signature?.img ? (
          <img src={signature.img} alt={label} className="h-full object-contain max-w-full" />
        ) : (
          <span className="text-[10px] text-[#9ca3af] italic"></span>
        )}
      </div>
      <div className="border-t border-[#1D6F42] px-2 py-1 text-[9px] font-semibold bg-[#f9fafb] text-[#6b7280] flex justify-between items-center">
        <span>Date de signature :</span>
        <span className="font-mono text-[#0d3b66]">{signature?.dateStr ? new Date(signature.dateStr).toLocaleDateString('fr-MA') : ".../.../20..."}</span>
      </div>
    </div>
  )
}

function ValidationText({ label, nom, dateText }: { label: string, nom?: string, dateText?: string }) {
  return (
    <div className="flex flex-col flex-1 border border-[#0d3b66] rounded-lg bg-[#ffffff] overflow-hidden shadow-sm page-break-inside-avoid">
      <div className="bg-[#eff6ff] border-b border-[#0d3b66] px-2 py-1.5 text-[9px] font-extrabold text-center min-h-[36px] flex items-center justify-center leading-tight text-[#0d3b66] uppercase tracking-wide">
        {label}
      </div>
      <div className="h-[83px] flex flex-col items-center justify-center p-2 bg-[#ffffff] text-center">
        {nom ? (
          <>
            <span className="text-[11px] font-black text-[#1D6F42] uppercase tracking-wide">Validé par</span>
            <span className="text-[12px] font-bold text-[#0d3b66] mt-1">{nom}</span>
            <span className="text-[9px] font-medium text-[#6b7280] mt-2">le {new Date(dateText!).toLocaleDateString('fr-MA')}</span>
          </>
        ) : (
          <span className="text-[10px] text-[#9ca3af] italic">En attente</span>
        )}
      </div>
    </div>
  )
}

function AccuseReceptionA4({ accuse }: { accuse: AccuseReception }) {
  const { demande, lignes, signatures } = accuse;
  const totalDemandee = lignes.reduce((s, l) => s + l.quantite, 0);
  const totalAccordee = lignes.reduce((s, l) => s + l.quantiteAccordee, 0);
  const totalServie = lignes.reduce((s, l) => s + l.quantiteServie, 0);

  return (
    <div 
      className="mx-auto box-border relative print:m-0 print:p-0 flex flex-col"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '12mm 15mm',
        backgroundColor: '#ffffff',
        color: '#111827'
      }}
    >
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0 !important; padding: 0 !important; background-color: #ffffff; }
          .page-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      {/* En-tête ERP */}
      <div className="flex items-start justify-between border-b-[3px] border-[#1D6F42] pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-[#1D6F42] bg-[#E8F5E9] p-1.5 relative">
            <img src="/images/alomrane-logo.png" alt="Al Omrane" className="h-full w-full object-contain relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
            <span className="text-xs font-bold absolute text-[#9ca3af] z-0">LOGO</span>
          </div>
          <div>
            <div className="text-2xl font-black text-[#0d3b66] tracking-tight">GROUPE AL OMRANE</div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#6b7280] mt-1">
              Système Intégré de Gestion des Ressources
            </div>
            <div className="mt-2 inline-block bg-[#1D6F42] text-[#ffffff] rounded-md px-3 py-1 shadow-sm">
              <span className="text-sm font-bold tracking-wide">ACCUSÉ DE RÉCEPTION MAGASIN</span>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col gap-2">
          <div className="border border-[#1D6F42] rounded-lg p-2 text-center w-48 bg-[#E8F5E9]">
            <div className="text-[10px] font-bold uppercase text-[#1D6F42] border-b border-[#1D6F42] pb-1 mb-1">
              N° Document
            </div>
            <div className="text-sm font-black font-mono text-[#0d3b66]">{accuse.numero}</div>
          </div>
          <div className="border border-[#d1d5db] rounded-lg p-2 text-center w-48 bg-[#f9fafb]">
             <div className="text-[9px] font-bold uppercase text-[#6b7280] border-b border-[#e5e7eb] pb-1 mb-1">Date d'édition</div>
             <div className="text-xs font-bold text-[#1f2937]">{formatDateTime(accuse.dateEdition)}</div>
          </div>
        </div>
      </div>

      {/* Informations de Référence */}
      <div className="mt-4 grid grid-cols-3 gap-0 border border-[#1D6F42] rounded-lg overflow-hidden text-[10px] shadow-sm bg-[#f9fafb]">
        <div className="border-r border-[#1D6F42] p-2">
          <div className="font-bold text-[#6b7280] uppercase mb-0.5">Réf. Demande</div>
          <div className="font-black text-[#0d3b66] text-[11px]">{demande.reference}</div>
        </div>
        <div className="border-r border-[#1D6F42] p-2">
          <div className="font-bold text-[#6b7280] uppercase mb-0.5">Demandeur</div>
          <div className="font-bold text-[#0d3b66]">{demande.employeNom} <span className="text-[#9ca3af] font-mono">({demande.matriculeDemandeur})</span></div>
        </div>
        <div className="p-2">
          <div className="font-bold text-[#6b7280] uppercase mb-0.5">Département</div>
          <div className="font-bold text-[#0d3b66]">{demande.structureNom}</div>
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="mt-5 mb-6">
        <table className="w-full border-collapse text-[11px] table-fixed">
          <thead>
            <tr className="bg-[#0d3b66] text-[#ffffff]">
              <th className="border border-[#0d3b66] px-2 py-2 text-center w-8 uppercase font-semibold rounded-tl-lg">N°</th>
              <th className="border border-[#0d3b66] px-2 py-2 text-center w-20 uppercase font-semibold">Code</th>
              <th className="border border-[#0d3b66] px-2 py-2 text-left uppercase font-semibold">Désignation</th>
              <th className="border border-[#0d3b66] px-2 py-2 text-center w-12 uppercase font-semibold">Dmd</th>
              <th className="border border-[#0d3b66] px-2 py-2 text-center w-12 uppercase font-semibold">Acc</th>
              <th className="border border-[#0d3b66] px-2 py-2 text-center w-12 uppercase font-semibold text-[#6ee7b7]">Srv</th>
              <th className="border border-[#0d3b66] px-2 py-2 text-left w-52 uppercase font-semibold rounded-tr-lg">Observation (État/Lot)</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#ffffff]" : "bg-[#f8fafc]"}>
                <td className="border border-[#d1d5db] px-2 py-2 text-center text-[#6b7280] font-medium align-top">{i + 1}</td>
                <td className="border border-[#d1d5db] px-2 py-2 font-mono text-center text-[#0d3b66] font-semibold align-top">{l.produitReference}</td>
                <td className="border border-[#d1d5db] px-2 py-2 font-medium text-[#1f2937] align-top break-words whitespace-pre-wrap">
                  {l.produitDesignation}
                </td>
                <td className="border border-[#d1d5db] px-2 py-2 text-center font-bold text-[#6b7280] align-top">{formatNumber(l.quantite)}</td>
                <td className="border border-[#d1d5db] px-2 py-2 text-center font-bold text-[#0d3b66] align-top">{formatNumber(l.quantiteAccordee)}</td>
                <td className="border border-[#1D6F42] bg-[#E8F5E9] px-2 py-2 text-center font-black text-[#1D6F42] align-top">{formatNumber(l.quantiteServie)}</td>
                <td className="border border-[#d1d5db] px-2 py-2 text-left text-[#4b5563] italic text-[10px] align-top break-words whitespace-pre-wrap">
                  {l.observation || "—"}
                </td>
              </tr>
            ))}
            {Array.from({ length: Math.max(0, 10 - lignes.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-[#d1d5db] px-2 py-3.5"></td>
                <td className="border border-[#d1d5db] px-2 py-3.5"></td>
                <td className="border border-[#d1d5db] px-2 py-3.5"></td>
                <td className="border border-[#d1d5db] px-2 py-3.5"></td>
                <td className="border border-[#d1d5db] px-2 py-3.5"></td>
                <td className="border border-[#d1d5db] px-2 py-3.5 bg-[#f3f4f6]"></td>
                <td className="border border-[#d1d5db] px-2 py-3.5"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#E8F5E9] font-bold text-[12px]">
              <td colSpan={3} className="border border-[#1D6F42] px-3 py-2 text-right uppercase text-[#0d3b66] tracking-widest rounded-bl-lg">Total Général</td>
              <td className="border border-[#1D6F42] px-2 py-2 text-center text-[#6b7280]">{formatNumber(totalDemandee)}</td>
              <td className="border border-[#1D6F42] px-2 py-2 text-center text-[#0d3b66]">{formatNumber(totalAccordee)}</td>
              <td className="border border-[#1D6F42] px-2 py-2 text-center text-[#1D6F42]">{formatNumber(totalServie)}</td>
              <td className="border border-[#1D6F42] px-2 py-2 bg-[#ffffff] rounded-br-lg"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex-1"></div>

      {/* Zone unique des signatures (3 par ligne) */}
      <div className="w-full page-break-inside-avoid mt-auto">
        <div className="grid grid-cols-3 gap-4">
          <ValidationText label="Chef Hiérarchique" nom={demande.valideurs?.chefHierarchique?.nom} dateText={demande.valideurs?.chefHierarchique?.date} />
          <SignatureBox label="Magasinier" signature={signatures.magasinier} />
          <SignatureBox label="Demandeur" signature={signatures.demandeur} />
          <SignatureBox label="Réceptionnaire Final" signature={signatures.receptionnaire} />
          <SignatureBox label="Chef Département Logistique & MG" signature={signatures.chef_dept} />
          <SignatureBox label="Directeur Orga & Capital Humain" signature={signatures.directeur} />
        </div>
      </div>

      <div className="border-t-[3px] border-[#1D6F42] pt-2 mt-4 flex justify-between items-center text-[9px] text-[#6b7280] font-semibold tracking-wide page-break-inside-avoid">
        <div>Document généré par SIGR — Groupe Al Omrane</div>
        <div>Page 1/1</div>
      </div>
    </div>
  )
}

// ─── Composants UI Génériques ───────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, colorClass, isActive, onClick }: { icon: React.ElementType; label: string; value: number; colorClass: string; isActive: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("group bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 text-left w-full", isActive ? "border-[#1D6F42] ring-2 ring-[#1D6F42]/30 shadow-md" : "border-gray-100 hover:border-gray-200")}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
        {isActive && <div className="w-5 h-5 rounded-full bg-[#1D6F42] flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
    </button>
  )
}

function FilterBadge({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase whitespace-nowrap transition-all duration-200", isActive ? "border-[#1D6F42] bg-[#1D6F42] text-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300")}>
      {label}
    </button>
  )
}

function TableEmptyState({ loading, colSpan }: { loading: boolean; colSpan: number }) {
  return (
    <tr><td colSpan={colSpan} className="px-4 py-16 text-center">
      {loading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1D6F42] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Chargement...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Package className="w-8 h-8 text-gray-300" />
          <span className="text-sm text-gray-400">Aucune demande trouvée.</span>
        </div>
      )}
    </td></tr>
  )
}

function DemandeRow({ demande, onRefuser, onPreparer, onReprendre, onViewDetails, onLivrer, onViewAccuse, onImportScan }: { demande: DemandeData; onRefuser: (id: number) => void; onPreparer: (d: DemandeData) => void; onReprendre: (d: DemandeData) => void; onViewDetails: (d: DemandeData) => void; onLivrer: (d: DemandeData) => void; onViewAccuse: (d: DemandeData) => void; onImportScan: (d: DemandeData) => void; }) {
  const nbArticles = demande.lignes.reduce((sum, l) => sum + l.quantite, 0)
  
  const showRefuser = demande.statut === 'VALIDEE'
  const showPreparer = demande.statut === 'VALIDEE'
  const showReprendre = demande.statut === 'EN_PREPARATION'
  const showLivrer = demande.statut === 'EN_PREPARATION'
  const showLivreActions = demande.statut === 'LIVREE'

  return (
    <tr className="transition-colors hover:bg-[#F1F8E9]/40 group">
      <td className="px-4 py-3 font-mono text-[12px] font-semibold text-[#0d3b66]">{demande.reference}</td>
      <td className="px-4 py-3 font-semibold text-gray-900">{demande.employeNom}</td>
      <td className="px-4 py-3 text-gray-600">{demande.structureNom}</td>
      <td className="px-4 py-3 text-gray-600">{new Date(demande.dateCreation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</td>
      <td className="px-4 py-3 text-center"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", PRIORITY_STYLES[demande.urgence])}>{demande.urgence}</span></td>
      <td className="px-4 py-3 text-center"><span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_STYLES[demande.statut])}>{STATUS_LABELS[demande.statut]}</span></td>
      <td className="px-4 py-3 text-right font-semibold">{nbArticles}</td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity duration-200">
          
          <Button size="sm" variant="ghost" onClick={() => onViewDetails(demande)} className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full" title="Voir les détails">
            <Eye className="h-4 w-4" />
          </Button>

          {showRefuser && (
            <Button size="sm" variant="ghost" onClick={() => onRefuser(demande.id)} className="h-8 gap-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl px-2">
              <XCircle className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Refuser</span>
            </Button>
          )}
          
          {showPreparer && (
            <Button size="sm" onClick={() => onPreparer(demande)} className="h-8 gap-1 bg-[#1D6F42] text-white hover:bg-[#155430] rounded-xl shadow-sm transition-all px-3 ml-1">
              Préparer <ArrowRight className="h-3 w-3" />
            </Button>
          )}

          {showReprendre && (
            <Button size="sm" variant="ghost" onClick={() => onReprendre(demande)} className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-50 hover:text-amber-700 rounded-full border border-amber-200" title="Modifier la préparation">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          
          {showLivrer && (
            <Button size="sm" onClick={() => onLivrer(demande)} className="h-8 gap-1 bg-blue-600 text-white hover:bg-blue-700 rounded-xl px-3 ml-1 shadow-sm transition-all">
              <FileText className="h-3.5 w-3.5" /> Accusé / Livrer
            </Button>
          )}

          {showLivreActions && (
            <>
              <Button size="sm" variant="ghost" onClick={() => onViewAccuse(demande)} className="h-8 w-8 p-0 text-green-700 hover:bg-green-50 rounded-full" title="Voir Accusé de réception">
                <FileCheck className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onImportScan(demande)} className="h-8 w-8 p-0 text-gray-500 hover:bg-gray-100 rounded-full" title="Importer scan manuel">
                <UploadCloud className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Composants Modals ──────────────────────────────────────────────────────

function DetailDemandeDialog({ demandeId, stocks, onClose, onLancer }: { demandeId: number | null; stocks: Record<string, number>; onClose: () => void; onLancer: () => void }) {
  const [demande, setDemande] = useState<DemandeDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (demandeId) {
      setLoading(true);
      sortieService.getDemandeDetail(demandeId)
        .then(data => setDemande(data))
        .catch(() => toast.error("Impossible de charger le détail de la demande."))
        .finally(() => setLoading(false));
    }
  }, [demandeId]);

  if (!demandeId) return null;
  if (loading || !demande) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-6xl rounded-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl">
          <DialogTitle className="sr-only">Chargement...</DialogTitle>
          <div className="flex items-center justify-center p-16"><div className="w-8 h-8 border-2 border-[#1D6F42] border-t-transparent rounded-full animate-spin" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  const isValidee = demande.statut === 'VALIDEE';
  const showObservations = demande.statut === 'LIVREE' || demande.statut === 'EN_PREPARATION';
  let totalEstime = 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-6xl rounded-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-0 shadow-2xl">
        <DialogTitle className="sr-only">Détails de la demande</DialogTitle>
        <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 text-gray-900 text-xl font-bold">
              <div className="bg-[#E8F5E9] p-2 rounded-xl border border-[#1D6F42]/20 text-[#1D6F42]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span>Demande</span>
                <span className="font-mono text-[#0d3b66] ml-2 text-lg">{demande.numeroDemande}</span>
              </div>
            </div>
            <DialogDescription className="mt-1 text-gray-500 ml-12">
              Informations détaillées, état des stocks et traçabilité.
            </DialogDescription>
          </div>
          <Badge className={cn("px-3 py-1 text-xs uppercase tracking-widest shadow-sm rounded-lg", STATUS_STYLES[demande.statut as StatutDemande])}>
            {STATUS_LABELS[demande.statut as StatutDemande]}
          </Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><User className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Demandeur</p>
                <p className="text-sm font-bold text-gray-900">{demande.employeNom}</p>
                <p className="text-xs text-gray-500">{/* Matricule non présent, à adapter */}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Building className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Département</p>
                <p className="text-sm font-bold text-gray-900">{demande.structureNom}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
              <div className="bg-orange-50 p-2 rounded-lg text-orange-600"><Calendar className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Date de soumission</p>
                <p className="text-sm font-bold text-gray-900">{new Date(demande.dateDemande).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            {demande.statut === 'LIVREE' ? (
              <div className="bg-white p-4 rounded-2xl border border-green-200 shadow-sm flex items-start gap-3">
                <div className="bg-green-50 p-2 rounded-lg text-green-600"><CheckCircle2 className="w-4 h-4" /></div>
                <div><p className="text-[10px] uppercase font-bold text-green-600 mb-0.5">Date Livraison</p>
                <p className="text-sm font-bold text-gray-900">{demande.dateValidation ? new Date(demande.dateValidation).toLocaleString('fr-FR') : '—'}</p></div>
              </div>
            ) : demande.statut === 'REFUSEE' ? (
              <div className="bg-white p-4 rounded-2xl border border-red-200 shadow-sm flex items-start gap-3">
                <div className="bg-red-50 p-2 rounded-lg text-red-600"><XCircle className="w-4 h-4" /></div>
                <div><p className="text-[10px] uppercase font-bold text-red-600 mb-0.5">Date Refus</p>
                <p className="text-sm font-bold text-gray-900">{demande.dateValidation ? new Date(demande.dateValidation).toLocaleString('fr-FR') : '—'}</p></div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
                <div className="bg-red-50 p-2 rounded-lg text-red-600"><Tag className="w-4 h-4" /></div>
                <div><p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Priorité</p>
                <p className={cn("text-sm font-bold capitalize", PRIORITY_STYLES[demande.priorite as Priorite]?.split(' ')[1])}>{demande.priorite}</p></div>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600"/> Circuit d'approbation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demande.validations?.map((v, i) => (
                <div key={i} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{v.etape}</span>
                  {v.valideParNom ? (
                    <>
                      <span className="text-sm font-bold text-[#0d3b66] mt-1">{v.valideParNom}</span>
                      <span className="text-[10px] text-green-600 font-medium mt-1">Validé le {new Date(v.dateValidation!).toLocaleDateString('fr-FR')}</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic mt-1">En attente</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {demande.statut === 'REFUSEE' && demande.motifRefus && (
              <div className="border rounded-2xl p-4 flex gap-3 text-sm shadow-sm bg-red-50 border-red-200 text-red-900 col-span-1 md:col-span-2">
                <Info className="w-5 h-5 flex-shrink-0 text-red-600" />
                <div>
                  <span className="font-bold block mb-1 text-red-800">Motif de refus :</span> 
                  <p className="break-all whitespace-pre-wrap">{demande.motifRefus}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3 col-span-1 md:col-span-2">
              <div className="bg-[#F1F8E9] border border-[#1D6F42]/30 rounded-2xl p-4 flex gap-3 text-[#1D6F42] text-sm shadow-sm">
                <ClipboardList className="w-5 h-5 text-[#1D6F42] flex-shrink-0" />
                <div>
                  <span className="font-bold text-[#0d3b66] block mb-1">Note pour le responsable :</span> 
                  {demande.annotation ? <p className="break-all whitespace-pre-wrap">{demande.annotation}</p> : <span className="italic text-gray-500">Aucune note.</span>}
                </div>
              </div>
              {showObservations && demande.observationsPreparation && (
                <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 flex gap-3 text-gray-700 text-sm shadow-sm">
                  <Box className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-gray-800 block mb-1">Observations globales de préparation :</span> 
                    <p className="break-all whitespace-pre-wrap">{demande.observationsPreparation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Désignation</th>
                  <th className="px-4 py-3 text-center">Stock Dispo</th>
                  <th className="px-4 py-3 text-center">PMP (MAD)</th>
                  <th className="px-4 py-3 text-center">Qté Dmd</th>
                  <th className="px-4 py-3 text-center text-blue-600">Qté Acc</th>
                  {showObservations && <th className="px-4 py-3 text-center text-[#1D6F42]">Qté Srv</th>}
                  <th className="px-4 py-3 text-right">Valeur Est. (MAD)</th>
                  {showObservations && <th className="px-4 py-3 text-left max-w-[150px]">Observations</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {demande.lignes.map((l) => {
                  const stock = stocks[l.produitReference] ?? 0;
                  const qteUsed = showObservations ? (l.quantiteServie ?? l.quantiteAccordee) : l.quantiteAccordee;
                  const valeurLigne = qteUsed * l.pmp;
                  totalEstime += valeurLigne;
                  return (
                    <tr key={l.ligneId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.produitReference}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 break-words whitespace-normal">{l.produitDesignation}</td>
                      <td className={cn("px-4 py-3 text-center font-bold", stock < l.quantiteAccordee ? "text-red-600 bg-red-50/50" : "text-green-600 bg-green-50/50")}>{stock}</td>
                      <td className="px-4 py-3 text-center font-semibold text-indigo-700 bg-indigo-50/30">{formatNumber(l.pmp)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{l.quantiteDemandee}</td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">{l.quantiteAccordee}</td>
                      {showObservations && (
                        <td className="px-4 py-3 text-center font-bold text-[#1D6F42] bg-[#F1F8E9]/50">{l.quantiteServie ?? '—'}</td>
                      )}
                      <td className="px-4 py-3 text-right font-bold text-amber-700 bg-amber-50/30">{formatNumber(valeurLigne)}</td>
                      {showObservations && (
                        <td className="px-4 py-3 text-left text-gray-500 text-xs italic break-all whitespace-pre-wrap max-w-[150px]">{l.observationLigne || '—'}</td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colSpan={showObservations ? 7 : 6} className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                    Total Estimé
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    {formatNumber(totalEstime)} MAD
                  </td>
                  {showObservations && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>

          {demande.statut === 'VALIDEE' && demande.lignes.some(l => (stocks[l.produitReference] ?? Infinity) < l.quantiteAccordee) && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-800 shadow-sm">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-600" />
              <div>
                <p className="font-bold text-red-900">Alerte Stock Insuffisant</p>
                <p className="text-red-700 mt-1">La quantité en stock pour certains articles est inférieure à la quantité accordée. Veuillez vérifier avant de préparer.</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white px-6 py-4 border-t border-gray-100 flex justify-end gap-3 rounded-b-3xl">
          <Button variant="outline" className="rounded-xl px-6" onClick={onClose}>Fermer</Button>
          {isValidee && (
            <Button onClick={onLancer} className="bg-[#1D6F42] text-white hover:bg-[#155430] rounded-xl px-6 gap-2 shadow-md hover:shadow-lg transition-all">
              <Play className="h-4 w-4" /> Lancer la préparation
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RefusConfirmationDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (motif: string) => void }) {
  const [motif, setMotif] = useState("");

  const handleConfirm = () => {
    onConfirm(motif);
    setMotif("");
  };

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl border-red-100">
        <DialogTitle className="sr-only">Confirmation du refus</DialogTitle>
        <DialogHeader>
          <DialogTitle className="text-red-600 font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Confirmer le refus</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">Cette action est irréversible. La demande passera en statut "Refusée". Veuillez spécifier le motif.</DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <Textarea 
            placeholder="Saisissez le motif du refus (obligatoire)..." 
            value={motif} 
            onChange={(e) => setMotif(e.target.value)} 
            className="w-full border-gray-300 focus-visible:ring-red-500 rounded-xl min-h-[100px] resize-none break-all whitespace-pre-wrap"
          />
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="rounded-xl border-gray-200" onClick={onClose}>Annuler</Button>
          <Button 
            className="rounded-xl bg-red-600 text-white hover:bg-red-700" 
            onClick={handleConfirm}
            disabled={!motif.trim()}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PreparationDialog({ bonId, onClose, onSauvegarder }: { bonId: number; onClose: () => void; onSauvegarder: () => void }) {
  const [bon, setBon] = useState<BonSortieDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lignes, setLignes] = useState<LigneSortieDetail[]>([]);
  const [observations, setObservations] = useState('');

  useEffect(() => {
    sortieService.getBonSortie(bonId)
      .then(data => {
        setBon(data);
        setLignes(data.lignes);
        setObservations(data.observationsGlobales || '');
      })
      .catch(() => toast.error("Impossible de charger le bon de sortie."))
      .finally(() => setLoading(false));
  }, [bonId]);

  const updateQte = (id: number, qte: number) => {
    setLignes(prev => prev.map(l => l.id === id ? { ...l, quantiteServie: Math.max(0, Math.min(qte, l.quantiteAccordee)) } : l));
  };
  const updateObs = (id: number, obs: string) => {
    setLignes(prev => prev.map(l => l.id === id ? { ...l, observation: obs } : l));
  };

  const handleSave = async () => {
    try {
      await sortieService.sauvegarderPreparation(bonId, {
        lignes: lignes.map(l => ({ ligneSortieId: l.id, quantiteServie: l.quantiteServie, observation: l.observation })),
        observationsGlobales: observations
      });
      toast.success("Préparation sauvegardée.");
      onSauvegarder();
    } catch (e) {
      toast.error("Erreur lors de la sauvegarde.");
    }
  };

  if (loading || !bon) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[95vh] w-full max-w-[65vw] rounded-2xl overflow-y-auto bg-white" style={{ maxWidth: '65vw' }}>
          <DialogTitle className="sr-only">Chargement...</DialogTitle>
          <div className="flex items-center justify-center p-16"><div className="w-8 h-8 border-2 border-[#1D6F42] border-t-transparent rounded-full animate-spin" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] w-full max-w-[65vw] rounded-2xl overflow-y-auto bg-white" style={{ maxWidth: '65vw' }}>
        <DialogTitle className="sr-only">Préparation Physique</DialogTitle>
        <DialogHeader>
          <DialogTitle className="text-gray-900 font-bold text-xl flex items-center gap-2">
            <Box className="w-5 h-5 text-[#1D6F42]" /> Préparation Physique — {bon.lignes[0]?.produitDesignation || ''}
          </DialogTitle>
          <p className="text-sm text-gray-500">Ajustez les quantités réelles et ajoutez vos observations par article.</p>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">Article</th>
                  <th className="px-4 py-3 text-center">Accordé</th>
                  <th className="px-4 py-3 text-center">À servir</th>
                  <th className="px-4 py-3 text-left">Observation (État, Lot...)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lignes.map((l) => {
                  const partiellementServi = l.quantiteServie < l.quantiteAccordee;
                  return (
                    <tr key={l.id} className={cn("transition-colors", partiellementServi ? "bg-amber-50/40" : "bg-white")}>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[10px] text-gray-500">{l.produitReference}</div>
                        <div className="font-semibold text-gray-900 break-words whitespace-normal">{l.produitDesignation}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-600">{l.quantiteAccordee}</td>
                      <td className="px-4 py-3 text-center">
                        <Input type="number" min={0} max={l.quantiteAccordee} value={l.quantiteServie} onChange={e => updateQte(l.id, Number(e.target.value))} className={cn("mx-auto h-9 w-24 text-center font-bold rounded-lg border-gray-300 focus:border-[#1D6F42] focus:ring-[#1D6F42]", partiellementServi && "border-amber-400 bg-amber-50 text-amber-900")} />
                      </td>
                      <td className="px-4 py-3">
                        <Textarea 
                          value={l.observation} 
                          onChange={e => updateObs(l.id, e.target.value)} 
                          placeholder="Ex: Carton abîmé..." 
                          className="h-10 min-h-[40px] text-xs rounded-lg border-gray-300 focus:border-[#1D6F42] resize-y py-1 px-2 leading-tight w-full break-all whitespace-pre-wrap" 
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Textarea placeholder="Observations globales de préparation (optionnel)..." value={observations} onChange={e => setObservations(e.target.value)} className="min-h-[80px] rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] resize-y break-all whitespace-pre-wrap" />
        </div>
        <DialogFooter className="gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="outline" className="rounded-xl px-6" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} className="bg-[#1D6F42] text-white hover:bg-[#155430] rounded-xl px-6 shadow-md"><Save className="h-4 w-4 mr-2" /> Sauvegarder la préparation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LivraisonDialog({ demandeId, bonId, onClose, onConfirmerLivraison }: { demandeId: number; bonId: number; onClose: () => void; onConfirmerLivraison: () => void }) {
  const [accuse, setAccuse] = useState<AccuseReception | null>(null);
  const [signatures, setSignatures] = useState<Record<string, SignatureData>>({});
  const componentRef = useRef<HTMLDivElement>(null);

  const chargerAccuse = useCallback(async () => {
    try {
      const [data, detail] = await Promise.all([
        sortieService.getAccuse(demandeId),
        sortieService.getDemandeDetail(demandeId)
      ]);
      const localSignatures: Record<string, SignatureData> = {};
      data.signatures?.forEach(s => {
        localSignatures[s.role.toLowerCase()] = { img: s.img, dateStr: s.dateStr };
      });
      setSignatures(localSignatures);

      const valideurs: DemandeData['valideurs'] = {};
      if (detail.validations && detail.validations.length > 0) {
        const chef = detail.validations.find(v => v.etape === 'Chef Hiérarchique');
        if (chef) {
          valideurs.chefHierarchique = {
            nom: chef.valideParNom || '',
            date: chef.dateValidation || ''
          };
        }
      }

      const accuseData: AccuseReception = {
        numero: `AR-${new Date().getFullYear()}-${demandeId}`,
        demande: {
          id: data.demandeId,
          reference: data.demandeReference,
          employeNom: data.employeNom,
          matriculeDemandeur: data.matriculeDemandeur,
          structureNom: data.structureNom,
          urgence: data.statut as Priorite,
          dateCreation: data.dateLivraison || new Date().toISOString(),
          statut: data.statut as StatutDemande,
          commentaire: '',
          lignes: data.lignes.map(l => ({
            produitReference: l.produitReference,
            produitDesignation: l.produitDesignation,
            quantite: l.quantiteDemandee,
            quantiteAccordee: l.quantiteAccordee,
          })),
          lignesPreparees: data.lignes.map(l => ({
            produitReference: l.produitReference,
            produitDesignation: l.produitDesignation,
            quantite: l.quantiteDemandee,
            quantiteAccordee: l.quantiteAccordee,
            quantiteServie: l.quantiteServie,
            observation: l.observation,
          })),
          signatures: localSignatures,
          valideurs,
          fichierAccuseImporte: data.scanAccuseDataUrl ?? undefined,
        },
        dateEdition: new Date(),
        lignes: data.lignes.map(l => ({
          produitReference: l.produitReference,
          produitDesignation: l.produitDesignation,
          quantite: l.quantiteDemandee,
          quantiteAccordee: l.quantiteAccordee,
          quantiteServie: l.quantiteServie,
          observation: l.observation,
        })),
        signatures: localSignatures,
      };
      setAccuse(accuseData);
    } catch {
      toast.error("Impossible de charger les données de l'accusé.");
    }
  }, [demandeId]);

  useEffect(() => {
    chargerAccuse();
  }, [chargerAccuse]);

  const updateSignature = (key: string, value: SignatureData | undefined) => {
    setSignatures(prev => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Accuse_Reception_${accuse?.demande.reference ?? ''}`
  });

  const handleEnregistrerBrouillon = async () => {
    try {
      const req: SignatureRequest[] = Object.entries(signatures).map(([role, data]) => ({
        role: role.toUpperCase() as 'MAGASINIER' | 'DEMANDEUR' | 'RECEPTIONNAIRE' | 'CHEF_DEPT' | 'DIRECTEUR',
        img: data.img || '',
        dateStr: data.dateStr || ''
      }));
      await sortieService.enregistrerSignatures(bonId, req);
      toast.success("Signatures enregistrées (brouillon).");
      await chargerAccuse();
    } catch {
      toast.error("Erreur lors de l'enregistrement des signatures.");
    }
  };

  const handleLivrer = async () => {
    try {
      const req: LivraisonRequest = {
        signatures: Object.entries(signatures).map(([role, data]) => ({
          role: role.toUpperCase() as 'MAGASINIER' | 'DEMANDEUR' | 'RECEPTIONNAIRE' | 'CHEF_DEPT' | 'DIRECTEUR',
          img: data.img || '',
          dateStr: data.dateStr || ''
        })),
      };
      await sortieService.livrerSortie(bonId, req);
      toast.success("Livraison confirmée, stock mis à jour.");
      onConfirmerLivraison();
    } catch {
      toast.error("Erreur lors de la livraison.");
    }
  };

  if (!accuse) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[95vh] w-full max-w-[85vw] rounded-2xl overflow-hidden bg-gray-50 p-0 flex flex-col" style={{ maxWidth: '85vw' }}>
          <DialogTitle className="sr-only">Chargement...</DialogTitle>
          <div className="flex items-center justify-center p-16"><div className="w-8 h-8 border-2 border-[#1D6F42] border-t-transparent rounded-full animate-spin" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] w-full max-w-[85vw] rounded-2xl overflow-hidden bg-gray-50 p-0 flex flex-col" style={{ maxWidth: '85vw' }}>
        <DialogTitle className="sr-only">Aperçu Accusé et Livraison</DialogTitle>
        <div className="bg-[#0d3b66] h-16 flex items-center justify-between px-6 border-b border-gray-700 flex-shrink-0 z-10 shadow-md">
          <div className="text-white font-medium flex items-center gap-3 text-lg">
            <FileText className="w-5 h-5 text-blue-300" /> Génération Accusé & Livraison — {accuse.demande.reference}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => handlePrint()} className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0"><Printer className="h-4 w-4" /> Imprimer</Button>
            <Button onClick={handleEnregistrerBrouillon} className="gap-2 bg-amber-500 hover:bg-amber-600 text-white shadow-lg"><Save className="h-4 w-4" /> Enregistrer signatures</Button>
            <Button onClick={handleLivrer} className="gap-2 bg-[#1D6F42] hover:bg-[#155430] text-white shadow-lg"><CheckCircle2 className="h-4 w-4" /> Confirmer la Livraison</Button>
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 p-0" onClick={onClose}><X className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[300px] bg-white border-r border-gray-200 p-5 overflow-y-auto flex flex-col gap-6 shadow-md z-10">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Signatures Manuelles</h3>
              <p className="text-xs text-gray-500">Capturez les signatures pour l'Accusé de Réception sur plateforme.</p>
            </div>
            <SignaturePad label="Magasinier" value={signatures.magasinier} onChange={(val) => updateSignature('magasinier', val)} />
            <SignaturePad label="Demandeur" value={signatures.demandeur} onChange={(val) => updateSignature('demandeur', val)} />
            <SignaturePad label="Réceptionnaire Final" value={signatures.receptionnaire} onChange={(val) => updateSignature('receptionnaire', val)} />
            <SignaturePad label="Chef Département Logistique & MG" value={signatures.chef_dept} onChange={(val) => updateSignature('chef_dept', val)} />
            <SignaturePad label="Directeur Orga & Capital Humain" value={signatures.directeur} onChange={(val) => updateSignature('directeur', val)} />
          </div>

          <div className="flex-1 overflow-auto py-8 flex justify-center bg-[#525659]">
            <div ref={componentRef} className="shadow-2xl flex-shrink-0 bg-white print:shadow-none print:m-0" style={{ width: '210mm', minHeight: '297mm' }}>
              <AccuseReceptionA4 accuse={accuse} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ViewAccuseDialog({ demandeId, onClose }: { demandeId: number | null; onClose: () => void }) {
  const [accuse, setAccuse] = useState<AccuseReception | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (demandeId) {
      Promise.all([
        sortieService.getAccuse(demandeId),
        sortieService.getDemandeDetail(demandeId)
      ])
        .then(([data, detail]) => {
          const localSignatures = data.signatures?.reduce((acc, s) => {
            acc[s.role.toLowerCase()] = { img: s.img, dateStr: s.dateStr };
            return acc;
          }, {} as Record<string, SignatureData>);
          const valideurs: DemandeData['valideurs'] = {};
          if (detail.validations && detail.validations.length > 0) {
            const chef = detail.validations.find(v => v.etape === 'Chef Hiérarchique');
            if (chef) {
              valideurs.chefHierarchique = {
                nom: chef.valideParNom || '',
                date: chef.dateValidation || ''
              };
            }
          }
          const accuseData: AccuseReception = {
            numero: `AR-${new Date().getFullYear()}-${demandeId}`,
            demande: {
              id: data.demandeId,
              reference: data.demandeReference,
              employeNom: data.employeNom,
              matriculeDemandeur: data.matriculeDemandeur,
              structureNom: data.structureNom,
              urgence: data.statut as Priorite,
              dateCreation: data.dateLivraison || new Date().toISOString(),
              statut: data.statut as StatutDemande,
              commentaire: '',
              lignes: data.lignes.map(l => ({
                produitReference: l.produitReference,
                produitDesignation: l.produitDesignation,
                quantite: l.quantiteDemandee,
                quantiteAccordee: l.quantiteAccordee,
              })),
              lignesPreparees: data.lignes.map(l => ({
                produitReference: l.produitReference,
                produitDesignation: l.produitDesignation,
                quantite: l.quantiteDemandee,
                quantiteAccordee: l.quantiteAccordee,
                quantiteServie: l.quantiteServie,
                observation: l.observation,
              })),
              signatures: localSignatures,
              valideurs,
              fichierAccuseImporte: data.scanAccuseDataUrl ?? undefined,
            },
            dateEdition: new Date(),
            lignes: data.lignes.map(l => ({
              produitReference: l.produitReference,
              produitDesignation: l.produitDesignation,
              quantite: l.quantiteDemandee,
              quantiteAccordee: l.quantiteAccordee,
              quantiteServie: l.quantiteServie,
              observation: l.observation,
            })),
            signatures: localSignatures || {},
          };
          setAccuse(accuseData);
        })
        .catch(() => toast.error("Impossible de charger l'accusé."));
    }
  }, [demandeId]);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Accuse_Reception_${accuse?.demande.reference ?? ''}`
  });

  const downloadScan = () => {
    if (accuse?.demande.fichierAccuseImporte) {
      const link = document.createElement('a');
      link.href = accuse.demande.fichierAccuseImporte;
      link.download = `Accuse_Scanne_${accuse.demande.reference}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!demandeId || !accuse) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-h-[95vh] w-full max-w-[70vw] rounded-2xl overflow-hidden bg-gray-50 p-0 flex flex-col" style={{ maxWidth: '70vw' }}>
          <DialogTitle className="sr-only">Chargement...</DialogTitle>
          <div className="flex items-center justify-center p-16"><div className="w-8 h-8 border-2 border-[#1D6F42] border-t-transparent rounded-full animate-spin" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[95vh] w-full max-w-[70vw] rounded-2xl overflow-hidden bg-gray-50 p-0 flex flex-col" style={{ maxWidth: '70vw' }}>
        <DialogTitle className="sr-only">Visualiser Accusé</DialogTitle>
        <div className="bg-[#0d3b66] h-16 flex items-center justify-between px-6 border-b border-gray-700 flex-shrink-0 z-10 shadow-md">
          <div className="text-white font-medium flex items-center gap-3 text-lg">
            <FileCheck className="w-5 h-5 text-green-400" /> Accusé de Réception — {accuse.demande.reference}
          </div>
          <div className="flex items-center gap-3">
            {!accuse.demande.fichierAccuseImporte ? (
              <Button onClick={() => handlePrint()} className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0"><Printer className="h-4 w-4" /> Imprimer</Button>
            ) : (
              <Button onClick={downloadScan} className="gap-2 bg-white/10 hover:bg-white/20 text-white border-0"><Download className="h-4 w-4" /> Télécharger Scan</Button>
            )}
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 p-0" onClick={onClose}><X className="h-5 w-5" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex justify-center bg-[#525659] p-6">
          {accuse.demande.fichierAccuseImporte ? (
            <div className="shadow-2xl flex-shrink-0 bg-white relative overflow-hidden flex flex-col items-center" style={{ width: '210mm', minHeight: '297mm' }}>
              <div className="w-full bg-green-50 border-b border-green-200 p-4 text-center flex-shrink-0">
                <div className="flex items-center justify-center gap-2 text-green-800 font-bold text-lg">
                  <FileCheck className="w-6 h-6" /> Document Scanné Importé
                </div>
                <div className="text-sm text-green-600 mt-1">Cet accusé a été importé manuellement pour servir de preuve.</div>
              </div>
              <div className="flex-1 w-full flex items-center justify-center p-6">
                {accuse.demande.fichierAccuseImporte.startsWith('data:application/pdf') ? (
                  <iframe src={accuse.demande.fichierAccuseImporte} className="w-full h-full min-h-[800px] border border-gray-200 rounded-lg shadow-sm" />
                ) : (
                  <img src={accuse.demande.fichierAccuseImporte} alt="Scan Accusé" className="max-w-full max-h-full object-contain border border-gray-200 rounded-lg shadow-sm" />
                )}
              </div>
            </div>
          ) : (
            <div ref={componentRef} className="shadow-2xl flex-shrink-0 bg-white print:shadow-none print:m-0" style={{ width: '210mm', minHeight: '297mm' }}>
              <AccuseReceptionA4 accuse={accuse} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Composant Principal ────────────────────────────────────────────────────

export default function SortiesAPreparer() {
  const [sorties, setSorties] = useState<DemandeData[]>([])
  const [stocks, setStocks] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'' | Priorite>('')
  const [statusFilter, setStatusFilter] = useState<'' | StatutDemande>('')
  
  const [activePrepBonId, setActivePrepBonId] = useState<number | null>(null)
  const [activeLivraisonDemandeId, setActiveLivraisonDemandeId] = useState<number | null>(null)
  const [activeLivraisonBonId, setActiveLivraisonBonId] = useState<number | null>(null)
  const [activeAccuseDemandeId, setActiveAccuseDemandeId] = useState<number | null>(null)
  const [refuseTarget, setRefuseTarget] = useState<number | null>(null)
  const [detailDemandeId, setDetailDemandeId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importTargetId, setImportTargetId] = useState<number | null>(null)

  const getCurrentUserLogin = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('loginLdap');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const statutParam = statusFilter !== 'REFUSEE' ? statusFilter : undefined;
      const [demandesRes, articlesStock] = await Promise.all([
        sortieService.getDemandes({
          statut: statutParam || undefined,
          priorite: priorityFilter || undefined,
          search: search || undefined,
        }),
        sortieService.getStocks(),
      ]);
      const stockMap: Record<string, number> = {};
      articlesStock.forEach((a) => { stockMap[a.codeArticle] = a.quantiteDisponible; });
      setStocks(stockMap);

      let filteredDemandes = demandesRes;
      if (statusFilter === 'REFUSEE') {
        const login = getCurrentUserLogin();
        if (login) {
          filteredDemandes = demandesRes.filter(d => d.statut === 'REFUSEE' && d.valideParLogin === login);
        } else {
          filteredDemandes = demandesRes.filter(d => d.statut === 'REFUSEE');
        }
      }

      const mapped: DemandeData[] = filteredDemandes.map(d => ({
        id: d.id,
        reference: d.numeroDemande,
        employeNom: d.employeNom,
        matriculeDemandeur: '',
        structureNom: d.structureNom,
        urgence: d.priorite as Priorite,
        dateCreation: d.dateDemande,
        statut: d.statut as StatutDemande,
        commentaire: d.motifRefus || '',
        noteMagasinier: d.annotation || undefined,
        lignes: d.lignes.map(l => ({
          produitReference: l.produitReference,
          produitDesignation: l.produitDesignation,
          quantite: l.quantiteDemandee,
          quantiteAccordee: l.quantiteAccordee,
        })),
        valideurs: {
          chefHierarchique: d.validePar ? { nom: d.validePar, date: d.dateValidation || '' } : undefined,
        },
      }));
      setSorties(mapped);
    } catch (e) {
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, search, getCurrentUserLogin]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => sorties, [sorties]);

  const stats = useMemo(() => ({
    total: sorties.length,
    validees: sorties.filter(s => s.statut === 'VALIDEE').length,
    urgent: sorties.filter(s => s.urgence === 'URGENT' || s.urgence === 'CRITIQUE').length,
    preparation: sorties.filter(s => s.statut === 'EN_PREPARATION').length,
  }), [sorties]);

  const isKpiActive = useCallback((type: string) => {
    switch (type) {
      case 'all': return statusFilter === '' && priorityFilter === '';
      case 'validees': return statusFilter === 'VALIDEE' && priorityFilter === '';
      case 'urgent': return (priorityFilter === 'URGENT' || priorityFilter === 'CRITIQUE') && statusFilter === '';
      case 'preparation': return statusFilter === 'EN_PREPARATION' && priorityFilter === '';
      default: return false;
    }
  }, [statusFilter, priorityFilter]);

  const handleRefuser = useCallback((id: number) => setRefuseTarget(id), []);
  const confirmRefuser = useCallback(async (motif: string) => {
    if (refuseTarget !== null) {
      try {
        await sortieService.refuserDemande(refuseTarget, motif);
        toast.success('Demande refusée');
        setSorties(prev => prev.map(s => s.id === refuseTarget ? { ...s, statut: 'REFUSEE' as StatutDemande, commentaire: motif } : s));
      } catch (e) {
        toast.error('Erreur lors du refus');
      } finally {
        setRefuseTarget(null);
      }
    }
  }, [refuseTarget]);

  const handleViewDetails = useCallback((d: DemandeData) => setDetailDemandeId(d.id), []);

  const lancerPreparation = useCallback(async () => {
    if (!detailDemandeId) return;
    try {
      const bon = await sortieService.preparerSortie(detailDemandeId);
      setActivePrepBonId(bon.id);
      setDetailDemandeId(null);
      toast.success('Bon de sortie créé');
      fetchData();
    } catch {
      toast.error('Erreur lors de la création du bon');
    }
  }, [detailDemandeId, fetchData]);

  const handleOuvrirPreparation = useCallback(async (d: DemandeData) => {
    try {
      let bonId: number;
      if (d.statut === 'VALIDEE') {
        const bon = await sortieService.preparerSortie(d.id);
        bonId = bon.id;
      } else {
        const detail = await sortieService.getDemandeDetail(d.id);
        if (detail.bonSortie?.bonId) {
          bonId = detail.bonSortie.bonId;
        } else {
          toast.error("Aucun bon de préparation trouvé.");
          return;
        }
      }
      setActivePrepBonId(bonId);
    } catch {
      toast.error("Impossible de démarrer la préparation");
    }
  }, []);

  const handleSauvegarderPreparation = useCallback(async () => {
    setActivePrepBonId(null);
    fetchData();
  }, [fetchData]);

  const handleLivrer = useCallback(async (d: DemandeData) => {
    try {
      const detail = await sortieService.getDemandeDetail(d.id);
      if (detail.bonSortie?.bonId) {
        setActiveLivraisonDemandeId(d.id);
        setActiveLivraisonBonId(detail.bonSortie.bonId);
      } else {
        toast.error("Aucun bon de préparation trouvé pour cette demande.");
      }
    } catch {
      toast.error("Impossible de récupérer le bon de préparation.");
    }
  }, []);

  const handleViewAccuse = useCallback((d: DemandeData) => {
    setActiveAccuseDemandeId(d.id);
  }, []);

  const triggerImportScan = useCallback((d: DemandeData) => {
    setImportTargetId(d.id);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && importTargetId) {
      try {
        await sortieService.uploadScanAccuse(importTargetId, file);
        toast.success("Scan importé avec succès.");
      } catch {
        toast.error("Échec de l'import du scan.");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setImportTargetId(null);
  };

  const resetFilters = useCallback(() => { setSearch(''); setPriorityFilter(''); setStatusFilter(''); }, []);

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 min-h-screen bg-gray-50/30">
      <input type="file" accept="image/*,application/pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sorties & Livraisons</h1>
          <p className="text-sm text-gray-500">Flux de préparation physique, accusés de réception et livraison.</p>
        </div>
        <div className="flex items-center gap-2">
          {(activePrepBonId || activeLivraisonDemandeId) && (
            <span className="text-xs font-medium text-[#1D6F42] bg-[#E8F5E9] px-3 py-1.5 rounded-lg animate-pulse border border-[#1D6F42]/20">
              <span className="inline-block w-1.5 h-1.5 bg-[#1D6F42] rounded-full mr-1.5" /> Action en cours
            </span>
          )}
          {(priorityFilter || statusFilter || search) && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-gray-500 hover:text-gray-700 rounded-xl gap-1">
              <X className="h-3.5 w-3.5" /> Réinitialiser
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={FileText} label="Toutes" value={stats.total} colorClass="bg-[#E3F2FD] text-[#0d3b66]" isActive={isKpiActive('all')} onClick={() => { setStatusFilter(''); setPriorityFilter('') }} />
        <KpiCard icon={Check} label="À Préparer" value={stats.validees} colorClass="bg-[#E8F5E9] text-[#1D6F42]" isActive={isKpiActive('validees')} onClick={() => { setStatusFilter('VALIDEE'); setPriorityFilter('') }} />
        <KpiCard icon={AlertTriangle} label="Urgentes" value={stats.urgent} colorClass="bg-[#FFF3E0] text-[#E65100]" isActive={isKpiActive('urgent')} onClick={() => { setPriorityFilter('URGENT'); setStatusFilter('') }} />
        <KpiCard icon={Package} label="En Préparation" value={stats.preparation} colorClass="bg-[#F3E5F5] text-[#8E24AA]" isActive={isKpiActive('preparation')} onClick={() => { setStatusFilter('EN_PREPARATION'); setPriorityFilter('') }} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#1D6F42]" />
            <h3 className="font-bold text-gray-900 text-sm">Liste des Demandes</h3>
            {filtered.length > 0 && !loading && <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600">{filtered.length}</Badge>}
          </div>
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Recherche (réf, nom, dépt)..." className="pl-9 h-9 text-sm border-gray-200 rounded-xl focus-visible:ring-[#1D6F42]" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {(['', 'NORMAL', 'URGENT', 'CRITIQUE'] as const).map(p => (
                <FilterBadge key={`p-${p}`} label={p || 'Priorités'} isActive={priorityFilter === p} onClick={() => setPriorityFilter(priorityFilter === p ? '' : (p as '' | Priorite))} />
              ))}
              <div className="mx-1 h-6 w-px bg-gray-200" />
              {(['', 'VALIDEE', 'REFUSEE', 'EN_PREPARATION', 'LIVREE'] as const).map(s => (
                <FilterBadge key={`s-${s}`} label={s ? STATUS_LABELS[s] : 'Statuts'} isActive={statusFilter === s} onClick={() => setStatusFilter(statusFilter === s ? '' : (s as '' | StatutDemande))} />
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
                <th className="px-4 py-3">N° Demande</th><th className="px-4 py-3">Demandeur</th><th className="px-4 py-3">Département</th><th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Priorité</th><th className="px-4 py-3 text-center">Statut</th><th className="px-4 py-3 text-right">Articles</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableEmptyState loading colSpan={8} />
              ) : filtered.length === 0 ? (
                <TableEmptyState loading={false} colSpan={8} />
              ) : (
                filtered.map(d => (
                  <DemandeRow
                    key={d.id}
                    demande={d}
                    onRefuser={handleRefuser}
                    onPreparer={handleOuvrirPreparation}
                    onReprendre={handleOuvrirPreparation}
                    onViewDetails={handleViewDetails}
                    onLivrer={handleLivrer}
                    onViewAccuse={handleViewAccuse}
                    onImportScan={triggerImportScan}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailDemandeId && <DetailDemandeDialog demandeId={detailDemandeId} stocks={stocks} onClose={() => setDetailDemandeId(null)} onLancer={lancerPreparation} />}
      {activePrepBonId && <PreparationDialog bonId={activePrepBonId} onClose={() => { setActivePrepBonId(null); fetchData(); }} onSauvegarder={handleSauvegarderPreparation} />}
      {activeLivraisonDemandeId && activeLivraisonBonId && (
        <LivraisonDialog demandeId={activeLivraisonDemandeId} bonId={activeLivraisonBonId} onClose={() => { setActiveLivraisonDemandeId(null); setActiveLivraisonBonId(null); fetchData(); }} onConfirmerLivraison={() => { setActiveLivraisonDemandeId(null); setActiveLivraisonBonId(null); fetchData(); }} />
      )}
      {activeAccuseDemandeId && <ViewAccuseDialog demandeId={activeAccuseDemandeId} onClose={() => setActiveAccuseDemandeId(null)} />}
      <RefusConfirmationDialog open={refuseTarget !== null} onClose={() => setRefuseTarget(null)} onConfirm={confirmRefuser} />
    </main>
  )
}