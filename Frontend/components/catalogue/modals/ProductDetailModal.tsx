import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Edit, X, MapPin, Building2, Shield, Package, Trash2, History,
  Tag, Hash, Info, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product, StockStatus } from '@/types/catalogue';
import { fmtInt, fmtNumber, fmtDate } from '@/lib/catalogue/utils';
import { StatusPill, StockBar } from '../CatalogueShared';
import { getImageUrl } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * Modal affichant le détail complet d'un produit.
 * Permet l'ajustement rapide du stock avec recalcul optionnel du PMP.
 *
 * Améliorations apportées :
 *  - Lien vers le journal des mouvements réintégré.
 *  - Image du produit plus grande et mise en valeur.
 *  - Affichage des informations manquantes avec des libellés clairs.
 *  - Code article, catégorie et fournisseur présentés avec des badges colorés.
 *  - Prix d'achat optionnel lors de l'ajustement (PMP inchangé si vide).
 */
export default function ProductDetailModal({
  product,
  onAdjustStock,
  onClose,
  onEdit,
  onDelete,
}: {
  product: Product;
  onAdjustStock: (id: number, qty: number, motif: string, newPmp?: number) => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();

  // ── Données du produit ───────────────────────────────────────────────
  const quantiteTheorique = product.quantiteTheorique;
  const quantiteReservee = product.quantiteReservee;
  const minThreshold = product.minThreshold;
  const pmp = product.avgPrice ?? 0;

  // Statut basé sur la quantité théorique et le seuil
  const status: StockStatus =
    quantiteTheorique <= 0 ? 'critique' :
    quantiteTheorique <= minThreshold ? 'faible' :
    'ok';

  const valeurActuelle = Math.max(0, quantiteTheorique) * pmp;

  // ── État local pour l'ajustement ──────────────────────────────────────
  const [adjustValue, setAdjustValue] = useState<number>(quantiteTheorique);
  const [adjustMotif, setAdjustMotif] = useState<string>('');
  const [entryPriceHT, setEntryPriceHT] = useState<string>('');
  const [entryTva, setEntryTva] = useState<number>(20);

  const oldStock = quantiteTheorique;
  const isIncrease = adjustValue > oldStock;
  const addedQty = Math.max(0, adjustValue - oldStock);

  // Le prix d'achat n'est plus obligatoire : on vérifie seulement que s'il est saisi, il est >= 0
  const canAdjust =
    adjustMotif.trim().length >= 3 &&
    (entryPriceHT === '' || Number(entryPriceHT) >= 0);

  // Calcul du nouveau PMP uniquement si un prix d'achat valide est fourni
  const newPmp = useMemo(() => {
    if (!isIncrease || addedQty === 0) return pmp;
    const priceHT = parseFloat(entryPriceHT);
    if (!priceHT || priceHT <= 0) return pmp; // pas de prix → PMP inchangé
    const priceTTC = priceHT * (1 + entryTva / 100);
    return Math.round(
      ((oldStock * pmp + addedQty * priceTTC) / (oldStock + addedQty)) * 100
    ) / 100;
  }, [isIncrease, oldStock, pmp, addedQty, entryPriceHT, entryTva]);

  const statusBg =
    status === 'critique' ? 'bg-red-50 border-red-200' :
    status === 'faible' ? 'bg-amber-50 border-amber-200' :
    'bg-emerald-50 border-emerald-200';
  const statusText =
    status === 'critique' ? 'text-red-700' :
    status === 'faible' ? 'text-amber-700' :
    'text-emerald-700';

  const handleAdjust = () => {
    if (!canAdjust) return;
    onAdjustStock(product.id, adjustValue, adjustMotif.trim(), isIncrease ? newPmp : undefined);
    setAdjustMotif('');
    setEntryPriceHT('');
    toast.success('Ajusté avec succès');
  };

  // ── Chemins d'affichage ───────────────────────────────────────────────
  const categoryPath = product.subcategory
    ? `${product.category} > ${product.subcategory}`
    : product.category;

  return (
    <>
      {/* En-tête */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100 bg-white sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <h2 className="font-semibold text-zinc-900 text-base leading-tight">{product.name}</h2>
            <StatusPill status={status} size="sm" />
            {product.consignable && (
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-medium">
                Consignable
              </span>
            )}
          </div>

          {/* Badges d'information */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {/* Code article */}
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 border border-zinc-200 px-2 py-0.5 font-mono text-[11px] text-zinc-700">
              <Hash className="w-3 h-3 text-zinc-400" />
              {product.code}
            </span>

            {/* Catégorie (chemin complet) */}
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] text-indigo-700">
              <Tag className="w-3 h-3 text-indigo-400" />
              {categoryPath || 'Général'}
            </span>

            {/* Fournisseur */}
            {product.supplier ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                <Building2 className="w-3 h-3 text-amber-400" />
                {product.supplier}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-400 italic">
                <Building2 className="w-3 h-3 text-gray-300" />
                Aucun fournisseur principal
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Modifier
          </button>
          <button
            onClick={onDelete}
            className="h-8 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Corps */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 bg-zinc-50/50 overflow-y-auto">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image & Description */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-zinc-100">
            {/* Image agrandie */}
            <div className="w-full sm:w-40 h-40 rounded-xl border border-zinc-200 overflow-hidden flex-shrink-0 bg-zinc-100 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={getImageUrl(product.imageUrl)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-12 h-12 text-zinc-300" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-zinc-700 leading-relaxed">
                {product.description || 'Aucune description.'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(product.warrantyMonths ?? 0) > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 font-medium flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />
                    Garantie {product.warrantyMonths} mois
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cumuls */}
          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Cumuls de l'exercice {new Date().getFullYear()}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[ 
                { label: 'Stock début exercice', value: fmtInt(product.quantiteTheorique - product.cumulEntree + product.cumulSortie), sub: 'unités', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                { label: 'Cumul qté entrées', value: `+${fmtInt(product.cumulEntree)}`, sub: 'unités', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Cumul qté sorties', value: `-${fmtInt(product.cumulSortie)}`, sub: 'unités', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Stock actuel', value: fmtInt(product.quantiteTheorique), sub: 'unités', color: 'text-zinc-900', bg: 'bg-white', border: 'border-zinc-200' },
                { label: 'Cumul val. entrées', value: fmtNumber(product.cumulValEntree), sub: 'MAD', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { label: 'Cumul val. sorties', value: fmtNumber(product.cumulValSortie), sub: 'MAD', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                { label: 'Valeur stock (PMP)', value: fmtNumber(valeurActuelle), sub: 'MAD', color: 'text-[#1a4731]', bg: 'bg-[#E8F5E9]', border: 'border-[#1a4731]/30' },
                { label: 'PMP calculé', value: fmtNumber(pmp), sub: 'MAD', color: 'text-[#1a4731]', bg: 'bg-[#E8F5E9]', border: 'border-[#1a4731]/30' },
              ].map(({ label, value, sub, color, bg, border }) => (
                <div key={label} className={cn('rounded-xl p-3 border text-center', bg, border)}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
                  <p className={cn('text-base font-black tabular-nums', color)}>{value}</p>
                  <p className="text-[10px] text-zinc-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Spécifications */}
          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Spécifications techniques
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Emplacement', value: product.location || '—' },
                { label: 'Poids', value: product.weight || '—' },
                { label: 'Dimensions', value: product.dimensions || '—' },
                { label: 'Matière', value: product.material || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-zinc-400 font-medium mb-0.5 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-sm text-zinc-800 font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Consignes de sécurité */}
            <div className="pt-4 border-t border-zinc-50">
              <p className="text-[10px] text-zinc-400 font-medium mb-1.5 uppercase tracking-wide">
                Consignes de sécurité
              </p>
              {product.safetyInstructions && product.safetyInstructions !== 'Néant' ? (
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{product.safetyInstructions}</p>
              ) : (
                <p className="text-sm text-zinc-400 italic">Aucune consigne de sécurité</p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4">
          {/* Stock théorique */}
          <div className={cn('p-4 rounded-xl border', statusBg)}>
            <p className={cn('text-xs font-medium mb-1', statusText)}>Stock théorique</p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className={cn('text-4xl font-semibold tabular-nums', statusText)}>
                {fmtInt(quantiteTheorique)}
              </span>
              <span className={cn('text-sm', statusText)}>unités</span>
            </div>
            <div className="space-y-1.5 text-xs mt-3">
              <div className="flex justify-between">
                <span className="text-zinc-500">Dont réservé</span>
                <span className="font-semibold text-zinc-700">{fmtInt(quantiteReservee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Seuil d'alerte</span>
                <span className={cn('font-semibold', statusText)}>{minThreshold}</span>
              </div>
              {/* Dates */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-2 border-t border-zinc-100 mt-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-[10px]">Création</span>
                  <span className="text-zinc-600 tabular-nums">{fmtDate(product.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-[10px]">Mise à jour</span>
                  <span className="text-zinc-600 tabular-nums">{fmtDate(product.lastUpdated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-[10px]">Dern. entrée</span>
                  <span className="text-zinc-600 tabular-nums">{fmtDate(product.dateDerniereEntree)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 text-[10px]">Dern. sortie</span>
                  <span className="text-zinc-600 tabular-nums">{fmtDate(product.dateDerniereSortie)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <StockBar current={quantiteTheorique} min={minThreshold} />
            </div>
          </div>

          {/* Prix & valorisation */}
          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">
              Prix & Valorisation
            </p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-2.5 bg-[#E8F5E9] rounded-lg">
                <div>
                  <p className="text-xs text-[#1a4731] font-semibold">PMP</p>
                  <p className="text-[10px] text-zinc-400">Pondéré</p>
                </div>
                <p className="text-base font-black text-[#1a4731]">{fmtNumber(pmp)} MAD</p>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-100">
                <p className="text-xs text-zinc-500">Valeur stock (théorique)</p>
                <p className="text-sm font-semibold text-[#1a4731]">
                  {fmtNumber(valeurActuelle)} MAD
                </p>
              </div>
            </div>
          </div>

          {/* Ajustement rapide */}
          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-medium text-zinc-600 mb-3">Ajustement rapide du stock</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase tracking-widest">
                  Nouvelle quantité *
                </label>
                <input
                  type="number"
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(Number(e.target.value))}
                  className="w-full border border-zinc-200 rounded-lg h-9 px-3 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white"
                />
              </div>

              {isIncrease && (
                <div className="pt-1 space-y-2">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Entrée de stock – prix d'achat (optionnel)
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 block">
                        Prix unitaire HT (MAD)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={entryPriceHT}
                        onChange={(e) => setEntryPriceHT(e.target.value)}
                        placeholder="Laisser vide pour ne pas modifier le PMP"
                        className="w-full border border-zinc-200 rounded-lg h-9 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] font-bold text-zinc-400 mb-1 block">
                        TVA (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={entryTva}
                        onChange={(e) => setEntryTva(Number(e.target.value))}
                        className="w-full border border-zinc-200 rounded-lg h-9 px-2 text-xs font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white"
                      />
                    </div>
                  </div>
                  {entryPriceHT && Number(entryPriceHT) > 0 && (
                    <p className="text-[10px] text-zinc-500">
                      Nouveau PMP estimé : <span className="font-bold text-[#1a4731]">{fmtNumber(newPmp)} MAD</span>
                    </p>
                  )}
                  {(!entryPriceHT || Number(entryPriceHT) <= 0) && (
                    <p className="text-[10px] text-zinc-400 italic">
                      PMP inchangé.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase tracking-widest">
                  Motif * <span className="normal-case font-normal">(min. 3)</span>
                </label>
                <input
                  value={adjustMotif}
                  onChange={(e) => setAdjustMotif(e.target.value)}
                  placeholder="Motif…"
                  className={cn(
                    'w-full border rounded-lg h-9 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white',
                    adjustMotif.trim().length > 0 && adjustMotif.trim().length < 3
                      ? 'border-red-300'
                      : 'border-zinc-200',
                  )}
                />
              </div>
              <button
                disabled={!canAdjust}
                onClick={handleAdjust}
                className="w-full h-9 rounded-lg bg-[#1a4731] hover:bg-[#153d28] text-white text-xs font-semibold disabled:opacity-40"
              >
                Valider
              </button>
            </div>

            {/* Lien vers le journal des mouvements */}
            <button
              onClick={() => router.push(`/dashboard/responsable/journal?produit=${product.id}`)}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#1a4731] bg-[#E8F5E9] border border-[#1a4731]/20 hover:bg-[#1a4731] hover:text-white hover:shadow-md transition-all"
            >
              <History className="w-4 h-4" />
              Voir tous les mouvements
            </button>
          </div>
        </div>
      </div>

      {/* Pied */}
      <div className="flex justify-end px-6 py-4 border-t border-zinc-100 bg-white sticky bottom-0 z-10">
        <button
          onClick={onClose}
          className="h-9 px-5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Fermer
        </button>
      </div>
    </>
  );
}