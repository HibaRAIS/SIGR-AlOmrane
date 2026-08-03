"use client";

import {
  useState, useMemo, useCallback, useRef, useEffect, useTransition,
} from "react";
import {
  Search, X, ChevronDown, ChevronUp, Calendar, Package, CheckCircle2,
  XCircle, Truck, Users, Eye, FileText, SlidersHorizontal, MessageSquare,
  CircleDot, ArrowUp, ArrowDown, Minus, Clock, ChevronRight, Loader2,
  Send, Ban, Edit3, Save,
} from "lucide-react";
import { useSearchParams } from "next/navigation"; 
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { demandeService } from "@/services/demande.service";// adapter le chemin
import { DemandeResponse, LigneResponse } from "@/types/demande";

// ════════════════════════════════════════════════════════════════════════════
// TYPES – Adaptation des types backend vers l’UI
// ════════════════════════════════════════════════════════════════════════════

type StatutUI   = "en_attente" | "approuvee" | "rejetee" | "en_preparation" | "livree" | "annulee";
type PrioriteUI = "urgente" | "critique" | "normale";
type SortKey  = "date" | "priorite" | "statut" | "employe";
type SortDir  = "asc" | "desc";

// Employé simplifié pour l’affichage
interface EmployeUI {
  nom: string;
  initiales: string;
  service: string;
  color: string;
}

// Article tel qu’attendu par l’UI
interface ArticleUI {
  nom: string;
  quantiteDemandee: number;
  quantiteAccordee?: number;
  unite: string;      // par défaut "unité" si non fourni
}

