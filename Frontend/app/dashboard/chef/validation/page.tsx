"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2, XCircle, SlidersHorizontal, MessageSquare,
  ChevronDown, ChevronUp, Search, Filter, Clock,
  Calendar, Package, Minus, Plus,
  ClipboardCheck, X, Check, FileText, Info, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { demandeService } from "@/services/demande.service";
import { DemandeResponse, LigneResponse } from "@/types/demande";

type PrioriteBackend = "NORMAL" | "URGENT" | "CRITIQUE";
type StatutBackend = "EN_VALIDATION" | "VALIDEE" | "REFUSEE" | "EN_PREPARATION" | "LIVREE";

const PRIORITE_CONFIG: Record<PrioriteBackend, { label: string; color: string; bg: string; dot: string }> = {
  NORMAL:   { label: "Normale",  color: "text-slate-600",  bg: "bg-slate-50 border border-slate-200",  dot: "bg-slate-400"  },
  URGENT:   { label: "Urgente",  color: "text-amber-700",  bg: "bg-amber-50 border border-amber-200",  dot: "bg-amber-400"  },
  CRITIQUE: { label: "Critique", color: "text-red-700",    bg: "bg-red-50 border border-red-200",      dot: "bg-red-500"    },
};

const AL_OMRANE_GREEN = "#004d2c";

type ModalType = "approuver" | "rejeter" | "ajuster" | "annoter" | null;

