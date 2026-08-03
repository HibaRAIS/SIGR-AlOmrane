"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Plus,
  MapPin,
  Package,
  Edit,
  Trash2,
  Warehouse,
  Grid3X3,
  Layers,
  Search,
  X,
  Check,
  AlertTriangle,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Eye,
  Info,
} from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

/* ──────────────────────────── TYPES ──────────────────────────── */
export interface Emplacement {
  id: string;
  code: string;
  description?: string;
}

export interface Rayon {
  id: string;
  code: string;
  nom: string;
  emplacements: Emplacement[];
  articlesCount: number; // nombre d’articles stockés dans ce rayon
}

/* ──────────────────────── DONNÉES INITIALES ──────────────────────── */
const EMPLACEMENTS_INITIAUX: Record<string, Emplacement[]> = {
  "R-01": [
    { id: "e1", code: "A-01" },
    { id: "e2", code: "A-02" },
    { id: "e3", code: "A-03" },
    { id: "e4", code: "A-04" },
    { id: "e5", code: "A-05" },
    { id: "e6", code: "A-06" },
    { id: "e7", code: "A-07" },
    { id: "e8", code: "A-08" },
    { id: "e9", code: "A-09" },
    { id: "e10", code: "A-10" },
    { id: "e11", code: "A-11" },
    { id: "e12", code: "A-12" },
  ],
  "R-02": [
    { id: "e13", code: "B-01" },
    { id: "e14", code: "B-02" },
    { id: "e15", code: "B-03" },
    { id: "e16", code: "B-04" },
    { id: "e17", code: "B-05" },
    { id: "e18", code: "B-06" },
    { id: "e19", code: "B-07" },
    { id: "e20", code: "B-08" },
  ],
  "R-03": [
    { id: "e21", code: "EXT-01" },
    { id: "e22", code: "EXT-02" },
    { id: "e23", code: "EXT-03" },
    { id: "e24", code: "EXT-04" },
  ],
  "R-04": [
    { id: "e25", code: "C-01" },
    { id: "e26", code: "C-02" },
    { id: "e27", code: "C-03" },
    { id: "e28", code: "C-04" },
    { id: "e29", code: "C-05" },
    { id: "e30", code: "C-06" },
    { id: "e31", code: "C-07" },
    { id: "e32", code: "C-08" },
    { id: "e33", code: "C-09" },
    { id: "e34", code: "C-10" },
  ],
  "R-05": [
    { id: "e35", code: "D-01" },
    { id: "e36", code: "D-02" },
    { id: "e37", code: "D-03" },
    { id: "e38", code: "D-04" },
    { id: "e39", code: "D-05" },
    { id: "e40", code: "D-06" },
  ],
  "R-06": [
    { id: "e41", code: "E-01" },
    { id: "e42", code: "E-02" },
    { id: "e43", code: "E-03" },
    { id: "e44", code: "E-04" },
  ],
};

const RAYONS_INITIAUX: Rayon[] = [
  { id: "r1", code: "R-01", nom: "Ciments & Liants", emplacements: EMPLACEMENTS_INITIAUX["R-01"] ?? [], articlesCount: 8 },
  { id: "r2", code: "R-02", nom: "Métaux & Aciers", emplacements: EMPLACEMENTS_INITIAUX["R-02"] ?? [], articlesCount: 12 },
  { id: "r3", code: "R-03", nom: "Agrégats", emplacements: EMPLACEMENTS_INITIAUX["R-03"] ?? [], articlesCount: 5 },
  { id: "r4", code: "R-04", nom: "Peintures & Revêtements", emplacements: EMPLACEMENTS_INITIAUX["R-04"] ?? [], articlesCount: 15 },
  { id: "r5", code: "R-05", nom: "Plomberie & Sanitaire", emplacements: EMPLACEMENTS_INITIAUX["R-05"] ?? [], articlesCount: 18 },
  { id: "r6", code: "R-06", nom: "Électricité", emplacements: EMPLACEMENTS_INITIAUX["R-06"] ?? [], articlesCount: 22 },
];

/* ──────────────────────────── HELPERS ──────────────────────────── */
const getCapaciteStyle = (capacite: number) => {
  if (capacite >= 80) return "text-red-700 bg-red-50";
  if (capacite >= 60) return "text-[#E65100] bg-[#FFF3E0]";
  return "text-[#1D6F42] bg-[#E8F5E9]";
};