// Demande après transformation
interface DemandeUI {
  id: number;
  reference: string;
  employe: EmployeUI;
  dateCreation: string;   // ISO
  dateMaj: string;
  priorite: PrioriteUI;
  statut: StatutUI;
  articles: ArticleUI[];
  motifRejet?: string;
  annotation?: string;
  // Champs additionnels pour les actions (garder les infos backend)
  backendStatut: string;
  backendPriorite: string;
  lignesBackend: LigneResponse[];
  validePar?: string | null;
  dateValidation?: string | null;
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIGURATION (statuts, priorité, timeline)
// ════════════════════════════════════════════════════════════════════════════

const G = "#004d2c";  // Al Omrane green

const S: Record<StatutUI, { label: string; pill: string; dot: string; progress: number }> = {
  en_attente:     { label: "En attente",     pill: "bg-amber-100 text-amber-800 ring-amber-200",  dot: "bg-amber-400",  progress: 1 },
  approuvee:      { label: "Approuvée",      pill: "bg-emerald-100 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500", progress: 2 },
  en_preparation: { label: "En préparation", pill: "bg-sky-100 text-sky-800 ring-sky-200",       dot: "bg-sky-500",    progress: 3 },
  livree:         { label: "Livrée",         pill: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400",  progress: 4 },
  rejetee:        { label: "Rejetée",        pill: "bg-red-100 text-red-800 ring-red-200",       dot: "bg-red-500",    progress: -1 },
  annulee:        { label: "Annulée",        pill: "bg-gray-100 text-gray-500 ring-gray-200",    dot: "bg-gray-300",   progress: -1 },
};

const P: Record<PrioriteUI, { label: string; bar: string; ring: string; text: string; order: number }> = {
  critique: { label: "Critique", bar: "#dc2626", ring: "ring-red-300", text: "text-red-700", order: 0 },
  urgente:   { label: "Urgente",   bar: "#d97706", ring: "ring-amber-300", text: "text-amber-700", order: 1 },
  normale: { label: "Normale", bar: "#94a3b8", ring: "ring-slate-200", text: "text-slate-500", order: 2 },
};

const TIMELINE = [
  { label: "Soumise",         sub: "par l'employé" },
  { label: "En validation",   sub: "Chef de service" },
  { label: "Approuvée",       sub: "Chef de service" },
  { label: "En préparation",  sub: "Magasin central" },
  { label: "Livrée",          sub: "Magasin central" },
];

// ════════════════════════════════════════════════════════════════════════════
// UTILS : mapping backend -> UI
// ════════════════════════════════════════════════════════════════════════════

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
const fmtFull = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
const ago = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return "Hier";
  if (d < 7) return `${d}j`;
  return fmt(iso);
};

// Convertir le statut backend (ex: "EN_VALIDATION") en StatutUI
function mapStatut(backendStatut: string): StatutUI {
  switch (backendStatut) {
    case "EN_VALIDATION": return "en_attente";
    case "VALIDEE":       return "approuvee";
    case "REFUSEE":       return "rejetee";
    case "EN_PREPARATION":return "en_preparation";
    case "LIVREE":        return "livree";
    case "ANNULEE":       return "annulee";
    default:              return "en_attente";
  }
}

// Convertir la priorité backend (ex: "URGENTE") en PrioriteUI
function mapPriorite(backendPriorite: string): PrioriteUI {
  switch (backendPriorite) {
    case "CRITIQUE":
      return "critique";
    case "URGENT":
      return "urgente";
    case "NORMAL":
      return "normale";
    default:
      return "normale";
  }
}

// Générer une couleur cohérente à partir du nom du service
function getColorFromService(service: string): string {
  const colors = ["#6d28d9", "#0369a1", "#b45309", "#047857", "#be185d", "#1e40af", "#b91c1c"];
  let hash = 0;
  for (let i = 0; i < service.length; i++) hash = ((hash << 5) - hash) + service.charCodeAt(i);
  return colors[Math.abs(hash) % colors.length];
}

// Transformer une DemandeResponse backend en DemandeUI
function toDemandeUI(dto: DemandeResponse): DemandeUI {
  const employeNom = dto.employeNom;
  const service = dto.structureNom || "Service inconnu";
  const initiales = employeNom
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const articles: ArticleUI[] = dto.lignes.map(ligne => ({
    nom: ligne.produitDesignation,
    quantiteDemandee: ligne.quantiteDemandee,
    quantiteAccordee: ligne.quantiteAccordee,
    unite: "unité",     // l’API ne fournit pas l’unité, on met une valeur par défaut
  }));

  return {
    id: dto.id,
    reference: dto.numeroDemande,
    employe: {
      nom: employeNom,
      initiales,
      service,
      color: getColorFromService(service),
    },
    dateCreation: dto.dateDemande,
    dateMaj: dto.dateValidation || dto.dateDemande,
    priorite: mapPriorite(dto.priorite),
    statut: mapStatut(dto.statut),
    articles,
    motifRejet: dto.motifRefus || undefined,
    annotation: dto.annotation || undefined,
    backendStatut: dto.statut,
    backendPriorite: dto.priorite,
    lignesBackend: dto.lignes,
    validePar: dto.validePar,
    dateValidation: dto.dateValidation,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANTS ATOMES (inchangés)
// ════════════════════════════════════════════════════════════════════════════

function Pip({ statut }: { statut: StatutUI }) {
  const cfg = S[statut];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold ring-1", cfg.pill)}>
      <span className={cn("size-1.5 rounded-full shrink-0", cfg.dot, statut === "en_attente" && "animate-pulse")} />
      {cfg.label}
    </span>
  );
}

function Ava({ e, sz = 8 }: { e: EmployeUI; sz?: number }) {
  const cl = `w-${sz} h-${sz}`;
  return (
    <div
      className={cn(cl, "rounded-lg flex items-center justify-center font-bold text-white shrink-0 text-[11px] shadow-sm")}
      style={{ background: e.color }}
    >
      {e.initiales}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DRAWER avec actions (Approuver, Rejeter, Ajuster, Annoter)
// ════════════════════════════════════════════════════════════════════════════

function Drawer({
  demande,
  onClose,
  onActionComplete,
}: {
  demande: DemandeUI;
  onClose: () => void;
  onActionComplete: () => void;
}) {
  const sc = S[demande.statut];
  const pc = P[demande.priorite];
  const prog = sc.progress;
  const isNeg = prog === -1;
  const isPending = demande.statut === "en_attente";

  // États pour l’édition des quantités accordées
  const [adjustedQuantities, setAdjustedQuantities] = useState<Record<number, number>>(() => {
    const initial: Record<number, number> = {};
    demande.lignesBackend.forEach(ligne => {
      initial[ligne.ligneId] = ligne.quantiteAccordee;
    });
    return initial;
  });

  const [annotation, setAnnotation] = useState(demande.annotation || "");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [loading, setLoading] = useState(false);

const handleAdjust = async () => {
  setLoading(true);
  try {
    const lignesToSend = Object.entries(adjustedQuantities).map(([ligneId, qte]) => ({
      ligneId: parseInt(ligneId),
      quantiteAccordee: qte,
    }));
    await demandeService.ajuster(demande.id, lignesToSend);
    toast.success("Quantités ajustées avec succès");
    onActionComplete();
    onClose();
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || "Erreur lors de l’ajustement";
    toast.error(message);
    console.error("Erreur ajustement", err);
  } finally {
    setLoading(false);
  }
};

const handleApprove = async () => {
  setLoading(true);
  try {
    await demandeService.approuver(demande.id);
    toast.success("Demande approuvée avec succès");
    onActionComplete();
    onClose();
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || "Erreur lors de l’approbation";
    toast.error(message);
    console.error("Erreur approbation", err);
  } finally {
    setLoading(false);
  }
};

const handleReject = async () => {
  if (!rejectReason.trim()) {
    toast.error("Veuillez saisir un motif de rejet");
    return;
  }
  setLoading(true);
  try {
    await demandeService.rejeter(demande.id, rejectReason);
    toast.success("Demande rejetée");
    onActionComplete();
    onClose();
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || "Erreur lors du rejet";
    toast.error(message);
    console.error("Erreur rejet", err);
  } finally {
    setLoading(false);
    setShowRejectDialog(false);
  }
};

const handleAnnotate = async () => {
  setLoading(true);
  try {
    await demandeService.annoter(demande.id, annotation);
    toast.success("Annotation enregistrée");
    onActionComplete();
    // Ne pas fermer le drawer
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || "Erreur lors de l’annotation";
    toast.error(message);
    console.error("Erreur annotation", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn .2s cubic-bezier(.4,0,.2,1)" }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0 }
            to   { transform: translateX(0);    opacity: 1 }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-gray-100 shrink-0">
          <Ava e={demande.employe} sz={10} />
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-[15px] font-bold text-gray-900 truncate leading-snug">{demande.employe.nom}</p>
            <p className="text-xs text-gray-400 mt-0.5">{demande.employe.service}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
                {demande.reference}
              </code>
              <Pip statut={demande.statut} />
              <span className={cn("text-[11px] font-semibold ring-1 rounded-full px-2.5 py-[3px]", pc.ring, pc.text)}>
                {demande.priorite === "urgente" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5 -mb-px" />}
                {pc.label}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0 -mt-1 -mr-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8 [&::-webkit-scrollbar]:hidden scrollbar-none">
          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50/80 border border-gray-100 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Soumission</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{fmtFull(demande.dateCreation)}</p>
            </div>
            <div className="rounded-xl bg-gray-50/80 border border-gray-100 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Dernière activité</p>
              <p className="text-sm font-bold text-gray-800 mt-1">{ago(demande.dateMaj)}</p>
            </div>
          </div>

          {/* Articles avec édition possible si en attente */}
          <section>
            <header className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Articles <span className="ml-1 text-gray-300">·</span> <span className="text-gray-500">{demande.articles.length}</span>
              </p>
              {isPending && <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Modifiable</span>}
            </header>
            <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {demande.lignesBackend.map((ligne, idx) => {
                const produit = demande.articles.find(a => a.nom === ligne.produitDesignation) || demande.articles[idx];
                const currentQte = adjustedQuantities[ligne.ligneId] ?? ligne.quantiteAccordee;
                return (
                  <div key={ligne.ligneId} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/60 transition-colors">
                    <span className="text-sm text-gray-700 font-medium flex-1 min-w-0 truncate pr-4">{ligne.produitDesignation}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm tabular-nums text-gray-500">
                        {ligne.quantiteDemandee} <span className="text-xs text-gray-400">unité</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      {isPending ? (
                        <input
                          type="number"
                          value={currentQte}
                          onChange={(e) => setAdjustedQuantities(prev => ({ ...prev, [ligne.ligneId]: parseInt(e.target.value) || 0 }))}
                          className="w-20 text-sm border border-gray-200 rounded-md px-2 py-1 text-center"
                          min={0}
                          max={ligne.quantiteDemandee}
                        />
                      ) : (
                        <span className={cn("text-sm tabular-nums font-semibold", currentQte < ligne.quantiteDemandee ? "text-amber-600" : "text-emerald-600")}>
                          {currentQte} <span className="text-xs font-normal">unité</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {isPending && (
              <button
                onClick={handleAdjust}
                disabled={loading}
                className="mt-3 text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Enregistrer les ajustements
              </button>
            )}
          </section>

          {/* Timeline (si non rejetée/annulée) */}
          {!isNeg && (
            <section>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Progression</p>
              <div className="relative space-y-0">
                {TIMELINE.map((step, i) => {
                  const done = i < prog;
                  const current = i === prog;
                  return (
                    <div key={i} className="relative flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("size-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all",
                          done ? "border-transparent shadow-sm" : "",
                          current ? "border-[#004d2c] bg-white shadow-md" : "border-gray-150 bg-white",
                        )} style={done ? { background: G } : {}}>
                          {done ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : current ? <CircleDot className="w-3.5 h-3.5" style={{ color: G }} /> : <div className="size-2 rounded-full bg-gray-200" />}
                        </div>
                        {i < TIMELINE.length - 1 && <div className={cn("w-px flex-1 my-0.5", done ? "bg-emerald-200" : "bg-gray-100")} style={{ minHeight: 20 }} />}
                      </div>
                      <div className={cn("pb-5", i === TIMELINE.length - 1 && "pb-0")}>
                        <p className={cn("text-sm font-semibold leading-none", done || current ? "text-gray-900" : "text-gray-300")}>
                          {step.label}
                          {current && <span className="ml-2 text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: `${G}18`, color: G }}>En cours</span>}
                        </p>
                        <p className={cn("text-xs mt-0.5", done || current ? "text-gray-400" : "text-gray-200")}>{step.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Motif rejet */}
          {demande.motifRejet && (
            <section className="rounded-xl border border-red-100 bg-red-50 px-4 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Motif de rejet</p>
              <p className="text-sm text-red-700 leading-relaxed">{demande.motifRejet}</p>
            </section>
          )}

          {/* Annotation (éditable si en attente) */}
          <section className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2">Note magasinier</p>
            {isPending ? (
              <textarea
                value={annotation}
                onChange={(e) => setAnnotation(e.target.value)}
                rows={3}
                className="w-full text-sm text-indigo-700 bg-white border border-indigo-200 rounded-lg p-2"
                placeholder="Ajouter une annotation..."
              />
            ) : (
              <p className="text-sm text-indigo-700 leading-relaxed">{demande.annotation || "Aucune annotation"}</p>
            )}
            {isPending && (
              <button
                onClick={handleAnnotate}
                disabled={loading}
                className="mt-2 text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Enregistrer l'annotation
              </button>
            )}
          </section>
        </div>

        {/* Actions (uniquement pour les demandes en attente) */}
        {isPending && (
          <div className="border-t border-gray-100 p-4 flex gap-3 shrink-0 bg-white">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Approuver
            </button>
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={loading}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
          </div>
        )}
      </div>

      {/* Dialogue de rejet */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-2">Motif du rejet</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="Expliquez la raison du rejet..."
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowRejectDialog(false)} className="px-4 py-2 text-gray-500">Annuler</button>
              <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-lg">Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TABLE ROW (inchangée mais adaptée à DemandeUI)
// ════════════════════════════════════════════════════════════════════════════

function Row({ d, onOpen }: { d: DemandeUI; onOpen: (d: DemandeUI) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr className="group border-b border-gray-100 last:border-0 hover:bg-[#f8faf9] transition-colors cursor-pointer" onClick={() => onOpen(d)}>
        <td className="w-1 py-0 pr-0 pl-0">
          <div className="w-[3px] h-full min-h-[56px] rounded-r-full mx-auto" style={{ background: P[d.priorite].bar }} />
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Ava e={d.employe} sz={8} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-snug">{d.employe.nom}</p>
              <p className="text-[11px] text-gray-400 truncate">{d.employe.service}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3.5 hidden lg:table-cell">
          <code className="text-[11px] font-mono text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">{d.reference}</code>
        </td>
        <td className="px-3 py-3.5 hidden md:table-cell">
          <button onClick={e => { e.stopPropagation(); setOpen(v => !v); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800">
            <span className="font-semibold tabular-nums">{d.articles.length}</span> <span className="text-gray-400">art.</span>
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </td>
        <td className="px-3 py-3.5 hidden xl:table-cell">
          <span className="text-xs text-gray-400 tabular-nums">{ago(d.dateCreation)}</span>
        </td>
        <td className="px-3 py-3.5 hidden sm:table-cell">
          <span className={cn("text-[11px] font-semibold ring-1 rounded-full px-2.5 py-[3px]", P[d.priorite].ring, P[d.priorite].text)}>
            {d.priorite === "urgente" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1.5 -mb-px" />}
            {P[d.priorite].label}
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
              {d.articles.map((a, i) => (
                <div key={i} className={cn("flex items-center justify-between px-4 py-2.5", i < d.articles.length - 1 && "border-b border-gray-50")}>
                  <span className="text-gray-600 font-medium">{a.nom}</span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-gray-500">{a.quantiteDemandee} unité</span>
                    {a.quantiteAccordee !== undefined && (
                      <>
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                        <span className={a.quantiteAccordee < a.quantiteDemandee ? "text-amber-600 font-semibold" : "text-emerald-600 font-semibold"}>
                          {a.quantiteAccordee} unité
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
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COLONNE TRIABLE
// ════════════════════════════════════════════════════════════════════════════

function Th({ label, sk, cur, dir, onSort, className }: {
  label: string; sk?: SortKey; cur: SortKey; dir: SortDir; onSort: (k: SortKey) => void; className?: string;
}) {
  const active = sk && cur === sk;
  return (
    <th className={cn("px-3 py-3 text-left", className)}>
      {sk ? (
        <button onClick={() => onSort(sk)} className={cn("inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
          active ? "text-gray-800" : "text-gray-400 hover:text-gray-600")}>
          {label}
          <span className="flex flex-col gap-[1px]">
            <ArrowUp className={cn("w-2.5 h-2.5", active && dir === "asc" ? "text-gray-700" : "text-gray-300")} />
            <ArrowDown className={cn("w-2.5 h-2.5", active && dir === "desc" ? "text-gray-700" : "text-gray-300")} />
          </span>
        </button>
      ) : (
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      )}
    </th>
  );
}


// ════════════════════════════════════════════════════════════════════════════
// HOOK PERSONNALISÉ POUR RÉCUPÉRER TOUTES LES DEMANDES DU CHEF
// ════════════════════════════════════════════════════════════════════════════

function useChefDemandes() {
  const [demandes, setDemandes] = useState<DemandeUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Appel à l’endpoint générique sans filtre = toutes les demandes du chef
      const data = await demandeService.getDemandesPourChef();
      const uiList = data.map(toDemandeUI);
      setDemandes(uiList);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDemandes();
  }, [fetchDemandes]);

  return { demandes, loading, error, refetch: fetchDemandes };
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════════════

const STATUT_LABELS: Record<StatutUI | "tous", string> = {
  tous: "Tous",
  en_attente: "En attente",
  approuvee: "Approuvées",
  en_preparation: "Préparation",
  rejetee: "Rejetées",
  livree: "Livrées",
  annulee: "Annulées",
};

export default function DemandesEquipePage() {
  const searchParams = useSearchParams();
  const statutParam = searchParams.get("statut"); // "approuvee" ou "rejetee"

  const { demandes, loading, error, refetch } = useChefDemandes();

  // Filtres & tris
  const [q, setQ] = useState("");
  const [fStatut, setFStatut] = useState<StatutUI | "tous">(() => {
    if (statutParam === "approuvee") return "approuvee";
    if (statutParam === "rejetee") return "rejetee";
    return "tous";
  });
  const [fPriorite, setFPriorite] = useState<PrioriteUI | "tous">("tous");
  const [fService, setFService] = useState("tous");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drawer, setDrawer] = useState<DemandeUI | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);


  // ⌘K raccourci recherche
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const sort = useCallback((k: SortKey) => {
    startTransition(() => {
      setSortDir(d => sortKey === k ? (d === "asc" ? "desc" : "asc") : "desc");
      setSortKey(k);
    });
  }, [sortKey]);

  const stats = useMemo(() => {
    return demandes.reduce((acc, d) => {
      acc.total++;
      acc[d.statut] = (acc[d.statut] ?? 0) + 1;
      return acc;
    }, { total: 0 } as Record<string, number>);
  }, [demandes]);

  const services = useMemo(() => ["tous", ...new Set(demandes.map(d => d.employe.service))], [demandes]);

  const filtered = useMemo(() => {
    let list = demandes.filter(d => {
      if (fStatut !== "tous" && d.statut !== fStatut) return false;
      if (fPriorite !== "tous" && d.priorite !== fPriorite) return false;
      if (fService !== "tous" && d.employe.service !== fService) return false;
      if (q) {
        const lq = q.toLowerCase();
        return d.reference.toLowerCase().includes(lq)
          || d.employe.nom.toLowerCase().includes(lq)
          || d.employe.service.toLowerCase().includes(lq)
          || d.articles.some(a => a.nom.toLowerCase().includes(lq));
      }
      return true;
    });
    list.sort((a, b) => {
      let v = 0;
      if (sortKey === "date") v = a.dateCreation.localeCompare(b.dateCreation);
      if (sortKey === "priorite") v = P[a.priorite].order - P[b.priorite].order;
      if (sortKey === "statut") v = a.statut.localeCompare(b.statut);
      if (sortKey === "employe") v = a.employe.nom.localeCompare(b.employe.nom);
      return sortDir === "asc" ? v : -v;
    });
    return list;
  }, [demandes, q, fStatut, fPriorite, fService, sortKey, sortDir]);

  const hasFilters = q || fStatut !== "tous" || fPriorite !== "tous" || fService !== "tous";

  const handleActionComplete = () => {
    refetch();   // recharge les demandes après une action
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">Erreur : {error}</p>
        <button onClick={refetch} className="mt-3 text-sm underline">Réessayer</button>
      </div>
    );
  }

  return (
    <>
      {drawer && <Drawer demande={drawer} onClose={() => setDrawer(null)} onActionComplete={handleActionComplete} />}

      <div className="space-y-5 pb-8">
        {/* En-tête */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Chef de Service</p>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none">Demandes équipe</h1>
          </div>
          <p className="text-sm text-gray-400 pb-0.5">
            <span className="font-bold text-gray-700">{demandes.filter(d => d.statut === "en_attente").length}</span> en attente de validation
          </p>
        </div>

        {/* Bandes statistiques */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(["tous", "en_attente", "approuvee", "en_preparation", "rejetee", "livree"] as const).map(s => {
            const val = s === "tous" ? stats.total : (stats[s] ?? 0);
            const active = fStatut === s;
            const colors: Record<string, string> = {
              tous: "#374151", en_attente: "#b45309", approuvee: "#047857",
              en_preparation: "#0369a1", rejetee: "#be123c", livree: "#475569",
            };
            const bgs: Record<string, string> = {
              tous: "#f9fafb", en_attente: "#fffbeb", approuvee: "#f0fdf4",
              en_preparation: "#f0f9ff", rejetee: "#fff1f2", livree: "#f8fafc",
            };
            const borders: Record<string, string> = {
              tous: "#e5e7eb", en_attente: "#fde68a", approuvee: "#bbf7d0",
              en_preparation: "#bae6fd", rejetee: "#fecdd3", livree: "#e2e8f0",
            };
            return (
              <button
                key={s}
                onClick={() => setFStatut(s)}
                className={cn("rounded-xl px-3 py-3 text-center border transition-all duration-150 hover:scale-[1.02] active:scale-[.98]", active && "shadow-md scale-[1.02]")}
                style={{ background: bgs[s], borderColor: active ? colors[s] + "60" : borders[s], boxShadow: active ? `0 0 0 2px ${colors[s]}25` : undefined }}
              >
                <p className="text-xl font-extrabold tabular-nums" style={{ color: colors[s] }}>{val}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-0.5 leading-tight">{STATUT_LABELS[s]}</p>
              </button>
            );
          })}
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher…"
              className={cn("w-full pl-10 pr-20 py-2.5 text-sm rounded-xl border bg-white transition-all placeholder:text-gray-300 focus:outline-none",
                q ? "border-gray-400 ring-1 ring-gray-300" : "border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-200")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {q && <button onClick={() => setQ("")} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>}
              <kbd className="hidden sm:inline-flex text-[9px] text-gray-300 border border-gray-200 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
            </div>
          </div>

          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {(["tous", "urgente", "critique", "normale"] as const).map(p => {
              const active = fPriorite === p;
              const color = p === "critique" ? "#dc2626" : p === "urgente" ? "#d97706" : p === "normale" ? "#64748b" : G;
              return (
                <button key={p} onClick={() => setFPriorite(p)} className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all", active ? "text-white shadow-sm" : "text-gray-400 hover:text-gray-700")}
                  style={active ? { background: color } : {}}>
                  {p === "tous" ? "Toutes" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              );
            })}
          </div>

          <select value={fService} onChange={e => setFService(e.target.value)} className="text-[11px] font-semibold px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 focus:outline-none cursor-pointer hover:border-gray-300">
            {services.map(s => <option key={s} value={s}>{s === "tous" ? "Tous les services" : s}</option>)}
          </select>

          {hasFilters && (
            <button onClick={() => { setQ(""); setFStatut("tous"); setFPriorite("tous"); setFService("tous"); }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-xs font-semibold text-gray-400 hover:text-red-500 hover:border-red-300 transition-all">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </div>

        {/* Tableau */}
        <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="w-[3px] p-0" />
                <Th label="Employé" sk="employe" cur={sortKey} dir={sortDir} onSort={sort} className="px-4 py-3 w-56" />
                <Th label="Réf." cur={sortKey} dir={sortDir} onSort={sort} className="hidden lg:table-cell w-40" />
                <Th label="Articles" cur={sortKey} dir={sortDir} onSort={sort} className="hidden md:table-cell w-24" />
                <Th label="Date" sk="date" cur={sortKey} dir={sortDir} onSort={sort} className="hidden xl:table-cell w-20" />
                <Th label="Priorité" sk="priorite" cur={sortKey} dir={sortDir} onSort={sort} className="hidden sm:table-cell w-28" />
                <Th label="Statut" sk="statut" cur={sortKey} dir={sortDir} onSort={sort} className="w-36" />
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-20 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center"><FileText className="w-5 h-5 text-gray-300" /></div>
                    <div><p className="text-sm font-semibold text-gray-500">Aucune demande</p><p className="text-xs text-gray-400 mt-0.5">Ajustez vos filtres</p></div>
                    {hasFilters && <button onClick={() => { setQ(""); setFStatut("tous"); setFPriorite("tous"); setFService("tous"); }} className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl px-4 py-2 hover:bg-gray-50">Réinitialiser</button>}
                  </div>
                </td></tr>
              ) : (
                filtered.map(d => <Row key={d.id} d={d} onOpen={setDrawer} />)
              )}
            </tbody>
          </table>

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/40">
              <p className="text-xs text-gray-400"><span className="font-bold text-gray-600">{filtered.length}</span> résultat{filtered.length > 1 ? "s" : ""}{filtered.length !== demandes.length && <span className="text-gray-300"> / {demandes.length}</span>}</p>
              <p className="text-xs text-gray-400">Cliquer sur une ligne pour voir le détail</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}