'use client';

/**
 * Page "Catalogue Articles" – Version connectée au backend
 * --------------------------------------------------------
 * Gestion complète du catalogue, filtres, tri, pagination, exports, etc.
 *
 * Corrections / Améliorations :
 * - Statistiques globales (KPI) calculées à partir de l'intégralité du catalogue
 *   (récupération de toutes les pages via l'API existante).
 * - Bouton de réinitialisation du tri dans l'en-tête du tableau.
 * - Reset complet (filtres + tri + page) via le bouton "Réinitialiser".
 * - Messages utilisateur conviviaux pour les suppressions impossibles.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Package, Search, ChevronLeft, ChevronRight, Edit, Trash2, Plus,
  RefreshCw, List, Grid3X3, X, MapPin, AlertTriangle, CheckCircle2,
  BarChart2, Boxes, Calculator, ChevronsUpDown, ChevronUp, ChevronDown,
  Eye, UploadCloud, Bell, ExternalLink, RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { getImageUrl } from '@/lib/utils';

// Types
import {
  Product, SortColumn, SortDirection, ViewMode, StockFilter,
  ActivePanel, StockStatus,
} from '@/types/catalogue';

// Services
import { catalogueService, type ProduitFormRequest } from '@/services/catalogue.service';
import { categorieService } from '@/services/categorie.service';
import { fournisseurService } from '@/services/fournisseur.service';

// Utilitaires
import { fmtNumber, fmtInt, fmtDate } from '@/lib/catalogue/utils';
import { CATEGORY_COLORS } from '@/lib/catalogue/constants';

// Composants partagés
import {
  StatusPill, StockBar, KpiCard, ExportMenu, DateRangePicker,
} from '@/components/catalogue/CatalogueShared';
import {
  CategoryHierarchyFilterSelect, FilterSelect,
} from '@/components/catalogue/CatalogueSelects';
import AnalysePanel from '@/components/catalogue/AnalysePanel';

// Modales
import DeleteConfirmModal from '@/components/catalogue/modals/DeleteConfirmModal';
import ProductDetailModal from '@/components/catalogue/modals/ProductDetailModal';
import ProductFormModal, { ProductFormState } from '@/components/catalogue/modals/ProductFormModal';
import ImportModal, { ImportRow } from '@/components/catalogue/modals/ImportModal';

// Utilitaires pour l'import
import { generateProductCode, getRandomImage } from '@/lib/catalogue/mock-data';

/** Calcule le statut du stock à partir de la quantité théorique et du seuil. */
function computeStatus(qte: number, seuil: number): StockStatus {
  if (qte <= 0) return 'critique';
  if (qte <= seuil) return 'faible';
  return 'ok';
}

