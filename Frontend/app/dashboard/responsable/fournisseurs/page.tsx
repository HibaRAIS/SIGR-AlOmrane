"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  SidebarProvider,
  SidebarInset
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from '@/lib/utils';
import {
  Plus, Search, Eye, Edit, Trash2, X, Phone, Mail,
  MapPin, CheckCircle, XCircle, Download, FileSpreadsheet,
  FileText, List, Grid3X3, RefreshCw, AlertTriangle, Building2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  UploadCloud, Check, Info, FileDigit, Briefcase, Loader2
} from 'lucide-react';

// Imports pour les exports
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Import de notre service et types
import { fournisseurService } from '@/services/fournisseur.service';
import type { Fournisseur, CreateFournisseurDTO, UpdateFournisseurDTO } from '@/types/fournisseur';

// ─── Regex de validation ────────────────────────────────────────────────
const REGEX_PHONE = /^(?:\+212|0)[5-7]\d{8}$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_ICE = /^\d{15}$/;

// ─── KPI CARD ────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, colorClass, bgClass, onClick, active }: {
  label: string; value: string | number; icon: React.ElementType; colorClass: string; bgClass: string; onClick?: () => void; active?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl border-2 p-5 transition-all duration-200 group flex-1 min-w-[200px]",
        onClick ? "cursor-pointer hover:shadow-md" : "",
        active ? `border-[#1D6F42] shadow-sm` : "border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", bgClass)}>
          <Icon className={cn("w-6 h-6", colorClass)} />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 mb-0.5 tracking-tight">{value}</div>
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
    </div>
  );
}