const calcCapacite = (rayon: Rayon): number => {
  if (rayon.emplacements.length === 0) return 0;
  return Math.round((rayon.articlesCount / rayon.emplacements.length) * 100);
};

/* ──────────────────────── UTILITAIRES PORTAL ──────────────────────── */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, cb]);
}

function getSmartPosition(triggerEl: HTMLElement, dropdownWidth: number) {
  const rect = triggerEl.getBoundingClientRect();
  const dialog = triggerEl.closest('[role="dialog"]');
  if (dialog) {
    const dRect = dialog.getBoundingClientRect();
    let left = rect.left - dRect.left;
    if (rect.left + dropdownWidth > window.innerWidth) {
      left -= rect.left + dropdownWidth - window.innerWidth + 16;
    }
    return {
      target: dialog,
      style: {
        position: "absolute" as const,
        top: rect.bottom - dRect.top + 4,
        left,
        width: rect.width,
      },
    };
  } else {
    let left = rect.left;
    if (rect.left + dropdownWidth > window.innerWidth) {
      left -= rect.left + dropdownWidth - window.innerWidth + 16;
    }
    return {
      target: document.body,
      style: {
        position: "fixed" as const,
        top: rect.bottom + 4,
        left,
        width: rect.width,
      },
    };
  }
}

/* ──────────────────────── COMPOSANTS RÉUTILISABLES ──────────────────────── */
function SmartSelect({
  value,
  onChange,
  options,
  placeholder = "Sélectionner...",
  className,
  buttonClassName,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [portalConfig, setPortalConfig] = useState<{
    target: Element;
    style: any;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const openDropdown = () => {
    if (triggerRef.current) {
      setPortalConfig(getSmartPosition(triggerRef.current, 200));
      setOpen(true);
    }
  };

  const selectedLabel =
    options.find((o) => o.value === value)?.label || placeholder;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={cn(
          "w-full flex items-center justify-between px-3 rounded-xl border font-medium bg-white transition-colors outline-none",
          error ? "border-red-500" : "border-gray-200 hover:border-[#1D6F42] focus:border-[#1D6F42]",
          value ? "text-gray-900" : "text-gray-400",
          buttonClassName || "h-9 text-sm",
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && portalConfig && createPortal(
        <div
          ref={dropdownRef}
          style={{
            ...portalConfig.style,
            width: Math.max(portalConfig.style.width, 200),
            zIndex: 99999,
          }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-[#E8F5E9] transition-colors",
                value === opt.value
                  ? "font-bold text-[#1D6F42] bg-[#F1F8E9]"
                  : "text-gray-700",
              )}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && (
                <Check className="w-3.5 h-3.5 text-[#1D6F42] flex-shrink-0" />
              )}
            </button>
          ))}
        </div>,
        portalConfig.target,
      )}
    </div>
  );
}

/* ── Dialog de confirmation de suppression ── */
function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl border-red-100 [&>button.absolute]:hidden [&>button]:hidden">
        <DialogTitle className="sr-only">Confirmation suppression</DialogTitle>
        <DialogHeader>
          <DialogTitle className="text-red-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> {title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>
            Annuler
          </Button>
          <Button
            className="rounded-xl bg-red-600 text-white hover:bg-red-700"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────────────── COMPOSANT PRINCIPAL ──────────────────────── */