interface ModalState {
  type: ModalType;
  demande: DemandeResponse | null;
  lignes?: LigneResponse[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL D'ACTION (APPROUVER, REJETER, AJUSTER, ANNOTER)
// ─────────────────────────────────────────────────────────────────────────────
function ActionModal({
  modal,
  onClose,
  onConfirm,
}: {
  modal: ModalState;
  onClose: () => void;
  onConfirm: (data: Record<string, unknown>) => void;
}) {
  const [motif, setMotif] = useState("");
  const [annotation, setAnnotation] = useState(modal.demande?.annotation ?? "");
  const [lignes, setLignes] = useState<LigneResponse[]>(modal.lignes ?? []);

  useEffect(() => {
    if (modal.demande) {
      setLignes(modal.demande.lignes.map(l => ({ ...l })));
      setAnnotation(modal.demande.annotation ?? "");
    }
  }, [modal.demande]);

  if (!modal.type || !modal.demande) return null;

  const adjustQty = (ligneId: number, delta: number) => {
    setLignes(prev => prev.map(l =>
      l.ligneId === ligneId
        ? { ...l, quantiteAccordee: Math.max(0, Math.min(l.quantiteDemandee, l.quantiteAccordee + delta)) }
        : l
    ));
  };

  const configs = {
    approuver: { title: "Approuver la demande", icon: CheckCircle2, iconColor: "text-green-600", confirmLabel: "Confirmer l'approbation", confirmColor: "bg-[#004d2c]" },
    rejeter:   { title: "Rejeter la demande",   icon: XCircle,        iconColor: "text-red-600",   confirmLabel: "Confirmer le rejet",       confirmColor: "bg-red-600" },
    ajuster:   { title: "Ajuster les quantités", icon: SlidersHorizontal, iconColor: "text-blue-600", confirmLabel: "Enregistrer les ajustements", confirmColor: "bg-blue-600" },
    annoter:   { title: "Annotation magasinier", icon: MessageSquare,    iconColor: "text-indigo-600", confirmLabel: "Enregistrer l'annotation", confirmColor: "bg-indigo-600" },
  };
  const cfg = configs[modal.type];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className={cn("p-2 rounded-xl bg-gray-50", cfg.iconColor)}><Icon className="w-5 h-5" /></div>
          <div className="flex-1"><h3 className="text-base font-semibold">{cfg.title}</h3><p className="text-xs text-gray-500">{modal.demande.numeroDemande} · {modal.demande.employeNom}</p></div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {modal.type === "approuver" && (
            <div className="rounded-xl bg-green-50 border border-green-100 p-4">
              <p className="text-sm text-green-800 font-medium">Articles à approuver</p>
              <ul className="mt-3 space-y-2">
                {modal.demande.lignes.map(l => (
                  <li key={l.ligneId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{l.produitDesignation}</span>
                    <span className="font-semibold text-green-700">{l.quantiteAccordee}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {modal.type === "rejeter" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Motif de rejet <span className="text-red-500">*</span></label>
              <textarea value={motif} onChange={e=>setMotif(e.target.value)} rows={4} className="w-full text-sm border rounded-xl p-3" placeholder="Expliquez la raison..." />
            </div>
          )}
          {modal.type === "ajuster" && (
            <div className="space-y-3">
              {lignes.map(l => (
                <div key={l.ligneId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="flex-1 text-sm">{l.produitDesignation}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>adjustQty(l.ligneId,-1)} className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center"><Minus className="w-3 h-3"/></button>
                    <span className="w-12 text-center text-sm font-semibold">{l.quantiteAccordee}<span className="text-[10px] text-gray-400">/{l.quantiteDemandee}</span></span>
                    <button onClick={()=>adjustQty(l.ligneId,+1)} className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center"><Plus className="w-3 h-3"/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {modal.type === "annoter" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message pour le magasinier</label>
              <textarea value={annotation} onChange={e=>setAnnotation(e.target.value)} rows={4} className="w-full text-sm border rounded-xl p-3" placeholder="Ex : Livrer au bureau 204..." />
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border bg-white">Annuler</button>
          <button onClick={()=>onConfirm({type:modal.type, demandeId:modal.demande!.id, motif, annotation, lignes})} disabled={modal.type==="rejeter" && motif.length<5} className={cn("flex-1 py-2.5 rounded-xl text-white", cfg.confirmColor)}>{cfg.confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE DÉTAILS
// ─────────────────────────────────────────────────────────────────────────────
function DetailsModal({
  demande,
  open,
  onClose,
}: {
  demande: DemandeResponse | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!demande) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden">
        <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between rounded-t-xl">
          <h2 className="text-sm font-semibold text-gray-800">Détails de la demande</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Référence et statut */}
          <div className="flex justify-between items-start">
            <div className="bg-gray-50 px-3 py-1.5 rounded-md">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Référence</p>
              <p className="font-mono font-medium text-sm">{demande.numeroDemande}</p>
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium shadow-sm", {
              "bg-amber-100 text-amber-700": demande.statut === "EN_VALIDATION",
              "bg-green-100 text-green-700": demande.statut === "VALIDEE",
              "bg-red-100 text-red-700": demande.statut === "REFUSEE",
              "bg-blue-100 text-blue-700": demande.statut === "EN_PREPARATION",
              "bg-gray-100 text-gray-700": demande.statut === "LIVREE",
            })}>
              {demande.statut === "EN_VALIDATION" ? "En attente" :
               demande.statut === "VALIDEE" ? "Approuvée" :
               demande.statut === "REFUSEE" ? "Rejetée" :
               demande.statut === "EN_PREPARATION" ? "En préparation" : "Livrée"}
            </span>
          </div>
          {/* Demandeur */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <User className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-[10px] text-blue-600 uppercase tracking-wider">Demandeur</p>
              <p className="text-sm font-medium text-gray-800">{demande.employeNom}</p>
              <p className="text-xs text-gray-600">{demande.structureNom}</p>
            </div>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Soumission</p>
              <p className="text-sm font-medium">{new Date(demande.dateDemande).toLocaleDateString("fr-FR")}</p>
            </div>
            {demande.dateValidation && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Validation</p>
                <p className="text-sm font-medium">{new Date(demande.dateValidation).toLocaleDateString("fr-FR")}</p>
              </div>
            )}
          </div>
          {/* Justification */}
          {demande.motif && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-1 mb-1">
                <FileText className="w-3 h-3 text-amber-600" />
                <p className="text-[10px] font-medium text-amber-700 uppercase tracking-wider">Justification</p>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{demande.motif}</p>
            </div>
          )}
          {/* Articles */}
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Package className="w-3 h-3 text-[#1D6F42]" />
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Articles</p>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Article</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Demandé</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Accordé</th>
                  </tr>
                </thead>
                <tbody>
                  {demande.lignes.map(l => (
                    <tr key={l.ligneId} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{l.produitDesignation}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-600">{l.quantiteDemandee}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[#1D6F42]">{l.quantiteAccordee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Validateur */}
          {demande.validePar && demande.validePar !== "Non encore validée" && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-green-600 uppercase tracking-wider">Validé par</p>
                <p className="text-sm font-medium text-gray-800">{demande.validePar}</p>
              </div>
            </div>
          )}
          {/* Annotation */}
          {demande.annotation && (
            <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <MessageSquare className="w-4 h-4 text-indigo-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-indigo-600 uppercase tracking-wider">Annotation magasinier</p>
                <p className="text-xs text-indigo-800">{demande.annotation}</p>
              </div>
            </div>
          )}
          {/* Motif de rejet */}
          {demande.motifRefus && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
              <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-red-600 uppercase tracking-wider">Motif du rejet</p>
                <p className="text-xs text-red-800">{demande.motifRefus}</p>
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-gray-50 border-t px-5 py-3 flex justify-end rounded-b-xl">
          <Button variant="outline" size="sm" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARTE D'UNE DEMANDE (inchangée)
// ─────────────────────────────────────────────────────────────────────────────
function DemandeCard({ demande, onAction, onOpenDetails }: { 
  demande: DemandeResponse; 
  onAction: (type: ModalType, demande: DemandeResponse, lignes?: LigneResponse[]) => void;
  onOpenDetails: (demande: DemandeResponse) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const pCfg = PRIORITE_CONFIG[demande.priorite as PrioriteBackend];
  const enAttente = demande.statut === "EN_VALIDATION";
  const initiales = demande.employeNom?.substring(0,2).toUpperCase() ?? "??";

  return (
    <div className={cn("bg-white rounded-2xl border transition-all", enAttente ? "border-gray-200 shadow-sm hover:shadow-md" : "border-gray-100 opacity-80")}>
      <div className={cn("h-1 rounded-t-2xl", demande.priorite==="CRITIQUE"?"bg-red-500":demande.priorite==="URGENT"?"bg-amber-400":"bg-slate-300")} />
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1D6F42] flex items-center justify-center font-bold text-white">{initiales}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-semibold">{demande.employeNom}</span><span className="text-xs text-gray-400">·</span><span className="text-xs text-gray-500">{demande.structureNom}</span></div>
            <div className="flex items-center gap-2 mt-1"><span className="text-xs font-mono text-gray-400">{demande.numeroDemande}</span><Calendar className="w-3 h-3 text-gray-300"/><span className="text-xs text-gray-400">{new Date(demande.dateDemande).toLocaleDateString("fr-FR")}</span></div>
          </div>
          <div className="flex items-center gap-2"><span className={cn("flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", pCfg.bg, pCfg.color)}><span className={cn("w-1.5 h-1.5 rounded-full", pCfg.dot)} />{pCfg.label}</span></div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500">{demande.lignes.length} article(s) — <span className="font-medium">{demande.lignes.slice(0,2).map(l=>l.produitDesignation).join(", ")}{demande.lignes.length>2 && ` +${demande.lignes.length-2} autres`}</span></span>
          <button onClick={()=>setExpanded(v=>!v)} className="ml-auto text-[11px] text-gray-400 hover:text-gray-600">{expanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}</button>
        </div>
      </div>
      {expanded && (
        <div className="mx-5 mb-3 rounded-xl bg-gray-50 border overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b"><th className="text-left px-4 py-2">Article</th><th className="text-right px-4 py-2">Demandé</th><th className="text-right px-4 py-2">Accordé</th></tr></thead>
            <tbody>
              {demande.lignes.map(l=>(
                <tr key={l.ligneId}>
                  <td className="px-4 py-2.5">{l.produitDesignation}</td>
                  <td className="px-4 py-2.5 text-right">{l.quantiteDemandee}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{l.quantiteAccordee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {demande.motif && <div className="mx-5 mb-3 px-3 py-2 rounded-xl bg-gray-50"><p className="text-xs"><span className="font-medium">Justification : </span>{demande.motif}</p></div>}
      {demande.motifRefus && <div className="mx-5 mb-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50"><XCircle className="w-3.5 h-3.5 text-red-500"/><p className="text-xs text-red-700">{demande.motifRefus}</p></div>}
      {demande.annotation && <div className="mx-5 mb-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-indigo-50"><MessageSquare className="w-3.5 h-3.5 text-indigo-500"/><p className="text-xs text-indigo-700">{demande.annotation}</p></div>}
      {enAttente && (
        <div className="flex items-center gap-2 px-5 py-3 border-t">
          <button onClick={() => onOpenDetails(demande)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"><Info className="w-3.5 h-3.5" /> Détails</button>
          <button onClick={() => onAction("approuver", demande)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"><Check className="w-3.5 h-3.5" /> Approuver</button>
          <button onClick={() => onAction("ajuster", demande, demande.lignes)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"><SlidersHorizontal className="w-3.5 h-3.5" /> Ajuster</button>
          <button onClick={() => onAction("annoter", demande)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"><MessageSquare className="w-3.5 h-3.5" /> Annoter</button>
          <button onClick={() => onAction("rejeter", demande)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 ml-auto"><X className="w-3.5 h-3.5" /> Rejeter</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE AVEC BANDES STATISTIQUES PAR PRIORITÉ
// ─────────────────────────────────────────────────────────────────────────────
export default function FileValidationPage() {
  const [demandes, setDemandes] = useState<DemandeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: null, demande: null });
  const [detailsDemande, setDetailsDemande] = useState<DemandeResponse | null>(null);
  const [search, setSearch] = useState("");
  const [filtrePriorite, setFiltrePriorite] = useState<string>("toutes");
  const [filtreDateDebut, setFiltreDateDebut] = useState("");
  const [filtreDateFin, setFiltreDateFin] = useState("");

  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const data = await demandeService.getDemandesAValider();
      setDemandes(data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Calcul des statistiques par priorité
  const stats = useMemo(() => {
    const totals = { total: demandes.length, NORMAL: 0, URGENT: 0, CRITIQUE: 0 };
    demandes.forEach(d => {
      if (d.priorite === "NORMAL") totals.NORMAL++;
      else if (d.priorite === "URGENT") totals.URGENT++;
      else if (d.priorite === "CRITIQUE") totals.CRITIQUE++;
    });
    return totals;
  }, [demandes]);

  // Filtrage des demandes
  const filtered = demandes.filter(d => {
    if (filtrePriorite !== "toutes" && d.priorite !== filtrePriorite) return false;
    if (search && !d.numeroDemande.toLowerCase().includes(search.toLowerCase()) && !d.employeNom.toLowerCase().includes(search.toLowerCase())) return false;
    const date = new Date(d.dateDemande);
    if (filtreDateDebut && date < new Date(filtreDateDebut)) return false;
    if (filtreDateFin && date > new Date(filtreDateFin)) return false;
    return true;
  });

  const handleAction = async (data: Record<string, unknown>) => {
    const { type, demandeId, motif, annotation, lignes } = data;
    try {
      if (type === "approuver") {
        await demandeService.approuver(demandeId as number);
        toast.success("Demande approuvée avec succès");
      } else if (type === "rejeter") {
        await demandeService.rejeter(demandeId as number, motif as string);
        toast.success("Demande rejetée");
      } else if (type === "ajuster") {
        const payload = (lignes as LigneResponse[]).map(l => ({ ligneId: l.ligneId, quantiteAccordee: l.quantiteAccordee }));
        await demandeService.ajuster(demandeId as number, payload);
        toast.success("Quantités ajustées avec succès");
      } else if (type === "annoter") {
        await demandeService.annoter(demandeId as number, annotation as string);
        toast.success("Annotation enregistrée");
      }
      await fetchDemandes(); // rechargement après succès
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Veuillez réessayer";
      toast.error(`Erreur : ${message}`);
    } finally {
      setModal({ type: null, demande: null });
    }
  };

  return (
    <>
      {modal.type && <ActionModal modal={modal} onClose={() => setModal({ type: null, demande: null })} onConfirm={handleAction} />}
      <DetailsModal demande={detailsDemande} open={!!detailsDemande} onClose={() => setDetailsDemande(null)} />

      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" style={{ color: AL_OMRANE_GREEN }} />
              <h1 className="text-xl font-bold">File de Validation</h1>
            </div>
            <p className="text-sm text-gray-500">Demandes en attente de validation</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
            <Clock className="w-4 h-4 text-amber-600 inline mr-2" />
            <span className="text-sm font-semibold text-amber-700">{demandes.length} en attente</span>
          </div>
        </div>

        {/* Bandes statistiques par priorité (comme dans DemandesEquipePage) */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { key: "toutes", label: "Toutes", color: "#374151", bg: "#f9fafb", border: "#e5e7eb" },
            { key: "NORMAL", label: "Normale", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
            { key: "URGENT", label: "Urgente", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
            { key: "CRITIQUE", label: "Critique", color: "#dc2626", bg: "#fff1f2", border: "#fecdd3" },
          ].map(prio => {
            const val = prio.key === "toutes" ? stats.total : stats[prio.key as keyof typeof stats] || 0;
            const active = filtrePriorite === prio.key;
            return (
              <button
                key={prio.key}
                onClick={() => setFiltrePriorite(prio.key)}
                className={cn(
                  "rounded-xl px-3 py-3 text-center border transition-all duration-150 hover:scale-[1.02] active:scale-[.98]",
                  active && "shadow-md scale-[1.02]"
                )}
                style={{
                  background: prio.bg,
                  borderColor: active ? prio.color + "60" : prio.border,
                  boxShadow: active ? `0 0 0 2px ${prio.color}25` : undefined,
                }}
              >
                <p className="text-xl font-extrabold tabular-nums" style={{ color: prio.color }}>{val}</p>
                <p className="text-[10px] font-semibold text-gray-400 mt-0.5 leading-tight">{prio.label}</p>
              </button>
            );
          })}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-2xl border p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par référence ou demandeur..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            {/* Les boutons de priorité sont déjà dans les bandes, mais on garde un petit rappel optionnel */}
            <div className="w-px h-4 bg-gray-200" />
            <input type="date" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} className="text-xs border rounded-lg px-2 py-1" placeholder="Début" />
            <span>-</span>
            <input type="date" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} className="text-xs border rounded-lg px-2 py-1" placeholder="Fin" />
            {(search || filtrePriorite !== "toutes" || filtreDateDebut || filtreDateFin) && (
              <button onClick={() => { setSearch(""); setFiltrePriorite("toutes"); setFiltreDateDebut(""); setFiltreDateFin(""); }} className="ml-auto text-[11px] text-gray-400">
                <X className="w-3 h-3 inline" /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {loading ? (
            <p className="col-span-full text-center py-16">Chargement...</p>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3" />
              <p>Aucune demande en attente</p>
            </div>
          ) : (
            filtered.map(d => (
              <DemandeCard
                key={d.id}
                demande={d}
                onAction={(type, dem, lignes) => setModal({ type, demande: dem, lignes })}
                onOpenDetails={dem => setDetailsDemande(dem)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}