import React, { useMemo } from 'react';
import { BarChart2, Tag } from 'lucide-react';
import { Product } from '@/types/catalogue';
import { fmtNumber } from '@/lib/catalogue/utils';
import { CATEGORY_COLORS } from '@/lib/catalogue/constants';
import { cn } from '@/lib/utils';

/**
 * Panneau d'analyse du catalogue.
 * Affiche la valorisation par catégorie et l'analyse ABC (Pareto).
 * Les données proviennent directement du backend (quantité théorique et PMP).
 */
export default function AnalysePanel({ products }: { products: Product[] }) {
  /* --------------------- Valorisation par catégorie --------------------- */
  const byCategory = useMemo(() => {
    const map: Record<string, { count: number; value: number; critique: number; faible: number }> = {};
    products.forEach((p) => {
      const rootCat = p.category || 'Général';
      if (!map[rootCat]) map[rootCat] = { count: 0, value: 0, critique: 0, faible: 0 };
      map[rootCat].count++;

      const valeur = Math.max(0, p.quantiteTheorique) * (p.avgPrice ?? 0);
      map[rootCat].value += valeur;

      // Statut basé sur la quantité théorique et le seuil
      const qte = p.quantiteTheorique;
      const seuil = p.minThreshold;
      if (qte <= 0) map[rootCat].critique++;
      else if (qte <= seuil) map[rootCat].faible++;
    });
    return Object.entries(map)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  const totalValue = byCategory.reduce((s, c) => s + c.value, 0);

  /* ------------------------ Analyse ABC (Pareto) ------------------------ */
  const abcAnalysis = useMemo(() => {
    const sorted = [...products]
      .map((p) => ({
        ...p,
        stockValue: Math.max(0, p.quantiteTheorique) * (p.avgPrice ?? 0),
      }))
      .sort((a, b) => b.stockValue - a.stockValue);
    const total = sorted.reduce((s, p) => s + p.stockValue, 0);
    let cumul = 0;
    return sorted.map((p) => {
      cumul += p.stockValue;
      const pct = total > 0 ? (cumul / total) * 100 : 0;
      return { ...p, class: pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C' };
    });
  }, [products]);

  const abcCounts = useMemo(
    () => ({
      A: abcAnalysis.filter((p) => p.class === 'A').length,
      B: abcAnalysis.filter((p) => p.class === 'B').length,
      C: abcAnalysis.filter((p) => p.class === 'C').length,
    }),
    [abcAnalysis]
  );

  return (
    <div className="space-y-5">
      {/* ---------- Valorisation ---------- */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-800">
            Valorisation par catégorie (PMP)
          </span>
          <span className="ml-auto text-xs font-semibold text-[#1a4731]">
            {fmtNumber(totalValue)} MAD
          </span>
        </div>
        <div className="p-5 space-y-3">
          {byCategory.map(({ category, value, count, critique, faible }) => {
            const pct = totalValue > 0 ? (value / totalValue) * 100 : 0;
            const color = CATEGORY_COLORS[category] ?? '#888';
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-800">{category}</span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">
                      {count} art.
                    </span>
                    {critique > 0 && (
                      <span className="text-[10px] bg-red-50 text-red-600 rounded-full px-2 py-0.5 border border-red-100">
                        {critique} rupture
                      </span>
                    )}
                    {faible > 0 && (
                      <span className="text-[10px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 border border-amber-100">
                        {faible} faible
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-zinc-700">
                      {fmtNumber(value)} MAD
                    </span>
                    <span className="text-[10px] text-zinc-400 ml-1.5">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Analyse ABC ---------- */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <Tag className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-800">
            Analyse ABC des stocks (valeur PMP)
          </span>
          <div className="ml-auto flex gap-2">
            {(['A', 'B', 'C'] as const).map((cls) => (
              <span
                key={cls}
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                  cls === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  cls === 'B' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-zinc-100 text-zinc-600 border-zinc-200'
                )}
              >
                {cls}: {abcCounts[cls]}
              </span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-50">
          {abcAnalysis.slice(0, 8).map((p) => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 transition-colors">
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                  p.class === 'A' ? 'bg-emerald-100 text-emerald-700' :
                  p.class === 'B' ? 'bg-amber-100 text-amber-700' :
                  'bg-zinc-100 text-zinc-500'
                )}
              >
                {p.class}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{p.name}</p>
                <p className="text-[10px] text-zinc-400">PMP : {fmtNumber(p.avgPrice ?? 0)} MAD</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-zinc-700">{fmtNumber(p.stockValue)} MAD</p>
                <p className="text-[10px] text-zinc-400">{p.quantiteTheorique} unités</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Rotation (supprimée car nécessite les mouvements) ---------- */}
    </div>
  );
}