export default function RayonsPage() {
  /* ── ÉTAT ── */
  const [rayons, setRayons] = useState<Rayon[]>(RAYONS_INITIAUX);
  const [search, setSearch] = useState("");
  const [kpiFilter, setKpiFilter] = useState<"all" | "critique" | "attention" | "ok">("all");

  // Modals
  const [formRayonOpen, setFormRayonOpen] = useState(false);
  const [formEmplacementOpen, setFormEmplacementOpen] = useState(false);
  const [editRayon, setEditRayon] = useState<Rayon | null>(null);
  const [detailRayon, setDetailRayon] = useState<Rayon | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [rayonForm, setRayonForm] = useState({
    code: "",
    nom: "",
    articlesCount: 0,
  });
  const [emplacementForm, setEmplacementForm] = useState({
    code: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [targetRayonId, setTargetRayonId] = useState<string>("");

  /* ── DONNÉES CALCULÉES ── */
  const totalEmplacements = useMemo(
    () => rayons.reduce((sum, r) => sum + r.emplacements.length, 0),
    [rayons],
  );
  const totalArticles = useMemo(
    () => rayons.reduce((sum, r) => sum + r.articlesCount, 0),
    [rayons],
  );

  const statsCritique = rayons.filter((r) => calcCapacite(r) >= 80).length;
  const statsAttention = rayons.filter((r) => calcCapacite(r) >= 60 && calcCapacite(r) < 80).length;
  const statsOk = rayons.filter((r) => calcCapacite(r) < 60).length;

  // Filtres combinés
  const filtered = useMemo(() => {
    let res = [...rayons];
    const q = search.toLowerCase();
    if (q) {
      res = res.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.nom.toLowerCase().includes(q),
      );
    }
    if (kpiFilter === "critique") res = res.filter((r) => calcCapacite(r) >= 80);
    else if (kpiFilter === "attention") res = res.filter((r) => calcCapacite(r) >= 60 && calcCapacite(r) < 80);
    else if (kpiFilter === "ok") res = res.filter((r) => calcCapacite(r) < 60);
    return res;
  }, [rayons, search, kpiFilter]);

  /* ── GESTION DES RAYONS ── */
  const openRayonForm = (rayon?: Rayon) => {
    setFormErrors({});
    if (rayon) {
      setEditRayon(rayon);
      setRayonForm({
        code: rayon.code,
        nom: rayon.nom,
        articlesCount: rayon.articlesCount,
      });
    } else {
      setEditRayon(null);
      setRayonForm({ code: "", nom: "", articlesCount: 0 });
    }
    setFormRayonOpen(true);
  };

  const validateRayonForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!rayonForm.code.trim()) errs.code = "Code obligatoire";
    else {
      const exists = rayons.some(
        (r) => r.code === rayonForm.code.trim() && r.id !== editRayon?.id,
      );
      if (exists) errs.code = "Ce code de rayon existe déjà.";
    }
    if (!rayonForm.nom.trim()) errs.nom = "Nom obligatoire";
    if (rayonForm.articlesCount < 0) errs.articlesCount = "Valeur ≥ 0";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveRayon = () => {
    if (!validateRayonForm()) return;
    if (editRayon) {
      setRayons((prev) =>
        prev.map((r) =>
          r.id === editRayon.id
            ? { ...r, code: rayonForm.code.trim(), nom: rayonForm.nom.trim(), articlesCount: rayonForm.articlesCount }
            : r,
        ),
      );
      toast.success("Rayon modifié.");
    } else {
      const newRayon: Rayon = {
        id: `r-${Date.now()}`,
        code: rayonForm.code.trim(),
        nom: rayonForm.nom.trim(),
        articlesCount: rayonForm.articlesCount,
        emplacements: [],
      };
      setRayons((prev) => [...prev, newRayon]);
      toast.success(`Rayon ${newRayon.code} créé.`);
    }
    setFormRayonOpen(false);
  };

  const confirmDeleteRayon = (id: string) => setDeleteId(id);
  const deleteRayon = () => {
    if (!deleteId) return;
    setRayons((prev) => prev.filter((r) => r.id !== deleteId));
    toast.success("Rayon supprimé.");
    setDeleteId(null);
    if (detailRayon?.id === deleteId) setDetailRayon(null);
  };

  /* ── GESTION DES EMPLACEMENTS ── */
  const openEmplacementForm = (rayonId?: string) => {
    setFormErrors({});
    setEmplacementForm({ code: "", description: "" });
    setTargetRayonId(rayonId || "");
    setFormEmplacementOpen(true);
  };

  const validateEmplacementForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!emplacementForm.code.trim()) errs.code = "Code obligatoire";
    if (!targetRayonId) errs.rayon = "Sélectionnez un rayon";
    else {
      const rayon = rayons.find((r) => r.id === targetRayonId);
      if (rayon) {
        const duplicate = rayon.emplacements.some(
          (e) => e.code === emplacementForm.code.trim(),
        );
        if (duplicate) errs.code = "Cet emplacement existe déjà dans ce rayon.";
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveEmplacement = () => {
    if (!validateEmplacementForm()) return;
    const newEmp: Emplacement = {
      id: `e-${Date.now()}`,
      code: emplacementForm.code.trim(),
      description: emplacementForm.description.trim() || undefined,
    };
    setRayons((prev) =>
      prev.map((r) =>
        r.id === targetRayonId
          ? { ...r, emplacements: [...r.emplacements, newEmp] }
          : r,
      ),
    );
    toast.success("Emplacement ajouté.");
    setFormEmplacementOpen(false);
  };

  const deleteEmplacement = (rayonId: string, empId: string) => {
    setRayons((prev) =>
      prev.map((r) =>
        r.id === rayonId
          ? { ...r, emplacements: r.emplacements.filter((e) => e.id !== empId) }
          : r,
      ),
    );
    toast.success("Emplacement supprimé.");
  };

  /* ── RÉINITIALISER FILTRES ── */
  const resetFilters = () => {
    setSearch("");
    setKpiFilter("all");
  };
  const filtersActifs = search !== "" || kpiFilter !== "all";

  /* ── RENDU ── */
  return (
    <SidebarProvider>
      <SidebarInset>
        <main className="flex-1 space-y-6 p-4 md:p-6 min-h-screen bg-gray-50/30">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Rayons & Emplacements
              </h1>
              <p className="text-sm text-gray-500">
                Définir les zones de stockage et leurs emplacements.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {filtersActifs && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-1.5 transition-all"
                >
                  <X className="w-3 h-3" /> Réinitialiser
                </button>
              )}
              <Button
                onClick={() => openEmplacementForm()}
                variant="outline"
                className="h-9 gap-2 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-bold text-sm hover:bg-[#E8F5E9] hover:border-[#1D6F42] hover:text-[#1D6F42]"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline">Nouvel Emplacement</span>
              </Button>
              <Button
                onClick={() => openRayonForm()}
                className="h-9 gap-2 rounded-xl bg-[#1D6F42] text-white font-bold hover:bg-[#155430] shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nouveau Rayon</span>
              </Button>
            </div>
          </div>

          {/* Bannière magasin */}
          <div className="bg-[#E3F2FD] border-2 border-[#90CAF9] rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-sm flex-shrink-0">
              <Warehouse className="w-6 h-6 text-[#1565C0]" />
            </div>
            <div>
              <h3 className="font-bold text-[#0D47A1] mb-1">
                Magasin Principal - SIGR OMRANE Agadir
              </h3>
              <p className="text-sm text-[#1565C0]">
                Espace de stockage principal pour tous les articles et
                équipements.
              </p>
            </div>
          </div>

          {/* KPI cliquables */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setKpiFilter("all")}
              className={cn(
                "group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full",
                kpiFilter === "all"
                  ? "border-[#1D6F42] ring-2 ring-[#1D6F42]/20 shadow-md"
                  : "border-gray-100 hover:border-gray-200",
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#E3F2FD]">
                  <Layers className="w-5 h-5 text-[#1565C0]" />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900">{rayons.length}</div>
              <div className="text-[11px] font-medium text-gray-500">Rayons Totaux</div>
            </button>

            <button
              onClick={() => setKpiFilter("critique")}
              className={cn(
                "group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full",
                kpiFilter === "critique"
                  ? "border-red-500 ring-2 ring-red-200 shadow-md"
                  : "border-gray-100 hover:border-gray-200",
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-50">
                  <MapPin className="w-5 h-5 text-red-700" />
                </div>
              </div>
              <div className="text-xl font-bold text-red-700">{statsCritique}</div>
              <div className="text-[11px] font-medium text-gray-500">Occupation &gt; 80%</div>
            </button>

            <button
              onClick={() => setKpiFilter("attention")}
              className={cn(
                "group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full",
                kpiFilter === "attention"
                  ? "border-orange-500 ring-2 ring-orange-200 shadow-md"
                  : "border-gray-100 hover:border-gray-200",
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#FFF3E0]">
                  <MapPin className="w-5 h-5 text-[#E65100]" />
                </div>
              </div>
              <div className="text-xl font-bold text-[#E65100]">{statsAttention}</div>
              <div className="text-[11px] font-medium text-gray-500">Occupation 60-80%</div>
            </button>

            <button
              onClick={() => setKpiFilter("ok")}
              className={cn(
                "group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full",
                kpiFilter === "ok"
                  ? "border-emerald-500 ring-2 ring-emerald-200 shadow-md"
                  : "border-gray-100 hover:border-gray-200",
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#E8F5E9]">
                  <Package className="w-5 h-5 text-[#1D6F42]" />
                </div>
              </div>
              <div className="text-xl font-bold text-[#1D6F42]">{statsOk}</div>
              <div className="text-[11px] font-medium text-gray-500">Occupation &lt; 60%</div>
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              placeholder="Rechercher un rayon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-[#1D6F42] focus:ring-1 focus:ring-[#1D6F42]/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Grille des rayons */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package className="w-12 h-12 mb-4" />
              <p className="text-sm font-semibold">Aucun rayon trouvé</p>
              <p className="text-xs">Modifiez vos filtres ou créez un nouveau rayon.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((rayon) => {
                const cap = calcCapacite(rayon);
                return (
                  <div
                    key={rayon.id}
                    className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
                    onClick={() => setDetailRayon(rayon)}
                  >
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <MapPin className="h-5 w-5 text-[#1565C0]" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{rayon.code}</h3>
                          <p className="text-xs text-gray-500 font-medium">{rayon.nom}</p>
                        </div>
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1.5 text-gray-400 hover:text-[#E65100] hover:bg-[#FFF3E0] rounded-lg transition-colors"
                          onClick={() => openRayonForm(rayon)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          onClick={() => confirmDeleteRayon(rayon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-5">
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{rayon.emplacements.length}</p>
                          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Emplacements</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-gray-900">{rayon.articlesCount}</p>
                          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Articles</p>
                        </div>
                        <div className="text-center">
                          <div
                            className={cn(
                              "inline-flex items-center justify-center px-2 py-1 rounded-lg text-sm font-bold",
                              getCapaciteStyle(cap),
                            )}
                          >
                            {cap}%
                          </div>
                          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mt-1">Capacité</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-4 mt-auto">
                        <p className="text-xs font-semibold text-gray-600 mb-2.5 flex items-center gap-1.5">
                          <Grid3X3 className="w-3.5 h-3.5" />
                          Aperçu des emplacements
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {rayon.emplacements.slice(0, 8).map((emp) => (
                            <Badge key={emp.id} variant="outline" className="text-xs font-medium bg-gray-50 text-gray-600 border-gray-200">
                              {emp.code}
                            </Badge>
                          ))}
                          {rayon.emplacements.length > 8 && (
                            <Badge variant="secondary" className="text-xs font-medium bg-gray-100 text-gray-600 border-0">
                              +{rayon.emplacements.length - 8}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan du magasin (interactif) */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden mt-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-[#1565C0]" />
                Plan du Magasin
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Cliquez sur un rayon pour voir ses détails
              </p>
            </div>
            <div className="p-6 bg-gray-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 min-h-[200px]">
                {rayons.map((rayon) => {
                  const cap = calcCapacite(rayon);
                  return (
                    <button
                      key={rayon.id}
                      onClick={() => setDetailRayon(rayon)}
                      className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-[#1D6F42] hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Package className="h-5 w-5 text-[#1D6F42]" />
                      </div>
                      <p className="font-bold text-sm text-gray-900">{rayon.code}</p>
                      <p className="text-[10px] text-gray-500 font-medium line-clamp-1 mb-2">
                        {rayon.nom}
                      </p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "mt-auto text-[10px] px-2 py-0.5 border-0 font-bold",
                          getCapaciteStyle(cap),
                        )}
                      >
                        {cap}% plein
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── MODALS ─── */}
          {/* Détail rayon */}
          {detailRayon && (
            <Dialog open onOpenChange={(o) => !o && setDetailRayon(null)}>
              <DialogContent className="sm:max-w-3xl p-0 rounded-3xl border-0 shadow-2xl max-h-[90vh] flex flex-col [&>button.absolute]:hidden [&>button]:hidden">
                <DialogTitle className="sr-only">
                  Détail rayon {detailRayon.code}
                </DialogTitle>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white rounded-t-3xl flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#E3F2FD] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#1565C0]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {detailRayon.code} — {detailRayon.nom}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {detailRayon.emplacements.length} emplacement(s) ·{" "}
                        {detailRayon.articlesCount} article(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEmplacementForm(detailRayon.id)}
                      className="h-8 gap-1 rounded-lg text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter
                    </Button>
                    <button
                      onClick={() => setDetailRayon(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                  {detailRayon.emplacements.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-8">
                      Aucun emplacement défini pour ce rayon.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailRayon.emplacements.map((emp) => (
                        <div
                          key={emp.id}
                          className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {emp.code}
                            </p>
                            {emp.description && (
                              <p className="text-xs text-gray-500">
                                {emp.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              deleteEmplacement(detailRayon.id, emp.id)
                            }
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Formulaire Rayon */}
          <Dialog open={formRayonOpen} onOpenChange={setFormRayonOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl [&>button.absolute]:hidden [&>button]:hidden">
              <DialogTitle className="sr-only">
                {editRayon ? "Modifier le rayon" : "Créer un rayon"}
              </DialogTitle>
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-bold">
                  {editRayon ? "Modifier le rayon" : "Créer un nouveau rayon"}
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm">
                  {editRayon
                    ? `Modifiez les informations de ${editRayon.code}.`
                    : "Définissez une nouvelle zone de stockage."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">
                    Code *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      value={rayonForm.code}
                      onChange={(e) =>
                        setRayonForm((p) => ({ ...p, code: e.target.value }))
                      }
                      placeholder="Ex: R-07"
                      className={cn(
                        "rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]",
                        formErrors.code && "border-red-500",
                      )}
                    />
                    {formErrors.code && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">
                    Nom *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      value={rayonForm.nom}
                      onChange={(e) =>
                        setRayonForm((p) => ({ ...p, nom: e.target.value }))
                      }
                      placeholder="Ex: Menuiserie"
                      className={cn(
                        "rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]",
                        formErrors.nom && "border-red-500",
                      )}
                    />
                    {formErrors.nom && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.nom}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">
                    Nb articles
                  </Label>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min={0}
                      value={rayonForm.articlesCount}
                      onChange={(e) =>
                        setRayonForm((p) => ({
                          ...p,
                          articlesCount: Number(e.target.value),
                        }))
                      }
                      className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200"
                  onClick={() => setFormRayonOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430]"
                  onClick={saveRayon}
                >
                  {editRayon ? "Enregistrer" : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Formulaire Emplacement */}
          <Dialog open={formEmplacementOpen} onOpenChange={setFormEmplacementOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl [&>button.absolute]:hidden [&>button]:hidden">
              <DialogTitle className="sr-only">Ajouter un emplacement</DialogTitle>
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-bold">
                  Ajouter un Emplacement
                </DialogTitle>
                <DialogDescription className="text-gray-500 text-sm">
                  Créer un nouvel emplacement dans un rayon existant.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">
                    Rayon *
                  </Label>
                  <div className="col-span-3">
                    <SmartSelect
                      value={targetRayonId}
                      onChange={setTargetRayonId}
                      options={rayons.map((r) => ({
                        value: r.id,
                        label: `${r.code} - ${r.nom}`,
                      }))}
                      placeholder="Sélectionner un rayon"
                      error={!!formErrors.rayon}
                    />
                    {formErrors.rayon && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.rayon}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">
                    Code *
                  </Label>
                  <div className="col-span-3">
                    <Input
                      value={emplacementForm.code}
                      onChange={(e) =>
                        setEmplacementForm((p) => ({
                          ...p,
                          code: e.target.value,
                        }))
                      }
                      placeholder="Ex: A-13"
                      className={cn(
                        "rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]",
                        formErrors.code && "border-red-500",
                      )}
                    />
                    {formErrors.code && (
                      <p className="text-xs text-red-500 mt-1">
                        {formErrors.code}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Input
                    value={emplacementForm.description}
                    onChange={(e) =>
                      setEmplacementForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    placeholder="Optionnelle"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl border-gray-200"
                  onClick={() => setFormEmplacementOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430]"
                  onClick={saveEmplacement}
                >
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirmation suppression rayon */}
          <ConfirmDeleteDialog
            open={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={deleteRayon}
            title="Supprimer le rayon ?"
            message={`Cette action est irréversible. Les emplacements associés seront également perdus.`}
          />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}