export default function ProduitsPage() {
  // ──────── Données ────────
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  // ──────── Statistiques globales (totaux réels, indépendants des filtres) ────────
  const [globalStats, setGlobalStats] = useState<{
    total: number; ok: number; faible: number; critique: number; valeur: number; pmpGlobal: number;
  }>({ total: 0, ok: 0, faible: 0, critique: 0, valeur: 0, pmpGlobal: 0 });

  /**
   * Récupère TOUS les articles du catalogue (sans filtre) en parcourant les pages.
   * Calcule ensuite les statistiques globales.
   * 
   * ⚠️ Pour un très grand catalogue (> 10 000 articles), préférez un endpoint backend dédié.
   */
  const fetchGlobalStats = useCallback(async () => {
    try {
      const allProducts: Product[] = [];
      let page = 0;
      const size = 500; // Taille de page raisonnable
      let totalFetched = 0;
      let totalAvailable = 0;

      do {
        const data = await catalogueService.getAll({
          page,
          size,
          sort: 'designation,asc',
        });
        allProducts.push(...data.content);
        totalAvailable = data.totalElements;
        totalFetched += data.content.length;
        page++;
      } while (totalFetched < totalAvailable);

      const totalCount = allProducts.length;
      const ok = allProducts.filter(p => computeStatus(p.quantiteTheorique, p.minThreshold) === 'ok').length;
      const faible = allProducts.filter(p => computeStatus(p.quantiteTheorique, p.minThreshold) === 'faible').length;
      const critique = allProducts.filter(p => computeStatus(p.quantiteTheorique, p.minThreshold) === 'critique').length;
      const valeur = allProducts.reduce((s, p) => s + Math.max(0, p.quantiteTheorique) * (p.avgPrice ?? 0), 0);
      const totalStock = allProducts.reduce((s, p) => s + Math.max(0, p.quantiteTheorique), 0);
      const pmpGlobal = totalStock > 0 ? valeur / totalStock : 0;

      setGlobalStats({ total: totalCount, ok, faible, critique, valeur, pmpGlobal });
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques globales', error);
    }
  }, []);

  // ──────── Filtres ────────
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  // ──────── Affichage & tri ────────
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortColumn, setSortColumn] = useState<SortColumn>('designation');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // ──────── Pagination (0‑based pour Spring) ────────
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 15;

  // ──────── Sélection multiple ────────
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // ──────── Panneau actif ────────
  const [activePanel, setActivePanel] = useState<ActivePanel>('catalogue');

  // ──────── Modales ────────
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean; productId: number; productName: string; canDelete: boolean; blockedReason: string;
  }>({ open: false, productId: 0, productName: '', canDelete: true, blockedReason: '' });
  const [importModalOpen, setImportModalOpen] = useState(false);

  // ──────── Données pour les sélecteurs ────────
  const [categoriesTree, setCategoriesTree] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Chargement initial des référentiels et des statistiques globales
  useEffect(() => {
    fetchGlobalStats();

    categorieService.getArborescence().then(data => {
      const mapToTree = (list: any[]): any[] =>
        list.map(cat => ({
          label: cat.nom,
          count: cat.nombreArticles ?? 0,
          children: cat.sousCategories ? mapToTree(cat.sousCategories) : [],
        }));
      setCategoriesTree(mapToTree(data));
    }).catch(err => console.error('Erreur chargement catégories', err));

    fournisseurService.getAll().then(data => {
      setFournisseurs(data.map(f => f.raisonSociale).filter(Boolean).sort());
    }).catch(err => console.error('Erreur chargement fournisseurs', err));

    catalogueService.getEmplacements().then(setLocations).catch(err =>
      console.error('Erreur chargement emplacements', err)
    );
  }, [fetchGlobalStats]);

  // ──────── Chargement des produits depuis l'API (avec filtres) ────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        size: PAGE_SIZE,
        sort: sortColumn,      // ← colonne seule
        direction: sortDirection,
      };
      if (search) params.search = search;
      if (selectedCategory !== 'all') {
        const segments = selectedCategory.split(' > ');
        params.category = segments[segments.length - 1].trim();
      }
      if (selectedLocation !== 'all') params.location = selectedLocation;
      if (selectedSupplier !== 'all') params.supplier = selectedSupplier;
      if (stockFilter !== 'all') params.status = stockFilter;
      if (dateDebut) params.dateDebut = dateDebut;
      if (dateFin) params.dateFin = dateFin;

      const data = await catalogueService.getAll(params);
      setProducts(data.content);
      setTotalElements(data.totalElements);
    } catch (error: any) {
      toast.error('Erreur lors du chargement du catalogue');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortColumn, sortDirection, search, selectedCategory,
      selectedLocation, selectedSupplier, stockFilter, dateDebut, dateFin]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Réinitialiser la page lors du changement de filtre/tri
  useEffect(() => {
    setCurrentPage(0);
  }, [search, selectedCategory, selectedLocation, selectedSupplier,
      stockFilter, dateDebut, dateFin, sortColumn, sortDirection]);

  // ──────── Options des filtres ────────
  const locationFilterOptions = useMemo(() => {
    const used = [...new Set(products.map(p => p.location).filter(Boolean))];
    const all = [...new Set([...used, ...locations])];
    return [{ value: 'all', label: 'Tous emplacements' }, ...all.map(l => ({ value: l, label: l }))];
  }, [products, locations]);

  const supplierFilterOptions = useMemo(() => {
    const used = [...new Set(products.map(p => p.supplier).filter(Boolean))];
    const all = [...new Set([...fournisseurs, ...used])];
    return [{ value: 'all', label: 'Tous fournisseurs' }, ...all.map(s => ({ value: s, label: s }))];
  }, [products, fournisseurs]);

  const statusFilterOptions = [
    { value: 'all', label: 'Tous statuts' },
    { value: 'ok', label: 'Normal', badge: String(globalStats.ok), badgeColor: 'bg-emerald-100 text-emerald-700' },
    { value: 'faible', label: 'Stock faible', badge: String(globalStats.faible), badgeColor: 'bg-amber-100 text-amber-700' },
    { value: 'critique', label: 'Rupture', badge: String(globalStats.critique), badgeColor: 'bg-red-100 text-red-700' },
  ];

  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const paginated = products;

  const hasActiveFilters = !!(search || selectedCategory !== 'all' || selectedLocation !== 'all' ||
    selectedSupplier !== 'all' || stockFilter !== 'all' || dateDebut || dateFin);

  // Reset complet (filtres + tri + page)
  const resetFilters = useCallback(() => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setSelectedSupplier('all');
    setStockFilter('all');
    setDateDebut('');
    setDateFin('');
    setSortColumn('designation');
    setSortDirection('asc');
    setCurrentPage(0);
  }, []);

  const handleSort = useCallback((col: SortColumn) => {
    if (sortColumn === col) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDirection('asc'); }
  }, [sortColumn]);

  const SortIcon = ({ field }: { field: SortColumn }) =>
    sortColumn === field ? (
      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#1a4731]" /> : <ChevronDown className="w-3 h-3 text-[#1a4731]" />
    ) : <ChevronsUpDown className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 transition-colors" />;

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginated.length && paginated.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(p => p.id)));
  }, [selectedIds, paginated]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  }, []);

  // ──────── Exports (inchangés) ────────
  const getExportData = useCallback(() =>
    selectedIds.size > 0 ? products.filter(p => selectedIds.has(p.id)) : products,
    [products, selectedIds]);

  const handleExportCSV = useCallback(() => {
    const data = getExportData(); if (data.length === 0) return;
    const BOM = '\uFEFF';
    const escape = (v: unknown): string => { const s = String(v ?? '').replace(/"/g, '""'); return /[",\n\r]/.test(s) ? `"${s}"` : s; };
    const headers = ['Code', 'Désignation', 'Catégorie', 'Emplacement', 'Stock théorique', 'Réservé', 'Seuil alerte', 'PMP (MAD)', 'Valeur Stock (MAD)', 'Statut'];
    const rows = data.map(p => {
      const pmp = p.avgPrice ?? 0;
      return [p.code, p.name, p.category, p.location ?? '', p.quantiteTheorique, p.quantiteReservee, p.minThreshold,
        pmp.toFixed(2), (Math.max(0, p.quantiteTheorique) * pmp).toFixed(2), computeStatus(p.quantiteTheorique, p.minThreshold)].map(escape).join(',');
    });
    const blob = new Blob([BOM + [headers.map(escape).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url;
    a.download = `catalogue_${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  }, [getExportData]);

  const handleExportExcel = useCallback(async () => {
    const data = getExportData(); if (data.length === 0) return;
    const XLSX = await import('xlsx');
    const rows = data.map(p => {
      const pmp = p.avgPrice ?? 0;
      return {
        Code: p.code, Désignation: p.name, Catégorie: p.category, Emplacement: p.location ?? '',
        'Stock théorique': p.quantiteTheorique, Réservé: p.quantiteReservee, 'Seuil alerte': p.minThreshold,
        'PMP (MAD)': pmp, 'Valeur Stock (MAD)': Math.max(0, p.quantiteTheorique) * pmp,
        Statut: computeStatus(p.quantiteTheorique, p.minThreshold),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Articles'); XLSX.writeFile(wb, `catalogue_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export Excel téléchargé');
  }, [getExportData]);

  const handleExportPDF = useCallback(async (): Promise<void> => {
    const data = getExportData(); if (data.length === 0) return;
    try {
      const { default: jsPDF } = await import('jspdf'); const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); const pageWidth = doc.internal.pageSize.getWidth(); const margin = 12;
      const logoUrl = '/images/alomrane-logo.png'; let logoDataUrl = '';
      try {
        const img = new Image(); img.src = logoUrl; await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(); });
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height; canvas.getContext('2d')?.drawImage(img, 0, 0); logoDataUrl = canvas.toDataURL('image/png');
      } catch { /* optionnel */ }
      const addHeaderFooter = (currentPage: number, totalPages: number) => {
        if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', margin, 1, 35, 35);
        doc.setFontSize(16); doc.setTextColor(29, 111, 66); doc.setFont('helvetica', 'bold'); doc.text('GROUPE AL OMRANE', logoDataUrl ? margin + 40 : margin, 15);
        doc.setFontSize(9); doc.setTextColor(80, 80, 80); doc.setFont('helvetica', 'normal'); doc.text('Catalogue des Articles', logoDataUrl ? margin + 40 : margin, 22);
        doc.setFontSize(7); doc.setTextColor(120, 120, 120); doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} — ${data.length} article(s)`, logoDataUrl ? margin + 40 : margin, 28);
        doc.setDrawColor(29, 111, 66); doc.line(margin, 31, pageWidth - margin, 31);
        const footerY = doc.internal.pageSize.getHeight() - 8; doc.setFontSize(6); doc.setTextColor(140, 140, 140);
        doc.text(`Document confidentiel — Page ${currentPage} / ${totalPages}`, margin, footerY); doc.text('Al Omrane — Tous droits réservés', pageWidth - margin - 30, footerY, { align: 'right' });
      };
      const headers = ['Code', 'Désignation', 'Catégorie', 'Emplacement', 'Stock th.', 'Réservé', 'Seuil', 'PMP (MAD)', 'Valeur (MAD)', 'Statut'];
      const rows = data.map(p => {
        const pmp = p.avgPrice ?? 0; const valeur = Math.max(0, p.quantiteTheorique) * pmp;
        return [p.code, p.name, p.category, p.location || '—', String(p.quantiteTheorique), String(p.quantiteReservee), String(p.minThreshold), pmp.toFixed(2), valeur.toFixed(2), computeStatus(p.quantiteTheorique, p.minThreshold).toUpperCase()];
      });
      autoTable(doc, { head: [headers], body: rows, startY: 36, margin: { top: 36, left: margin, right: margin, bottom: 15 },
        styles: { fontSize: 6, cellPadding: 2, valign: 'middle', halign: 'left', textColor: [40, 40, 40], lineColor: [210, 210, 210], lineWidth: 0.08 },
        headStyles: { fillColor: [29, 111, 66], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 6 },
        alternateRowStyles: { fillColor: [240, 248, 245] },
        columnStyles: { 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' }, 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'center' } },
        didDrawPage: (dataObj) => addHeaderFooter(dataObj.pageNumber, doc.getNumberOfPages()),
      });
      doc.save(`catalogue_articles_${new Date().toISOString().split('T')[0]}.pdf`); toast.success('Rapport PDF exporté');
    } catch (err) { console.error('[Export PDF]', err); toast.error('Erreur lors de la génération du PDF'); }
  }, [getExportData]);

  // ──────── Gestion des produits (API) ────────

  const openDetail = useCallback(async (product: Product) => {
    try {
      const detail = await catalogueService.getDetail(product.id);
      setDetailProduct(detail);
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : err.message || 'Erreur lors du chargement du détail';
      toast.error(msg);
    }
  }, []);

  const handleSaveProduct = useCallback(async (
    formData: ProductFormState,
    newStock?: number,
    newPmp?: number,
    motif?: string,
  ) => {
    const payload: ProduitFormRequest = {
      code: formData.code, name: formData.name, categoryPath: formData.categoryPath, location: formData.location,
      currentStock: formData.currentStock, minThreshold: formData.minThreshold, prixUnitaireHT: formData.prixUnitaireHT,
      tvaPercent: formData.tvaPercent, pmp: newPmp ?? formData.pmp, imageUrl: formData.imageUrl, description: formData.description,
      weight: formData.weight, dimensions: formData.dimensions, material: formData.material, safetyInstructions: formData.safetyInstructions,
      consignable: formData.consignable, supplier: formData.supplier, warrantyMonths: formData.warrantyMonths, motif: motif ?? '',
    };
    try {
      if (editingProduct) { await catalogueService.update(editingProduct.id, payload); toast.success('Article mis à jour'); }
      else { await catalogueService.create(payload); toast.success('Article créé'); }
      setProductFormOpen(false); setEditingProduct(null);
      fetchGlobalStats(); // rafraîchir les stats globales
      fetchProducts();
    } catch (err: any) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || "Erreur lors de l'enregistrement";
      toast.error(msg);
    }
  }, [editingProduct, fetchProducts, fetchGlobalStats]);

  const handleAdjustStock = useCallback(async (productId: number, newQty: number, motif: string, newPmp?: number) => {
    try {
      await catalogueService.ajuster(productId, { nouvelleQuantite: newQty, motif, prixUnitaire: newPmp });
      toast.success('Ajustement effectué');
      if (detailProduct?.id === productId) setDetailProduct(await catalogueService.getDetail(productId));
      fetchGlobalStats(); // rafraîchir
      fetchProducts();
    } catch (err: any) { toast.error(err.response?.data?.message || "Erreur lors de l'ajustement"); }
  }, [detailProduct, fetchProducts, fetchGlobalStats]);

  const handleImportConfirm = useCallback(async (rows: ImportRow[]) => {
    let created = 0;
    try {
      for (const row of rows) {
        if (!row.isValid) continue;
        await catalogueService.create({
          code: row.code || generateProductCode(),
          name: row.name,
          categoryPath: row.subcategory ? `${row.category} > ${row.subcategory}` : row.category,
          location: row.location,
          currentStock: row.currentStock,
          minThreshold: row.minThreshold,
          prixUnitaireHT: 0,
          tvaPercent: 20,
          pmp: row.avgPrice,
          imageUrl: getRandomImage(Date.now() + Math.random()),
          description: row.description,
          weight: row.weight,
          dimensions: row.dimensions,
          material: row.material,
          safetyInstructions: row.safetyInstructions,
          consignable: false,
          supplier: row.supplier,
          warrantyMonths: row.warrantyMonths,
        });
        created++;
      }
      toast.success(`${created} article(s) importé(s) avec succès`);
      fetchGlobalStats();
      fetchProducts();
    } catch (err: any) { toast.error(err.response?.data?.message || "Erreur lors de l'import"); }
  }, [fetchProducts, fetchGlobalStats]);

  const initiateDelete = useCallback((productId: number, productName: string) => {
    setDeleteConfirm({ open: true, productId, productName, canDelete: true, blockedReason: '' });
  }, []);

  const handleDeleteProduct = useCallback(async (productId: number) => {
    try {
      if (productId === -1) {
        const ids = [...selectedIds];
        await Promise.all(ids.map(id => catalogueService.delete(id)));
        toast.success(`${ids.length} article(s) supprimé(s)`);
        setSelectedIds(new Set());
      } else {
        await catalogueService.delete(productId);
        toast.success('Article supprimé');
      }
      setDeleteConfirm({ open: false, productId: 0, productName: '', canDelete: true, blockedReason: '' });
      fetchGlobalStats();
      fetchProducts();
    } catch (err: any) {
      const msg: string = typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Erreur lors de la suppression';
      let blockedReason = '';
      if (msg.toLowerCase().includes('impossible') || msg.toLowerCase().includes('mouvements')) {
        blockedReason = "Cet article ne peut pas être supprimé car il a déjà été mouvementé (entrée, sortie, ajustement) pour garantir la traçabilité.";
      } else if (msg.toLowerCase().includes('contrainte') || msg.toLowerCase().includes('clé étrangère') || msg.toLowerCase().includes('lignes_demande') || msg.toLowerCase().includes('référencée')) {
        blockedReason = "Cet article ne peut pas être supprimé car il est lié à une ou plusieurs demandes.";
      }
      if (blockedReason) {
        setDeleteConfirm(prev => ({ ...prev, canDelete: false, blockedReason }));
      } else {
        toast.error(msg);
        setDeleteConfirm(prev => ({ ...prev, open: false }));
      }
    }
  }, [selectedIds, fetchProducts, fetchGlobalStats]);

  // ──────── Vues ────────
  const renderTableView = () => (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-10" /><col className="w-[28%]" /><col className="w-[14%]" /><col className="w-[12%]" />
          <col className="w-[16%]" /><col className="w-[10%]" /><col className="w-[11%]" /><col className="w-[9%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            <th className="px-3 py-3"><Checkbox checked={selectedIds.size === paginated.length && paginated.length > 0} onCheckedChange={toggleSelectAll} className="border-zinc-300 data-[state=checked]:bg-zinc-800 data-[state=checked]:border-zinc-800" /></th>
            {[{ field: 'designation' as SortColumn, label: 'Article', align: 'left' }, { field: 'category' as SortColumn, label: 'Catégorie', align: 'left' }, { field: 'location' as SortColumn, label: 'Emplac.', align: 'left' }, { field: 'stock' as SortColumn, label: 'Stock', align: 'left' }, { field: 'pmp' as SortColumn, label: 'PMP', align: 'right' }, { field: 'status' as SortColumn, label: 'Statut', align: 'center' }].map(({ field, label, align }) => (
              <th key={field} className="px-3 py-3 cursor-pointer select-none group" onClick={() => handleSort(field)}>
                <span className={cn('text-[10px] uppercase tracking-wider text-zinc-400 font-semibold inline-flex items-center gap-1 hover:text-zinc-600 transition-colors', align === 'center' ? 'justify-center w-full' : align === 'right' ? 'justify-end w-full' : '', field === 'pmp' && 'text-[#1a4731]')}>
                  {label}<SortIcon field={field} />
                </span>
              </th>
            ))}
            <th className="px-3 py-3 text-right">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold flex items-center justify-end gap-1">
                Actions
                {/* Bouton reset tri si actif */}
                {(sortColumn !== 'designation' || sortDirection !== 'asc') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSortColumn('designation'); setSortDirection('asc'); }}
                    className="ml-1 w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center hover:bg-zinc-300 transition-colors"
                    title="Réinitialiser le tri"
                  >
                    <RotateCcw className="w-2.5 h-2.5 text-zinc-600" />
                  </button>
                )}
              </span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {paginated.length === 0 ? (
            <tr><td colSpan={8} className="py-16 text-center"><Package className="w-8 h-8 text-zinc-200 mx-auto mb-3" /><p className="text-sm font-medium text-zinc-500">Aucun article trouvé</p></td></tr>
          ) : paginated.map(product => {
            const status = computeStatus(product.quantiteTheorique, product.minThreshold);
            const pmp = product.avgPrice ?? 0;
            return (
              <tr key={product.id} className={cn('hover:bg-zinc-50/80 transition-colors group cursor-pointer', selectedIds.has(product.id) && 'bg-emerald-50/30')} onClick={() => openDetail(product)}>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} className="border-zinc-300 data-[state=checked]:bg-[#1a4731] data-[state=checked]:border-[#1a4731]" /></td>
                <td className="px-3 py-3"><div className="flex items-center gap-2 min-w-0"><div className="w-7 h-7 rounded-md bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-100">{product.imageUrl ? <img src={getImageUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover" onError={e => ((e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/32')} /> : <Package className="w-3.5 h-3.5 text-zinc-400 m-auto mt-1.5" />}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-zinc-900 truncate">{product.name}</p><p className="text-[10px] text-zinc-400 font-mono">{product.code}</p></div></div></td>
                <td className="px-3 py-3"><span className="text-[10px] text-zinc-600 bg-zinc-100 rounded-md px-1.5 py-0.5 font-medium truncate block max-w-full">{product.category}</span></td>
                <td className="px-3 py-3"><div className="flex items-center gap-1 text-[10px] text-zinc-400 min-w-0"><MapPin className="w-2.5 h-2.5 flex-shrink-0" /><span className="truncate">{product.location || '—'}</span></div></td>
                <td className="px-3 py-3"><StockBar current={product.quantiteTheorique} min={product.minThreshold} /></td>
                <td className="px-3 py-3 text-right"><span className="text-xs font-bold text-[#1a4731]">{fmtNumber(pmp)}</span><span className="text-[9px] text-zinc-400 block">MAD</span></td>
                <td className="px-3 py-3 text-center"><StatusPill status={status} size="sm" /></td>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => openDetail(product)} className="w-6 h-6 rounded-md hover:bg-zinc-100 flex items-center justify-center transition-colors" title="Voir"><Eye className="w-3 h-3 text-zinc-400" /></button><button onClick={() => { setEditingProduct(product); setProductFormOpen(true); }} className="w-6 h-6 rounded-md hover:bg-zinc-100 flex items-center justify-center transition-colors" title="Modifier"><Edit className="w-3 h-3 text-zinc-400" /></button><button onClick={() => initiateDelete(product.id, product.name)} className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-red-50" title="Supprimer"><Trash2 className="w-3 h-3 text-zinc-400 hover:text-red-500" /></button></div></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/30">
          <span className="text-xs text-zinc-400">{totalElements > 0 ? `${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, totalElements)} sur ${totalElements} article(s)` : '0 article'}</span>
          <div className="flex items-center gap-1">
            <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))} className="w-8 h-8 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number; if (totalPages <= 5) p = i; else if (currentPage <= 2) p = i; else if (currentPage >= totalPages - 3) p = totalPages - 5 + i; else p = currentPage - 2 + i;
              return <button key={p} onClick={() => setCurrentPage(p)} className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-all', currentPage === p ? 'bg-[#1a4731] text-white shadow-sm' : 'border border-zinc-200 text-zinc-500 hover:bg-zinc-50')}>{p + 1}</button>;
            })}
            <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} className="w-8 h-8 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {paginated.length === 0 ? <div className="col-span-full py-16 text-center"><Package className="w-10 h-10 text-zinc-200 mx-auto mb-3" /><p className="text-sm font-medium text-zinc-500">Aucun article trouvé</p></div> : paginated.map(product => {
        const status = computeStatus(product.quantiteTheorique, product.minThreshold); const pmp = product.avgPrice ?? 0;
        const cardBorderAccent = status === 'critique' ? 'border-red-200' : status === 'faible' ? 'border-amber-200' : 'border-zinc-200';
        return (
          <div key={product.id} className={cn('group bg-white rounded-xl border-2 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden', cardBorderAccent, 'hover:border-zinc-300')} onClick={() => openDetail(product)}>
            <div className="h-36 bg-zinc-50 relative overflow-hidden flex-shrink-0">
              {product.imageUrl ?<img src={getImageUrl(product.imageUrl)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={e => ((e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/200')} /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-zinc-200" /></div>}
              <div className="absolute top-2 left-2" onClick={e => { e.stopPropagation(); toggleSelect(product.id); }}><Checkbox checked={selectedIds.has(product.id)} className="border-white bg-white/80 shadow-sm data-[state=checked]:bg-[#1a4731] data-[state=checked]:border-[#1a4731]" /></div>
            </div>
            <div className="p-3 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2"><div className="flex-1 min-w-0"><p className="text-[10px] text-zinc-400 font-mono mb-0.5">{product.code}</p><h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug">{product.name}</h4></div><StatusPill status={status} size="sm" /></div>
              <div className="flex-1 flex flex-col justify-end space-y-2.5"><StockBar current={product.quantiteTheorique} min={product.minThreshold} /><div className="flex items-center justify-between pt-2 border-t border-zinc-100"><span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md truncate max-w-[80px]">{product.category}</span><div className="text-right"><p className="text-sm font-bold text-[#1a4731] tabular-nums">{fmtNumber(pmp)} <span className="text-[10px] text-zinc-400 font-normal">MAD</span></p><p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">PMP</p></div></div></div>
            </div>
            <div className="border-t border-zinc-100 px-3 py-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={e => { e.stopPropagation(); setEditingProduct(product); setProductFormOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-[#1a4731] text-white text-xs font-medium hover:bg-[#153d28] transition-colors"><Edit className="w-3 h-3" /> Modifier</button><button onClick={e => { e.stopPropagation(); initiateDelete(product.id, product.name); }} className="w-8 h-7 rounded-lg border flex items-center justify-center transition-colors border-zinc-200 hover:bg-red-50 hover:border-red-200" title="Supprimer"><Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" /></button></div>
          </div>
        );
      })}
    </div>
  );

  const navItems: Array<{ id: ActivePanel; label: string; Icon: React.ElementType }> = [
    { id: 'catalogue', label: 'Catalogue', Icon: Package }, { id: 'analyse', label: 'Analyse', Icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">
        {/* En‑tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><div className="flex items-center gap-2.5 mb-1"><div className="w-8 h-8 rounded-xl bg-[#1a4731] flex items-center justify-center"><Boxes className="w-4 h-4 text-white" /></div><h1 className="text-xl font-bold text-zinc-900 tracking-tight">Catalogue des Articles</h1></div><p className="text-xs text-zinc-400 ml-10">Gestion des stocks · Al Omrane Souss Massa</p></div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters && <button onClick={resetFilters} className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl px-3 py-1.5 transition-all"><X className="w-3 h-3" /> Réinitialiser</button>}
            <button onClick={() => setImportModalOpen(true)} className="h-9 px-4 rounded-xl border-2 border-zinc-200 font-bold text-sm bg-white text-zinc-700 hover:bg-[#E8F5E9] hover:border-[#1a4731] hover:text-[#1a4731] flex items-center gap-2 transition-all"><UploadCloud className="w-4 h-4" /><span className="hidden sm:inline">Importer</span></button>
            <button onClick={() => { setEditingProduct(null); setProductFormOpen(true); setActivePanel('catalogue'); }} className="h-9 px-4 rounded-xl bg-[#1a4731] text-white font-bold hover:bg-[#153d28] flex items-center gap-2 shadow-sm transition-all"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Nouvel article</span></button>
          </div>
        </div>

        {/* KPIs – Valeurs globales, insensibles aux filtres */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard icon={Package} label="Total références" value={fmtInt(globalStats.total)} colorBg="bg-blue-50" colorText="text-blue-600" isActive={stockFilter === 'all' && activePanel === 'catalogue'} onClick={() => { setStockFilter('all'); setActivePanel('catalogue'); }} />
          <KpiCard icon={CheckCircle2} label="En stock normal" value={fmtInt(globalStats.ok)} colorBg="bg-emerald-50" colorText="text-emerald-600" isActive={stockFilter === 'ok' && activePanel === 'catalogue'} onClick={() => { setStockFilter('ok'); setActivePanel('catalogue'); }} />
          <KpiCard icon={AlertTriangle} label="Stocks faibles" value={fmtInt(globalStats.faible)} colorBg="bg-amber-50" colorText="text-amber-500" isActive={stockFilter === 'faible' && activePanel === 'catalogue'} onClick={() => { setStockFilter('faible'); setActivePanel('catalogue'); }} badge={globalStats.faible} />
          <KpiCard icon={AlertTriangle} label="Ruptures de stock" value={fmtInt(globalStats.critique)} colorBg="bg-red-50" colorText="text-red-500" isActive={stockFilter === 'critique' && activePanel === 'catalogue'} onClick={() => { setStockFilter('critique'); setActivePanel('catalogue'); }} badge={globalStats.critique} />
          <KpiCard icon={Calculator} label="PMP moyen catalogue" value={`${fmtNumber(globalStats.pmpGlobal)} MAD`} sub={`Valeur stock: ${(globalStats.valeur / 1000).toFixed(0)}k MAD`} colorBg="bg-[#E8F5E9]" colorText="text-[#1a4731]" isActive={activePanel === 'analyse'} onClick={() => setActivePanel('analyse')} />
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-zinc-200 p-1.5">
          {navItems.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActivePanel(id)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all', activePanel === id ? 'bg-[#1a4731] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50')}><Icon className="w-3.5 h-3.5" />{label}</button>
          ))}
          <a href="/dashboard/responsable/alertes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-all ml-1"><Bell className="w-3.5 h-3.5" />Alertes{(globalStats.faible + globalStats.critique) > 0 && <span className="ml-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{globalStats.faible + globalStats.critique > 9 ? '9+' : globalStats.faible + globalStats.critique}</span>}<ExternalLink className="w-3 h-3 opacity-50" /></a>
        </div>

        {/* Panneau Catalogue */}
        {activePanel === 'catalogue' && (
          <>
            <div className="bg-white rounded-xl border border-zinc-200 p-3 flex flex-wrap items-center gap-2">
              {/* Recherche */}
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 h-8 flex-1 min-w-[200px] focus-within:border-zinc-400 focus-within:bg-white transition-all">
                <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <input type="text" placeholder="Nom, référence, catégorie, fournisseur…" value={search} onChange={e => setSearch(e.target.value)} className="flex-1 text-xs bg-transparent outline-none text-zinc-900 placeholder-zinc-400" />
                {search && <button onClick={() => setSearch('')} className="w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center hover:bg-zinc-300 transition-colors"><X className="w-2.5 h-2.5 text-zinc-600" /></button>}
              </div>

              <CategoryHierarchyFilterSelect value={selectedCategory} onChange={(v: string) => { setSelectedCategory(v); }} products={products} categoriesTree={categoriesTree} />

              <FilterSelect value={selectedLocation} onChange={(v: string) => { setSelectedLocation(v); }} options={locationFilterOptions} placeholder="Emplacements" searchPlaceholder="Rechercher emplacement…" dropdownWidth={240} compact className="hidden lg:block" />
              <FilterSelect value={selectedSupplier} onChange={(v: string) => { setSelectedSupplier(v); }} options={supplierFilterOptions} placeholder="Fournisseurs" searchPlaceholder="Rechercher fournisseur…" dropdownWidth={260} compact className="hidden xl:block" />
              <FilterSelect value={stockFilter} onChange={(v: string) => { setStockFilter(v as StockFilter); }} options={statusFilterOptions} placeholder="Statut" searchPlaceholder="Rechercher statut…" dropdownWidth={200} compact />

              <DateRangePicker dateDebut={dateDebut} dateFin={dateFin} onDebutChange={(v: string) => { setDateDebut(v); }} onFinChange={(v: string) => { setDateFin(v); }} />

              {hasActiveFilters && <button onClick={resetFilters} className="h-8 w-8 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 flex items-center justify-center transition-all" title="Réinitialiser"><RefreshCw className="w-3.5 h-3.5" /></button>}
              {totalElements > 0 && <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">{totalElements} résultat{totalElements > 1 ? 's' : ''}</span>}

              <div className="h-4 w-px bg-zinc-200 hidden sm:block ml-auto" />
              <div className="flex items-center bg-zinc-100 rounded-lg p-0.5">
                <button onClick={() => setViewMode('table')} className={cn('w-7 h-7 rounded-md flex items-center justify-center transition-all', viewMode === 'table' ? 'bg-white shadow-sm text-[#1a4731]' : 'text-zinc-400 hover:text-zinc-600')}><List className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode('grid')} className={cn('w-7 h-7 rounded-md flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-white shadow-sm text-[#1a4731]' : 'text-zinc-400 hover:text-zinc-600')}><Grid3X3 className="w-3.5 h-3.5" /></button>
              </div>
              <ExportMenu onCSV={handleExportCSV} onExcel={handleExportExcel} onPDF={handleExportPDF} disabled={totalElements === 0} />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#1a4731] rounded-xl shadow-lg sticky top-4 z-30">
                <span className="text-xs font-semibold text-white flex-1">{selectedIds.size} article(s) sélectionné(s)</span>
                <div className="flex items-center gap-2"><button onClick={handleExportExcel} className="h-7 px-3 rounded-lg bg-white/10 text-white border border-white/10 hover:bg-white/20 text-xs font-medium transition-all">Exporter</button><button onClick={() => initiateDelete(-1, `${selectedIds.size} articles sélectionnés`)} className="h-7 px-3 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-medium transition-all">Supprimer</button></div>
                <button onClick={() => setSelectedIds(new Set())} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {loading ? <div className="py-16 text-center"><p className="text-sm text-zinc-500">Chargement...</p></div> : (viewMode === 'table' ? renderTableView() : renderGridView())}
          </>
        )}

        {activePanel === 'analyse' && <AnalysePanel products={products} />}
      </div>

      {detailProduct && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" onClick={() => setDetailProduct(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col border border-zinc-200" onClick={e => e.stopPropagation()}>
            <ProductDetailModal product={detailProduct} onAdjustStock={handleAdjustStock} onClose={() => setDetailProduct(null)} onEdit={() => { setEditingProduct(detailProduct); setDetailProduct(null); setProductFormOpen(true); }} onDelete={() => { initiateDelete(detailProduct.id, detailProduct.name); setDetailProduct(null); }} />
          </div>
        </div>
      )}

      <ProductFormModal
        open={productFormOpen}
        onOpenChange={open => { setProductFormOpen(open); if (!open) setEditingProduct(null); }}
        initialProduct={editingProduct}
        onSave={handleSaveProduct}
        existingProducts={products}
        categoriesTree={categoriesTree}
        locations={locations}
        suppliers={fournisseurs}
      />
      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} existingProducts={products} onImportConfirm={handleImportConfirm} />
      <DeleteConfirmModal
        open={deleteConfirm.open}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(prev => ({ ...prev, open: false })); }}
        productName={deleteConfirm.productName}
        canDelete={deleteConfirm.canDelete}
        blockedReason={deleteConfirm.blockedReason || undefined}
        onConfirm={() => handleDeleteProduct(deleteConfirm.productId)}
      />
    </div>
  );
}