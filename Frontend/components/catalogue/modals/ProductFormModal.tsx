import React, { useState, useMemo, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Edit, Plus, X, UploadCloud, CheckCircle2, Info, Boxes, Calculator,
  Percent, Building2, AlertTriangle, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/types/catalogue';
import { fmtNumber } from '@/lib/catalogue/utils';
import {
  CategoryFormSelect,
  LocationSelect,
  SupplierSelect,
} from '../CatalogueSelects';
import { generateProductCode } from '@/lib/catalogue/mock-data';
import { catalogueService } from '@/services/catalogue.service';

/**
 * État interne du formulaire produit.
 * Correspond exactement aux champs du DTO `ProduitFormRequest` envoyé au backend.
 */
export interface ProductFormState {
  code: string;
  name: string;
  categoryPath: string;
  location: string;
  currentStock: number;        // correspond à la quantité théorique dans le backend
  minThreshold: number;
  prixUnitaireHT: number;
  tvaPercent: number;
  pmp: number;                 // Prix Moyen Pondéré
  imageUrl: string;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  consignable: boolean;
  supplier: string;
  warrantyMonths: number;
}

/** Valeurs par défaut pour un nouvel article */
const DEFAULT_FORM: ProductFormState = {
  code: '',
  name: '',
  categoryPath: '',
  location: '',
  currentStock: 0,
  minThreshold: 20,
  prixUnitaireHT: 0,
  tvaPercent: 20,
  pmp: 0,
  imageUrl: '',
  description: '',
  weight: '',
  dimensions: '',
  material: '',
  safetyInstructions: '',
  consignable: false,
  supplier: '',
  warrantyMonths: 0,
};

/**
 * Modal de création / modification d'un article du catalogue.
 *
 * @param open             - Visibilité de la modale.
 * @param onOpenChange     - Callback pour changer la visibilité.
 * @param initialProduct   - Produit à éditer (null pour une création).
 * @param onSave           - Callback appelé lors de la sauvegarde.
 * @param existingProducts - Liste des produits déjà existants (pour la vérification d'unicité du code).
 * @param categoriesTree   - Arbre des catégories (provenant du backend, optionnel).
 * @param locations        - Liste des emplacements disponibles (provenant du backend, optionnel).
 * @param suppliers        - Liste des fournisseurs disponibles (provenant du backend, optionnel).
 */
export default function ProductFormModal({
  open,
  onOpenChange,
  initialProduct,
  onSave,
  existingProducts,
  categoriesTree = [],
  locations = [],
  suppliers = [],
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialProduct?: Product | null;
  onSave: (p: ProductFormState, newStock?: number, newPmp?: number, motif?: string) => void;
  existingProducts: Product[];
  categoriesTree?: any[];
  locations?: string[];
  suppliers?: string[];
}) {
  // ── État interne du formulaire ──────────────────────────────────────
  const [form, setForm] = useState<ProductFormState>(DEFAULT_FORM);
  const [imageMethod, setImageMethod] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  

  // Affichage conditionnel des champs de prix
  const showPriceFields = form.currentStock > 0;

  // ── Détection d'une augmentation de stock (édition seulement) ────────
  const oldStock = initialProduct?.quantiteTheorique ?? 0;
  const isStockIncrease = form.currentStock > oldStock;
  const addedQty = isStockIncrease ? form.currentStock - oldStock : 0;

  // Champs pour une entrée de stock (prix d'achat optionnel)
  const [entryPriceHT, setEntryPriceHT] = useState<string>('');
  const [entryTva, setEntryTva] = useState<number>(20);
  const [modifyMotif, setModifyMotif] = useState<string>('');

  // Le stock a-t-il changé par rapport à la valeur initiale ?
  const stockHasChanged = initialProduct
    ? form.currentStock !== oldStock
    : false;

  // ── Calcul automatique du PMP à partir du prix HT + TVA (nouveau produit) ──
  useEffect(() => {
    if (!showPriceFields) return;
    const computed = Math.round(form.prixUnitaireHT * (1 + form.tvaPercent / 100) * 100) / 100;
    setForm((prev) => ({ ...prev, pmp: computed }));
  }, [form.prixUnitaireHT, form.tvaPercent, showPriceFields]);

  // ── Calcul du PMP lors d'une augmentation de stock (formule experte) ──
  // Si le prix d'achat n'est pas saisi ou est invalide, le PMP reste inchangé.
  const newPmpCalculated = useMemo(() => {
    if (!isStockIncrease || addedQty === 0) return form.pmp;
    const priceHT = parseFloat(entryPriceHT);
    if (!priceHT || priceHT <= 0) return form.pmp; // pas de prix → PMP inchangé
    const priceTTC = priceHT * (1 + entryTva / 100);
    const oldPmp = initialProduct?.avgPrice ?? form.pmp;
    const val = (oldStock * oldPmp + addedQty * priceTTC) / (oldStock + addedQty);
    return Math.round(val * 100) / 100;
  }, [isStockIncrease, oldStock, initialProduct?.avgPrice, form.pmp, addedQty, entryPriceHT, entryTva]);

  // PMP final envoyé au backend
  const finalPmp = isStockIncrease ? newPmpCalculated : form.pmp;

  // ── Validation des champs ────────────────────────────────────────────
  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nom obligatoire';
    if (form.minThreshold < 0) errs.minThreshold = 'Seuil ne peut pas être négatif';
    if (form.currentStock > 0 && (!form.prixUnitaireHT || form.prixUnitaireHT <= 0)) {
    errs.prixUnitaireHT = 'Prix unitaire HT obligatoire (doit être > 0)';
    }
    if (showPriceFields && (form.tvaPercent < 0 || form.tvaPercent > 100))
      errs.tvaPercent = 'TVA doit être entre 0 et 100';
    if (!initialProduct && existingProducts.some((p) => p.code === form.code))
      errs.code = 'Code déjà existant';
    if (stockHasChanged && modifyMotif.trim().length < 3)
      errs.modifyMotif = 'Motif obligatoire (min. 3 caractères)';
    return errs;
  }, [form, initialProduct, existingProducts, showPriceFields, stockHasChanged, modifyMotif]);

  const hasErrors = Object.keys(errors).length > 0;

  // ── Initialisation du formulaire à l'ouverture ─────────────────────
  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      const categoryPath = initialProduct.subcategory
        ? `${initialProduct.category} > ${initialProduct.subcategory}`
        : initialProduct.category;
      const avgP = initialProduct.avgPrice ?? 0;
      const prixHT = avgP > 0 ? Math.round((avgP / 1.2) * 100) / 100 : 0;
      setForm({
        code: initialProduct.code,
        name: initialProduct.name,
        categoryPath,
        location: initialProduct.location ?? '',
        currentStock: initialProduct.quantiteTheorique, // quantité théorique
        minThreshold: initialProduct.minThreshold,
        prixUnitaireHT: prixHT,
        tvaPercent: 20,
        pmp: avgP,
        imageUrl: initialProduct.imageUrl ?? '',
        description: initialProduct.description ?? '',
        weight: initialProduct.weight ?? '',
        dimensions: initialProduct.dimensions ?? '',
        material: initialProduct.material ?? '',
        safetyInstructions: initialProduct.safetyInstructions ?? '',
        consignable: initialProduct.consignable ?? false,
        supplier: initialProduct.supplier ?? '',
        warrantyMonths: initialProduct.warrantyMonths ?? 0,
      });
      setEntryPriceHT('');
      setEntryTva(20);
      setModifyMotif('');
      setSelectedFile(null);
    } else {
      setForm({ ...DEFAULT_FORM, code: generateProductCode() });
      setEntryPriceHT('');
      setEntryTva(20);
      setModifyMotif('');
      setSelectedFile(null);
    }
  }, [initialProduct, open]);

  // ── Helpers pour les champs ──────────────────────────────────────────
  const f = (field: keyof ProductFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const fn = (field: keyof ProductFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: Number(e.target.value) }));

  // ── Soumission du formulaire ────────────────────────────────────────
  const handleSubmit = async () => {
    if (hasErrors) {
      toast.error("Veuillez corriger les erreurs avant d'enregistrer.");
      return;
    }

    let finalImageUrl = form.imageUrl;

    // Si un fichier local a été sélectionné, on l'upload d'abord
    if (selectedFile) {
      setUploading(true);
      try {
        finalImageUrl = await catalogueService.uploadImage(selectedFile);
        // Mettre à jour l'URL dans le formulaire (sera envoyée au backend)
        setForm(prev => ({ ...prev, imageUrl: finalImageUrl }));
      } catch (err: any) {
        const msg =
          typeof err.response?.data === 'string'
            ? err.response.data
            : err.response?.data?.message || err.message || "Erreur lors de l'upload de l'image";
        toast.error(msg);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    // Sauvegarde du produit
    onSave(
      { ...form, imageUrl: finalImageUrl },
      stockHasChanged ? form.currentStock : undefined,
      finalPmp,
      stockHasChanged ? modifyMotif.trim() : undefined,
    );
    onOpenChange(false);
  };

  // ── Classes réutilisables ────────────────────────────────────────────
  const inputCls =
    'w-full border border-zinc-200 rounded-lg h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-zinc-900';
  const lbl = 'text-xs font-medium text-zinc-500 mb-1.5 block';

  const SectionTitle = ({ title, icon: Icon }: { title: string; icon?: React.ElementType }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100">
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400" />}
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-xl border border-zinc-200 shadow-2xl bg-white [&>button.absolute]:hidden [&>button]:hidden"
      >
        <DialogTitle className="sr-only">
          {initialProduct ? "Modifier l'article" : 'Nouvel article'}
        </DialogTitle>

        {/* ─── En-tête ─── */}
        <div className="px-6 py-5 border-b border-zinc-100 sticky top-0 z-10 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#1a4731] flex items-center justify-center">
              {initialProduct ? (
                <Edit className="h-4 w-4 text-white" />
              ) : (
                <Plus className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {initialProduct ? "Modifier l'article" : 'Nouvel article'}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {initialProduct
                  ? 'Mettez à jour les informations.'
                  : 'Remplissez les champs pour créer cet article.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── Formulaire ─── */}
        <div className="px-6 py-6 space-y-8">
          {/* Informations principales */}
          <div>
            <SectionTitle title="Informations principales" icon={Info} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              {/* Code article */}
              <div>
                <label className={lbl}>Code article</label>
                <input
                  value={form.code}
                  disabled
                  className={cn(inputCls, 'bg-zinc-50 text-zinc-400 font-mono cursor-not-allowed')}
                />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
              </div>
              {/* Nom */}
              <div>
                <label className={lbl}>
                  Nom de l'article <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.name}
                  onChange={f('name')}
                  placeholder="Ex: Ramette papier A4…"
                  className={cn(inputCls, errors.name && 'border-red-400 focus:ring-red-300/30')}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              {/* Catégorie (sélecteur hiérarchique alimenté par le backend) */}
              <div className="sm:col-span-2">
                <label className={lbl}>
                  Catégorie{' '}
                  <span className="ml-2 text-[10px] text-zinc-400 normal-case font-normal">
                    (optionnel, sélection multiniveau)
                  </span>
                </label>
                <CategoryFormSelect
                  value={form.categoryPath}
                  onChange={(path) => setForm((prev) => ({ ...prev, categoryPath: path }))}
                  categoriesTree={categoriesTree}
                />
              </div>
              {/* Emplacement (sélecteur alimenté par le backend) */}
              <div className="sm:col-span-2">
                <label className={lbl}>Emplacement</label>
                <LocationSelect
                  value={form.location}
                  onChange={(v) => setForm((prev) => ({ ...prev, location: v }))}
                  locations={locations}
                />
              </div>
              {/* Description */}
              <div className="sm:col-span-2">
                <label className={lbl}>Description</label>
                <Textarea
                  value={form.description}
                  onChange={f('description')}
                  rows={2}
                  placeholder="Description détaillée de l'article…"
                  className="rounded-lg border-zinc-200 bg-white resize-none text-sm focus-visible:ring-[#1a4731]/20"
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div>
            <SectionTitle title="Image" />
            <div className="flex gap-2 mb-3">
              {(['url', 'file'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setImageMethod(m)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-lg border transition-all',
                    imageMethod === m
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300',
                  )}
                >
                  {m === 'url' ? 'URL externe' : 'Fichier local'}
                </button>
              ))}
            </div>
            {imageMethod === 'url' ? (
              <input
                value={form.imageUrl}
                onChange={f('imageUrl')}
                placeholder="https://…"
                className={inputCls}
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-300 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all"
              >
                <UploadCloud className="mx-auto w-6 h-6 text-zinc-300 mb-2" />
                <p className="text-sm font-medium text-zinc-600">Cliquez pour parcourir</p>
                <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG, WebP</p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      // Afficher une preview temporaire avec un blob (ne sera pas sauvegardé)
                      setForm((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
                    }
                  }}
                />
              </div>
            )}
            {form.imageUrl && (
              <div className="mt-3 flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <img
                  src={form.imageUrl}
                  alt="Aperçu"
                  className="w-10 h-10 object-cover rounded-md border border-zinc-200"
                  onError={(e) =>
                    ((e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/40')
                  }
                />
                <p className="text-xs font-medium text-zinc-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Image chargée
                </p>
              </div>
            )}
          </div>

{/* Stock */}
<div>
  <SectionTitle title="Stock" icon={Boxes} />
  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className={lbl}>
        Quantité en stock <span className="text-red-400">*</span>
      </label>
      <input
        type="number"
        value={form.currentStock}
        onChange={fn('currentStock')}
        className={cn(
          'w-full border border-zinc-200 rounded-lg h-9 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-center text-zinc-900',
          errors.currentStock && 'border-red-400',
        )}
      />
      {errors.currentStock && (
        <p className="text-[10px] text-red-500 mt-0.5">{errors.currentStock}</p>
      )}
    </div>
    <div>
      <label className={lbl}>Seuil d'alerte</label>
      <input
        type="number"
        min={0}
        value={form.minThreshold}
        onChange={fn('minThreshold')}
        className={cn(
          'w-full border border-amber-200 rounded-lg h-9 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/20 bg-white text-center text-amber-600',
          errors.minThreshold && 'border-red-400',
        )}
      />
      <p className="text-[10px] text-zinc-400 mt-0.5">Défaut : 20</p>
    </div>
  </div>

  {/* Valorisation (toujours affichée si stock > 0) */}
  {showPriceFields && (
    <div className="mt-5 p-4 rounded-xl bg-[#E8F5E9] border border-[#1a4731]/20 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="w-3.5 h-3.5 text-[#1a4731]" />
        <p className="text-xs font-semibold text-[#1a4731] uppercase tracking-wider">
          Valorisation du stock
        </p>
        <span className="text-[10px] text-zinc-400 ml-auto">
          PMP = Prix HT × (1 + TVA/100)
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={cn(lbl, 'text-[#1a4731]')}>
            Prix unitaire HT <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.prixUnitaireHT}
              onChange={fn('prixUnitaireHT')}
              className={cn(
                'w-full border border-[#1a4731]/30 rounded-lg h-9 pl-3 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-zinc-900',
                errors.prixUnitaireHT && 'border-red-400',
              )}
            />
            <span className="absolute right-3 top-2.5 text-xs text-zinc-400 font-medium pointer-events-none">
              MAD
            </span>
          </div>
          {errors.prixUnitaireHT && (
            <p className="text-[10px] text-red-500 mt-0.5">{errors.prixUnitaireHT}</p>
          )}
        </div>
        <div>
          <label className={cn(lbl, 'text-[#1a4731]')}>TVA (%)</label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={form.tvaPercent}
              onChange={fn('tvaPercent')}
              className={cn(
                'w-full border border-[#1a4731]/30 rounded-lg h-9 pl-3 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-zinc-900 text-center',
                errors.tvaPercent && 'border-red-400',
              )}
            />
            <Percent className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>
          {errors.tvaPercent && (
            <p className="text-[10px] text-red-500 mt-0.5">{errors.tvaPercent}</p>
          )}
        </div>
        <div>
          <label className={cn(lbl, 'text-[#1a4731] font-bold')}>
            PMP calculé{' '}
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.pmp}
              onChange={fn('pmp')}
              className="w-full border-2 border-[#1a4731] rounded-lg h-9 pl-3 pr-10 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-[#1a4731] text-center"
            />
            <span className="absolute right-3 top-2.5 text-xs text-[#1a4731] font-medium pointer-events-none">
              MAD
            </span>
          </div>
          <p className="text-[10px] text-[#1a4731]/70 mt-0.5 text-center">
            = {fmtNumber(form.prixUnitaireHT)} × (1 + {form.tvaPercent}%)
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-[#1a4731]/20">
        <span className="text-xs text-[#1a4731] font-medium">Valeur stock estimée</span>
        <span className="text-sm font-black text-[#1a4731]">
          {fmtNumber(form.currentStock * form.pmp)} MAD
        </span>
      </div>

      {/* Option de prix d'achat pour une augmentation de stock */}
      {initialProduct && isStockIncrease && (
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-2">
            Prix d'achat pour les {addedQty} unités ajoutées (optionnel)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-amber-800 mb-1 block">
                Prix unitaire HT (MAD)
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={entryPriceHT}
                onChange={(e) => setEntryPriceHT(e.target.value)}
                placeholder="Laisser vide pour ne pas modifier le PMP"
                className="w-full border border-amber-300 rounded-lg h-9 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/20 bg-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setEntryPriceHT('');
                  setEntryTva(20);
                }}
                className="text-[10px] text-amber-700 underline hover:text-amber-800"
              >
                Réinitialiser
              </button>
            </div>
          </div>
          {entryPriceHT && Number(entryPriceHT) > 0 && (
            <p className="text-xs text-amber-800 mt-2">
              Nouveau PMP calculé :{' '}
              <span className="font-bold">{fmtNumber(newPmpCalculated)} MAD</span>
            </p>
          )}
        </div>
      )}
    </div>
  )}

  {/* Motif de modification (si stock modifié) */}
  {stockHasChanged && (
    <div className="mt-4">
      <label className={lbl}>
        Motif de la modification <span className="text-red-400">*</span>{' '}
        <span className="normal-case font-normal text-zinc-400">(min. 3)</span>
      </label>
      <input
        value={modifyMotif}
        onChange={(e) => setModifyMotif(e.target.value)}
        placeholder="Raison du changement de stock…"
        className={cn(
          'w-full border rounded-lg h-9 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white',
          errors.modifyMotif ? 'border-red-400' : 'border-zinc-200',
        )}
      />
      {errors.modifyMotif && (
        <p className="text-[10px] text-red-500 mt-0.5">{errors.modifyMotif}</p>
      )}
    </div>
  )}

  {/* Consignable */}
  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100 mt-4">
    <Checkbox
      checked={form.consignable}
      onCheckedChange={(checked) =>
        setForm((prev) => ({ ...prev, consignable: !!checked }))
      }
      className="border-zinc-300 data-[state=checked]:bg-[#1a4731] data-[state=checked]:border-[#1a4731]"
    />
    <div>
      <p className="text-sm font-medium text-zinc-800">Article consignable</p>
      <p className="text-xs text-zinc-500">Restitution obligatoire après usage.</p>
    </div>
  </div>
</div>

          {/* Fournisseur */}
          <div>
            <SectionTitle title="Fournisseur" icon={Building2} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Fournisseur</label>
                <SupplierSelect
                  value={form.supplier}
                  onChange={(v) => setForm((prev) => ({ ...prev, supplier: v }))}
                  suppliers={suppliers}
                />
              </div>
              <div>
                <label className={lbl}>Garantie (mois)</label>
                <input
                  type="number"
                  min={0}
                  value={form.warrantyMonths}
                  onChange={fn('warrantyMonths')}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Informations complémentaires */}
          <div>
            <SectionTitle title="Informations complémentaires" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Poids</label>
                <input
                  value={form.weight}
                  onChange={f('weight')}
                  placeholder="Ex: 1,5 kg"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={lbl}>Dimensions</label>
                <input
                  value={form.dimensions}
                  onChange={f('dimensions')}
                  placeholder="Ex: 20×10×5 cm"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={lbl}>Matière / Composition</label>
                <input
                  value={form.material}
                  onChange={f('material')}
                  placeholder="Ex: Plastique ABS"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={lbl}>Consignes de sécurité</label>
                <Textarea
                  value={form.safetyInstructions}
                  onChange={f('safetyInstructions')}
                  rows={2}
                  placeholder="Ex: Inflammable – tenir à l'écart des flammes…"
                  className="rounded-lg border-zinc-200 bg-white resize-none text-sm focus-visible:ring-[#1a4731]/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Pied du formulaire ─── */}
        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between sticky bottom-0 z-10">
          <p className="text-xs text-zinc-400">
            Les champs <span className="text-red-400">*</span> sont obligatoires.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg h-9 px-4 text-sm font-medium border-zinc-300 text-zinc-800 bg-white hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 transition-colors"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={hasErrors || uploading}
              className="rounded-lg h-9 px-5 bg-[#1a4731] hover:bg-[#153d28] text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Téléchargement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {initialProduct ? 'Mettre à jour' : 'Enregistrer'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}