// ─── MODAL DÉTAILS ──────────────────────────────────────────────────────
function FournisseurDetailModal({ fournisseur, onClose }: { fournisseur: Fournisseur; onClose: () => void }) {
  return (
    <div className="flex flex-col w-full h-full max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl">
      <DialogTitle className="sr-only">Détails du fournisseur {fournisseur.raisonSociale}</DialogTitle>

      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-white z-10 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-[#1D6F42]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight truncate">{fournisseur.raisonSociale}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="outline" className="font-mono text-gray-500 border-gray-200 text-[10px] px-2 py-0 font-medium">{fournisseur.code}</Badge>
              {fournisseur.actif
                ? <Badge variant="outline" className="border-0 bg-[#E8F5E9] text-[#1D6F42] font-bold text-[10px] px-2 py-0">Actif</Badge>
                : <Badge variant="outline" className="border-0 bg-gray-100 text-gray-500 font-bold text-[10px] px-2 py-0">Inactif</Badge>
              }
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors text-gray-500 flex-shrink-0 absolute top-4 right-4 sm:relative sm:top-0 sm:right-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-gray-50/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><FileDigit className="w-4 h-4 text-gray-400"/> Identifiants légaux</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <span className="text-xs font-medium text-gray-500">ICE</span>
                <span className="text-sm font-bold text-gray-900 font-mono">{fournisseur.ice}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <span className="text-xs font-medium text-gray-500">Identifiant Fiscal (IF)</span>
                <span className="text-sm font-bold text-gray-900 font-mono">{fournisseur.identifiantFiscal || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Registre Com. (RC)</span>
                <span className="text-sm font-bold text-gray-900 font-mono">{fournisseur.registreCommerce || '—'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400"/> Coordonnées</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0"><Phone className="w-4 h-4 text-gray-500"/></div>
                <span className="text-sm font-medium text-gray-900">{fournisseur.telephone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0"><Mail className="w-4 h-4 text-gray-500"/></div>
                <span className="text-sm font-medium text-gray-900 break-all">{fournisseur.email || 'Non renseigné'}</span>
              </div>
              <div className="flex items-start gap-3 pt-1">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0"><MapPin className="w-4 h-4 text-gray-500"/></div>
                <div>
                  <span className="text-sm font-medium text-gray-900 block leading-snug">{fournisseur.adresse || 'Adresse non renseignée'}</span>
                  <span className="text-xs text-gray-500 mt-1 block">{fournisseur.ville}, {fournisseur.pays}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ─────────────────────────────────────────────────────
export default function FournisseursPage() {
  // Données provenant de l'API
  const [data, setData] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination & tri
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: keyof Fournisseur; direction: 'asc' | 'desc' } | null>(null);

  // Modales
  const [detailModal, setDetailModal] = useState<Fournisseur | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Fournisseur | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({ open: false, id: '', name: '' });

  // Formulaire
  const [formData, setFormData] = useState<Partial<CreateFournisseurDTO>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── CHARGEMENT INITIAL ─────────────────────────────────────────────────
  const fetchFournisseurs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fournisseurService.getAll();
      setData(response);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Erreur lors du chargement des fournisseurs';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFournisseurs();
  }, [fetchFournisseurs]);

  // ─── FILTRAGE & RECHERCHE ────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let res = data;
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(f =>
        f.raisonSociale.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        f.ice.includes(q)
      );
    }
    if (statusFilter === 'active') res = res.filter(f => f.actif);
    if (statusFilter === 'inactive') res = res.filter(f => !f.actif);
    return res;
  }, [data, search, statusFilter]);

  // ─── TRI ─────────────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal === bVal) return 0;
      const result = (aVal ?? '') < (bVal ?? '') ? -1 : 1;
      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [filteredData, sortConfig]);

  // ─── PAGINATION ──────────────────────────────────────────────────────────
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const handleSort = (key: keyof Fournisseur) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  // ─── STATISTIQUES ────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter(f => f.actif).length,
    inactive: data.filter(f => !f.actif).length,
  }), [data]);

  // ─── SÉLECTION ──────────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedData.map(f => f.id)));
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  // ─── OUVERTURE DU FORMULAIRE ────────────────────────────────────────────
  const handleOpenForm = (f?: Fournisseur) => {
    setFormErrors({});
    if (f) {
      setEditingProvider(f);
      setFormData({
        raisonSociale: f.raisonSociale,
        ice: f.ice,
        identifiantFiscal: f.identifiantFiscal,
        registreCommerce: f.registreCommerce,
        telephone: f.telephone,
        email: f.email,
        adresse: f.adresse,
        ville: f.ville,
        pays: f.pays,
        actif: f.actif,
      });
    } else {
      setEditingProvider(null);
      setFormData({
        raisonSociale: '',
        ice: '',
        identifiantFiscal: '',
        registreCommerce: '',
        telephone: '',
        email: '',
        adresse: '',
        ville: '',
        pays: 'Maroc',
        actif: true,
      });
    }
    setFormModalOpen(true);
  };

  // ─── VALIDATION ──────────────────────────────────────────────────────────
  const validateField = (field: keyof CreateFournisseurDTO, value: string) => {
    let error = '';
    switch (field) {
      case 'raisonSociale':
        if (!value.trim()) error = 'La raison sociale est requise.';
        break;
      case 'ice':
        if (!value.trim()) error = 'L\'ICE est requis.';
        else if (!REGEX_ICE.test(value)) error = 'L\'ICE doit comporter exactement 15 chiffres.';
        else {
          const duplicateIce = data.find(f => f.ice === value && f.id !== editingProvider?.id);
          if (duplicateIce) error = 'Cet ICE est déjà attribué à un autre fournisseur.';
        }
        break;
      case 'email':
        if (value && !REGEX_EMAIL.test(value)) error = 'Format d\'email invalide.';
        break;
      case 'telephone':
        if (value && !REGEX_PHONE.test(value.replace(/\s/g, ''))) error = 'Format invalide (ex: 0612345678 ou +2126...).';
        break;
    }

    setFormErrors(prev => {
      const next = { ...prev };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });

    return !error;
  };

  const handleChange = (field: keyof CreateFournisseurDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (typeof value === 'string') validateField(field, value);
  };

  // ─── SAUVEGARDE (CRÉATION/MODIFICATION) ─────────────────────────────────
  const handleSave = async () => {
    const isRaisonSocialeValid = validateField('raisonSociale', formData.raisonSociale || '');
    const isIceValid = validateField('ice', formData.ice || '');
    const isEmailValid = validateField('email', formData.email || '');
    const isPhoneValid = validateField('telephone', formData.telephone || '');

    if (!isRaisonSocialeValid || !isIceValid || !isEmailValid || !isPhoneValid) {
      toast.error('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProvider) {
        const updated = await fournisseurService.update(editingProvider.id, formData as UpdateFournisseurDTO);
        setData(prev => prev.map(f => f.id === editingProvider.id ? updated : f));
        toast.success('Fournisseur mis à jour');
      } else {
        const created = await fournisseurService.create(formData as CreateFournisseurDTO);
        setData(prev => [created, ...prev]);
        toast.success('Fournisseur ajouté avec succès');
      }
      setFormModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Erreur lors de l\'enregistrement';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── SUPPRESSION ────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    try {
      setSubmitting(true);
      if (deleteConfirm.id === '-1') {
        // Suppression multiple
        const idsToDelete = Array.from(selectedIds);
        await fournisseurService.bulkDelete(idsToDelete);
        setData(prev => prev.filter(f => !idsToDelete.includes(f.id)));
        setSelectedIds(new Set());
        toast.success(`${idsToDelete.length} fournisseurs supprimés.`);
      } else {
        // Suppression unique
        await fournisseurService.delete(deleteConfirm.id);
        setData(prev => prev.filter(f => f.id !== deleteConfirm.id));
        toast.success('Fournisseur supprimé');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Erreur lors de la suppression';
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setDeleteConfirm({ open: false, id: '', name: '' });
    }
  };

  // ─── EXPORTS ─────────────────────────────────────────────────────────────
  const getListToExport = () => {
    return selectedIds.size > 0 ? data.filter(f => selectedIds.has(f.id)) : sortedData;
  };

  const handleExportPDF = async () => {
    const list = getListToExport();
    if (list.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const logoUrl = "/images/alomrane-logo.png";

      let logoDataUrl = "";
      try {
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0);
        logoDataUrl = canvas.toDataURL("image/png");
      } catch (e) { /* fail silently */ }

      const addHeaderFooter = (currentPage: number, totalPages: number) => {
        if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", margin, 1, 45, 35);
        doc.setFontSize(18); doc.setTextColor(27, 94, 32); doc.setFont("helvetica", "bold");
        doc.text("AL OMRANE - SOUSS MASSA", logoDataUrl ? margin + 40 : margin, 18);
        doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
        doc.text("Annuaire des Fournisseurs", logoDataUrl ? margin + 40 : margin, 25);
        doc.setFontSize(8); doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, margin, 32);
        doc.setDrawColor(200, 200, 200); doc.line(margin, 35, pageWidth - margin, 35);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(7); doc.setTextColor(150, 150, 150);
        doc.text(`Document confidentiel - Page ${currentPage} / ${totalPages}`, margin, footerY);
        doc.text("Al Omrane - Tous droits réservés", pageWidth - margin - 40, footerY, { align: "right" });
      };

      const headers = ["Code", "Raison Sociale", "ICE", "IF", "RC", "Email", "Téléphone", "Ville", "Statut"];
      const rows = list.map(f => [
        f.code, f.raisonSociale, f.ice,
        f.identifiantFiscal || "-", f.registreCommerce || "-",
        f.email || "-", f.telephone || "-",
        f.ville || "-", f.actif ? 'Actif' : 'Inactif'
      ]);

      autoTable(doc, {
        head: [headers], body: rows, startY: 40,
        margin: { top: 40, left: margin, right: margin, bottom: 20 },
        styles: { fontSize: 8, cellPadding: 3, valign: "middle", halign: "left", textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: (data) => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
      });

      doc.save(`fournisseurs_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exporté avec succès");
    } catch (err: any) {
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const handleExportExcelOrCSV = (type: 'excel' | 'csv') => {
    const list = getListToExport();
    if (list.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }

    const exportData = list.map(f => ({
      "Code": f.code,
      "Raison Sociale": f.raisonSociale,
      "ICE": f.ice,
      "Identifiant Fiscal": f.identifiantFiscal || "",
      "Registre Commerce": f.registreCommerce || "",
      "Téléphone": f.telephone || "",
      "Email": f.email || "",
      "Adresse": f.adresse || "",
      "Ville": f.ville || "",
      "Pays": f.pays || "",
      "Statut": f.actif ? "Actif" : "Inactif"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fournisseurs");

    if (type === 'excel') {
      XLSX.writeFile(workbook, `fournisseurs_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Fichier Excel exporté avec succès");
    } else {
      XLSX.writeFile(workbook, `fournisseurs_${new Date().toISOString().split("T")[0]}.csv`, { bookType: "csv" });
      toast.success("Fichier CSV exporté avec succès");
    }
  };

  // ─── IMPORT ──────────────────────────────────────────────────────────────
  const downloadTemplate = () => {
    const templateData = [{
      "Raison Sociale": "Exemple SARL",
      "ICE": "123456789012345",
      "Identifiant Fiscal": "12345678",
      "Registre Commerce": "12345",
      "Téléphone": "0600000000",
      "Email": "contact@exemple.ma",
      "Adresse": "123 Avenue Hassan II",
      "Ville": "Casablanca",
      "Pays": "Maroc",
      "Statut (Actif/Inactif)": "Actif"
    }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modèle Fournisseurs");
    XLSX.writeFile(workbook, "modele_import_fournisseurs.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws) as any[];

        const dtos: CreateFournisseurDTO[] = [];
        const errors: string[] = [];

        rawData.forEach((row, index) => {
          const rs = row["Raison Sociale"] || row["raison sociale"] || row["Raison sociale"];
          let ice = row["ICE"] || row["ice"];
          if (ice) ice = String(ice).trim();

          if (!rs || !ice) {
            errors.push(`Ligne ${index + 2} : raison sociale ou ICE manquant`);
            return;
          }
          if (!REGEX_ICE.test(ice)) {
            errors.push(`Ligne ${index + 2} : ICE invalide (15 chiffres requis)`);
            return;
          }
          // Vérification des doublons dans la base existante
          const duplicate = data.find(f => f.ice === ice);
          if (duplicate) {
            errors.push(`Ligne ${index + 2} : l'ICE ${ice} est déjà attribué à "${duplicate.raisonSociale}"`);
            return;
          }

          const statutStr = String(row["Statut (Actif/Inactif)"] || row["Statut"] || "Actif").toLowerCase();
          const actif = statutStr === "actif" || statutStr === "true" || statutStr === "1";

          dtos.push({
            raisonSociale: String(rs),
            ice: String(ice),
            identifiantFiscal: row["Identifiant Fiscal"] ? String(row["Identifiant Fiscal"]) : undefined,
            registreCommerce: row["Registre Commerce"] ? String(row["Registre Commerce"]) : undefined,
            telephone: row["Téléphone"] ? String(row["Téléphone"]) : '',
            email: row["Email"] ? String(row["Email"]) : '',
            adresse: row["Adresse"] ? String(row["Adresse"]) : '',
            ville: row["Ville"] ? String(row["Ville"]) : 'Maroc',
            pays: row["Pays"] ? String(row["Pays"]) : 'Maroc',
            actif,
          });
        });

        if (dtos.length === 0) {
          toast.error("Aucun fournisseur valide trouvé dans le fichier.");
          return;
        }

        try {
          setSubmitting(true);
          const created = await fournisseurService.bulkCreate(dtos);
          setData(prev => [...created, ...prev]);
          if (errors.length > 0) {
            toast.warning(`${created.length} fournisseurs importés. ${errors.length} lignes ignorées.`, {
              description: errors.slice(0, 3).join(', '),
            });
          } else {
            toast.success(`${created.length} fournisseurs importés avec succès.`);
          }
          setImportModalOpen(false);
        } catch (err: any) {
          const msg = err?.response?.data?.message || err.message || 'Erreur lors de l\'import côté serveur';
          toast.error(msg);
        } finally {
          setSubmitting(false);
        }
      } catch (error) {
        toast.error("Erreur lors de la lecture du fichier. Vérifiez le format.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─── AFFICHAGE DU SPINNER PENDANT LE CHARGEMENT ──────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1D6F42]" />
          <p className="text-gray-500 font-medium">Chargement des fournisseurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50/30 gap-4">
        <div className="bg-white border border-red-200 rounded-2xl p-6 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchFournisseurs} variant="outline" className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" /> Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // ─── COMPOSANTS DE LA TABLE ──────────────────────────────────────────────
  const SortableHeader = ({ label, sortKey, align = 'left' }: { label: string; sortKey: keyof Fournisseur; align?: 'left' | 'center' | 'right' }) => (
    <div
      className={cn("flex items-center gap-1 cursor-pointer select-none hover:text-gray-900 transition-colors",
        align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start')}
      onClick={() => handleSort(sortKey)}
    >
      {label}
      <div className="flex flex-col">
        <ChevronUp className={cn("w-3 h-3 -mb-1", sortConfig?.key === sortKey && sortConfig.direction === 'asc' ? "text-[#1565C0]" : "text-gray-300")} />
        <ChevronDown className={cn("w-3 h-3", sortConfig?.key === sortKey && sortConfig.direction === 'desc' ? "text-[#1565C0]" : "text-gray-300")} />
      </div>
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm w-full overflow-hidden">
      <div className="overflow-x-auto w-full">
        <Table className="w-full min-w-[900px] table-fixed">
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              <TableHead className="w-12 px-4 py-3 text-center">
                <Checkbox checked={selectedIds.size === paginatedData.length && paginatedData.length > 0} onCheckedChange={toggleSelectAll} className="border-gray-300 rounded" />
              </TableHead>
              <TableHead className="w-[30%] px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider"><SortableHeader label="Fournisseur" sortKey="raisonSociale" /></TableHead>
              <TableHead className="w-[20%] px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Contact</TableHead>
              <TableHead className="w-[20%] px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider"><SortableHeader label="Localisation" sortKey="ville" /></TableHead>
              <TableHead className="w-[15%] px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider"><SortableHeader label="Statut" sortKey="actif" align="center" /></TableHead>
              <TableHead className="w-[15%] px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-50">
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center justify-center text-gray-400 space-y-3">
                    <Search className="w-8 h-8" />
                    <p className="font-medium text-sm text-gray-500">Aucun fournisseur trouvé.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map(f => (
                <TableRow key={f.id} className="hover:bg-gray-50/60 transition-colors border-0 group cursor-pointer" onClick={() => setDetailModal(f)}>
                  <TableCell className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={selectedIds.has(f.id)} onCheckedChange={() => toggleSelect(f.id)} className="border-gray-300 rounded data-[state=checked]:bg-[#1D6F42]" />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-[#1D6F42]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{f.raisonSociale}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{f.code} • ICE: {f.ice}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 min-w-0">
                    <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5 truncate"><Phone className="w-3 h-3 text-gray-400 flex-shrink-0"/> {f.telephone || '—'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 truncate"><Mail className="w-3 h-3 text-gray-400 flex-shrink-0"/> {f.email || '—'}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 min-w-0">
                    <p className="text-xs text-gray-700 font-medium flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3 text-gray-400 flex-shrink-0"/> {f.ville}</p>
                    <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[150px]">{f.adresse}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    {f.actif ? <Badge variant="outline" className="border-0 bg-[#E8F5E9] text-[#1D6F42] font-bold">Actif</Badge> : <Badge variant="outline" className="border-0 bg-gray-100 text-gray-500 font-bold">Inactif</Badge>}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setDetailModal(f)} className="p-1.5 text-gray-400 hover:text-[#1565C0] hover:bg-[#E3F2FD] rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
                      <button onClick={() => handleOpenForm(f)} className="p-1.5 text-gray-400 hover:text-[#E65100] hover:bg-[#FFF3E0] rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => setDeleteConfirm({ open: true, id: f.id, name: f.raisonSociale })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {paginatedData.length === 0 ? (
        <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border-2 border-gray-100">
          <Search className="w-8 h-8 mb-3" />
          <p className="font-medium text-sm text-gray-500">Aucun fournisseur trouvé.</p>
        </div>
      ) : paginatedData.map(f => (
        <div key={f.id} className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-lg hover:border-[#1D6F42]/30 transition-all group flex flex-col relative">
          <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Checkbox checked={selectedIds.has(f.id)} onCheckedChange={() => toggleSelect(f.id)} className="border-gray-300 rounded data-[state=checked]:bg-[#1D6F42]" />
          </div>

          <div className="flex items-start gap-4 mb-4" onClick={() => setDetailModal(f)} style={{ cursor: 'pointer' }}>
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-[#1D6F42]" />
            </div>
            <div className="flex-1 pr-6 min-w-0">
              <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{f.raisonSociale}</h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5 truncate font-bold">{f.code}</p>
              <div className="mt-2">
                {f.actif ? <Badge variant="outline" className="border-0 bg-[#E8F5E9] text-[#1D6F42] text-[10px] px-2 py-0 font-bold">Actif</Badge> : <Badge variant="outline" className="border-0 bg-gray-100 text-gray-500 text-[10px] px-2 py-0 font-bold">Inactif</Badge>}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100 truncate font-medium"><Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> <span className="truncate">{f.telephone || '—'}</span></div>
            <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100 truncate font-medium"><Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> <span className="truncate">{f.email || '—'}</span></div>
            <div className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100 truncate font-medium"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> <span className="truncate">{f.ville}</span></div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
            <button onClick={() => setDetailModal(f)} className="flex-1 h-9 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Voir</button>
            <button onClick={() => handleOpenForm(f)} className="flex-1 h-9 rounded-xl bg-[#E3F2FD] text-[#1565C0] text-xs font-bold hover:bg-[#BBDEFB] transition-colors flex items-center justify-center gap-1.5"><Edit className="w-3.5 h-3.5" /> Modifier</button>
            <button onClick={() => setDeleteConfirm({ open: true, id: f.id, name: f.raisonSociale })} className="w-9 h-9 rounded-xl bg-[#FFEBEE] text-[#B71C1C] text-xs font-bold hover:bg-[#FFCDD2] transition-colors flex items-center justify-center flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <SidebarProvider>
      <SidebarInset>
        <main className="flex-1 space-y-6 p-6 min-h-screen bg-gray-50/30 w-full overflow-x-hidden">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Annuaire Fournisseurs</h1>
              <p className="text-sm text-gray-500 font-medium">Gérez votre base de tiers et leurs contacts légaux.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={() => setImportModalOpen(true)} variant="outline" className="h-10 rounded-xl border-2 border-gray-200 bg-white text-gray-800 font-bold hover:bg-gray-100 hover:text-gray-900 gap-2 px-4 shadow-sm transition-colors">
                <UploadCloud className="w-4 h-4" /> <span className="hidden sm:inline">Importer</span>
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 rounded-xl border-2 border-gray-200 bg-white text-gray-800 font-bold hover:bg-gray-100 hover:text-gray-900 gap-2 px-4 shadow-sm transition-colors">
                    <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exporter</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 rounded-xl border-gray-200 shadow-xl bg-white" align="end">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => handleExportExcelOrCSV('excel')} className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-[#E8F5E9] hover:text-[#1D6F42] transition-colors"><FileSpreadsheet className="w-4 h-4" /> Excel (.xlsx)</button>
                    <button onClick={() => handleExportExcelOrCSV('csv')} className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-[#FFF3E0] hover:text-[#E65100] transition-colors"><FileText className="w-4 h-4" /> CSV (.csv)</button>
                    <button onClick={handleExportPDF} className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-[#FFEBEE] hover:text-[#B71C1C] transition-colors"><FileText className="w-4 h-4" /> Rapport PDF</button>
                  </div>
                </PopoverContent>
              </Popover>

              <Button onClick={() => handleOpenForm()} className="h-10 rounded-xl bg-[#1D6F42] text-white font-bold hover:bg-[#155430] gap-2 px-4 shadow-sm">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nouveau Fournisseur</span>
              </Button>
            </div>
          </div>

          {/* KPI CARDS */}
          <div className="flex flex-wrap gap-6 w-full">
            <KpiCard onClick={() => setStatusFilter('all')} active={statusFilter === 'all'} label="Total Fournisseurs" value={stats.total} icon={Building2} colorClass="text-[#1D6F42]" bgClass="bg-[#E8F5E9]" />
            <KpiCard onClick={() => setStatusFilter('active')} active={statusFilter === 'active'} label="Comptes Actifs" value={stats.active} icon={CheckCircle} colorClass="text-[#1565C0]" bgClass="bg-[#E3F2FD]" />
            <KpiCard onClick={() => setStatusFilter('inactive')} active={statusFilter === 'inactive'} label="Comptes Inactifs" value={stats.inactive} icon={XCircle} colorClass="text-[#B71C1C]" bgClass="bg-[#FFEBEE]" />
          </div>

          {/* TOOLBAR & LIST */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden shadow-sm flex flex-col w-full">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4 bg-gray-50/30">
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Rechercher (Nom, ICE, Code)..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm border-gray-200 rounded-xl focus-visible:ring-[#1D6F42] font-medium" />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-full sm:w-48 h-9 text-sm font-medium text-gray-700 border-gray-200 rounded-xl hover:bg-gray-100"><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="all" className="font-medium">Tous les statuts</SelectItem>
                    <SelectItem value="active" className="font-medium">Actifs uniquement</SelectItem>
                    <SelectItem value="inactive" className="font-medium">Inactifs uniquement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                {(search || statusFilter !== 'all' || sortConfig !== null) && (
                  <Button variant="ghost" onClick={() => { setSearch(''); setStatusFilter('all'); setSortConfig(null); setCurrentPage(1); }} className="h-9 px-3 text-gray-500 hover:text-gray-900 rounded-xl font-bold">
                    <RefreshCw className="w-4 h-4 mr-2"/> Réinitialiser
                  </Button>
                )}
                <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                  <button onClick={() => setViewMode('table')} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", viewMode === 'table' ? "bg-white shadow-sm text-[#1D6F42]" : "text-gray-500 hover:text-gray-900")}><List className="w-4 h-4"/></button>
                  <button onClick={() => setViewMode('grid')} className={cn("w-7 h-7 rounded-lg flex items-center justify-center transition-colors", viewMode === 'grid' ? "bg-white shadow-sm text-[#1D6F42]" : "text-gray-500 hover:text-gray-900")}><Grid3X3 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="px-6 py-3 bg-[#E3F2FD] border-b border-[#90CAF9] flex items-center gap-4">
                <span className="text-sm font-black text-[#0D47A1]">{selectedIds.size} fournisseur(s) sélectionné(s)</span>
                <Button onClick={() => setDeleteConfirm({ open: true, id: '-1', name: 'la sélection' })} variant="destructive" size="sm" className="h-8 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold px-3 shadow-sm">
                  Supprimer la sélection
                </Button>
                <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-[#0D47A1] hover:bg-[#BBDEFB] p-1.5 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
              </div>
            )}

            <div className="p-6 flex-1 bg-gray-50/30">
              {viewMode === 'table' ? renderTableView() : renderGridView()}
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white overflow-x-auto">
                <span className="text-sm text-gray-500 font-medium hidden sm:inline whitespace-nowrap">
                  Affichage de <span className="font-bold text-gray-900">{((currentPage - 1) * itemsPerPage) + 1}</span> à <span className="font-bold text-gray-900">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> sur <span className="font-bold text-gray-900">{sortedData.length}</span>
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-lg border-gray-200 hover:bg-gray-100 flex-shrink-0">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn("h-8 w-8 rounded-lg text-sm font-bold transition-colors flex-shrink-0", currentPage === page ? "bg-[#1D6F42] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200")}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0 rounded-lg border-gray-200 hover:bg-gray-100 flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>

      {/* ─── MODALES ──────────────────────────────────────────────────────── */}

      {/* Détail fournisseur */}
      {detailModal && (
        <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
          <DialogContent className="sm:max-w-3xl p-0 bg-transparent border-0 shadow-none max-h-[90vh] flex flex-col">
            <FournisseurDetailModal fournisseur={detailModal} onClose={() => setDetailModal(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Import */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-lg p-0 rounded-3xl border-gray-100 bg-white max-h-[90vh] flex flex-col">
          <DialogTitle className="sr-only">Importer des fournisseurs</DialogTitle>
          <DialogHeader className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl flex-shrink-0">
            <h2 className="text-xl font-black text-gray-900">Importer des fournisseurs</h2>
            <DialogDescription className="text-sm text-gray-500 mt-1 font-medium">Ajoutez plusieurs fournisseurs via un fichier Excel ou CSV.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            <input type="file" accept=".xlsx, .csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-gray-50 hover:bg-[#E8F5E9] hover:border-[#1D6F42] transition-colors cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-7 h-7 text-[#1D6F42]" />
              </div>
              <h3 className="text-sm font-black text-gray-900 mb-1">Cliquez ou glissez votre fichier ici</h3>
              <p className="text-xs text-gray-500 font-medium">Fichiers supportés : .xlsx, .csv (Max 5MB)</p>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
              <h4 className="text-xs font-black text-[#1565C0] uppercase tracking-wider mb-3 flex items-center gap-2"><Info className="w-4 h-4"/> Règles d'importation</h4>
              <ul className="space-y-2 text-sm text-gray-700 font-medium">
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"/> Le fichier doit contenir : Raison Sociale, ICE.</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"/> L'ICE doit obligatoirement comporter 15 chiffres.</li>
                <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"/> Les doublons d'ICE seront automatiquement ignorés.</li>
              </ul>
              <Button onClick={downloadTemplate} variant="link" className="px-0 mt-2 text-[#1565C0] font-bold text-xs h-auto py-1">
                Télécharger le modèle d'import
              </Button>
            </div>
          </div>
          <DialogFooter className="px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex-shrink-0">
            <Button variant="outline" onClick={() => setImportModalOpen(false)} className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900 text-gray-700 font-bold w-full">Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formulaire Ajout/Modification */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="sm:max-w-2xl p-0 rounded-3xl border-gray-100 bg-white max-h-[90vh] flex flex-col">
          <DialogTitle className="sr-only">{editingProvider ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</DialogTitle>
          <DialogHeader className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl flex-shrink-0">
            <h2 className="text-xl font-black text-gray-900">{editingProvider ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
            <DialogDescription className="text-sm text-gray-500 mt-1 font-medium">Renseignez les informations de la société partenaire.</DialogDescription>
          </DialogHeader>
          <div className="px-8 py-6 space-y-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-bold text-gray-700">Raison Sociale <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ex: Société ABC SARL"
                  value={formData.raisonSociale || ''}
                  onChange={e => handleChange('raisonSociale', e.target.value)}
                  className={cn("rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-medium", formErrors.raisonSociale && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.raisonSociale && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.raisonSociale}</p>}
              </div>
              {/* Le code est généré par le backend, pas de champ */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">ICE (15 chiffres) <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Ex: 001234567890000"
                  value={formData.ice || ''}
                  maxLength={15}
                  onChange={e => handleChange('ice', e.target.value.replace(/\D/g, ''))}
                  className={cn("rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-mono font-bold", formErrors.ice && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.ice && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.ice}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Identifiant Fiscal (IF)</Label>
                <Input
                  placeholder="Ex: 45678912"
                  value={formData.identifiantFiscal || ''}
                  onChange={e => handleChange('identifiantFiscal', e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Registre de Commerce (RC)</Label>
                <Input
                  placeholder="Ex: 23456"
                  value={formData.registreCommerce || ''}
                  onChange={e => handleChange('registreCommerce', e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-medium"
                />
              </div>
            </div>

            

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Téléphone</Label>
                <Input
                  value={formData.telephone || ''}
                  onChange={e => handleChange('telephone', e.target.value)}
                  placeholder="Ex: 0612345678"
                  className={cn("rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-medium", formErrors.telephone && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.telephone && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.telephone}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Email</Label>
                <Input
                  value={formData.email || ''}
                  type="email"
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="Ex: contact@societe.ma"
                  className={cn("rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-medium", formErrors.email && "border-red-500 focus-visible:ring-red-500")}
                />
                {formErrors.email && <p className="text-xs text-red-500 font-bold mt-1">{formErrors.email}</p>}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm font-bold text-gray-700">Adresse</Label>
                <Input
                  placeholder="Ex: 123, Quartier Industriel, Imm B"
                  value={formData.adresse || ''}
                  onChange={e => handleChange('adresse', e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Ville</Label>
                <Input
                  placeholder="Ex: Casablanca"
                  value={formData.ville || ''}
                  onChange={e => handleChange('ville', e.target.value)}
                  className="rounded-xl border-gray-200 focus-visible:ring-[#1D6F42] font-medium"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center justify-between h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors cursor-pointer" onClick={() => setFormData(p => ({ ...p, actif: !p.actif }))}>
                  <Label className="text-sm font-bold text-gray-700 cursor-pointer pointer-events-none" htmlFor="actif-switch">Compte Actif</Label>
                  <Switch id="actif-switch" checked={formData.actif} onCheckedChange={c => handleChange('actif', c)} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-8 py-5 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex-shrink-0">
            <Button variant="outline" onClick={() => setFormModalOpen(false)} className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900 text-gray-700 font-bold">Annuler</Button>
            <Button onClick={handleSave} disabled={submitting} className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430] font-bold shadow-sm">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation suppression */}
      <Dialog open={deleteConfirm.open} onOpenChange={o => !o && setDeleteConfirm({ open: false, id: '', name: '' })}>
        <DialogContent className="sm:max-w-md rounded-3xl border-red-100 p-0 overflow-hidden bg-white max-h-[90vh] flex flex-col">
          <DialogTitle className="sr-only">Confirmer la suppression</DialogTitle>
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
              <AlertTriangle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Confirmer la suppression</h2>
            <p className="text-gray-600 font-medium text-sm leading-relaxed">
              Voulez-vous vraiment supprimer <strong className="text-gray-900 font-black">{deleteConfirm.name}</strong> ? Cette action est irréversible.
            </p>
          </div>
          <DialogFooter className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900 text-gray-700 font-bold" onClick={() => setDeleteConfirm({ open: false, id: '', name: '' })}>Annuler</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm" onClick={confirmDelete} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              {submitting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}