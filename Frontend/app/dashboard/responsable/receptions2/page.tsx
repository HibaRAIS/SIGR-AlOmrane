'use client';

import { useState } from 'react';
import { StatusPill } from '@/components/shared/StatusPill';
import { commandes, produits } from '@/lib/mock-data';
import { PackageCheck, Plus, Search, CheckCircle, ArrowRight, TrendingUp, X, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LigneReceptionForm {
  produitId: string;
  designation: string;
  codeArticle: string;
  uniteMesure: string;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixUnitaireHT: number;
  tauxTVA: number;
  pmpAvant: number;
  pmpApres: number;
}

function NouvelleReceptionModal({ onClose }: { onClose: () => void }) {
  const [selectedCmd, setSelectedCmd] = useState('');
  const [lignes, setLignes] = useState<LigneReceptionForm[]>([]);
  const [step, setStep] = useState(1);

  const handleSelectCmd = (cmdId: string) => {
    setSelectedCmd(cmdId);
    const cmd = commandes.find(c => c.id === cmdId);
    if (cmd) {
      const newLignes: LigneReceptionForm[] = cmd.lignes.map(l => {
        const prod = produits.find(p => p.id === l.produitId);
        const stockActuel = prod?.stockDisponible ?? 0;
        const pmpAvant = prod?.pmpActuel ?? 0;
        return {
          produitId: l.produitId,
          designation: prod?.designation ?? '',
          codeArticle: prod?.codeArticle ?? '',
          uniteMesure: prod?.uniteMesure ?? '',
          quantiteCommandee: l.quantiteCommandee - l.quantiteRecue,
          quantiteRecue: l.quantiteCommandee - l.quantiteRecue,
          prixUnitaireHT: l.prixUnitaireHT,
          tauxTVA: l.tauxTVA,
          pmpAvant,
          pmpApres: stockActuel <= 0
            ? l.prixUnitaireHT
            : parseFloat(((stockActuel * pmpAvant + (l.quantiteCommandee - l.quantiteRecue) * l.prixUnitaireHT) / (stockActuel + l.quantiteCommandee - l.quantiteRecue)).toFixed(2)),
        };
      });
      setLignes(newLignes);
      setStep(2);
    }
  };

  const updateQte = (idx: number, val: number) => {
    setLignes(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const prod = produits.find(p => p.id === l.produitId);
      const stockActuel = Math.max(0, prod?.stockDisponible ?? 0);
      const newPmp = stockActuel <= 0 || (stockActuel + val) <= 0
        ? l.prixUnitaireHT
        : parseFloat(((stockActuel * l.pmpAvant + val * l.prixUnitaireHT) / (stockActuel + val)).toFixed(2));
      return { ...l, quantiteRecue: val, pmpApres: newPmp };
    }));
  };

  const totalHT = lignes.reduce((s, l) => s + l.quantiteRecue * l.prixUnitaireHT, 0);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8FBF9] flex-shrink-0">
          <h2 className="font-bold text-gray-900">Nouvelle Réception</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={cn('w-8 h-1.5 rounded-full transition-colors', step >= s ? 'bg-[#1D6F42]' : 'bg-gray-200')} />
              ))}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Étape 1 — Sélectionner une commande</h3>
              <div className="space-y-3">
                {commandes.filter(c => c.statut !== 'SOLDE' && c.statut !== 'ANNULE').map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => handleSelectCmd(cmd.id)}
                    className="w-full text-left border-2 border-gray-100 hover:border-[#1D6F42]/40 rounded-xl p-4 transition-all hover:bg-[#F8FBF9]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-bold text-gray-900">{cmd.numero}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{cmd.fournisseur?.raisonSociale}</p>
                      </div>
                      <div className="text-right">
                        <StatusPill status={cmd.statut} size="sm" />
                        <p className="text-sm font-bold text-[#1D6F42] mt-1 font-mono">{cmd.montantTotalHT.toLocaleString('fr-MA')} MAD HT</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Étape 2 — Saisir les quantités reçues</h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Produit', 'Qté rest.', 'Qté reçue', 'Prix HT', 'PMP avant', 'PMP après'].map(h => (
                        <th key={h} className="px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lignes.map((ligne, idx) => (
                      <tr key={ligne.produitId} className="hover:bg-gray-50">
                        <td className="px-3 py-3">
                          <p className="text-xs font-semibold text-gray-800">{ligne.designation}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{ligne.codeArticle}</p>
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold text-gray-700">{ligne.quantiteCommandee}</td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={ligne.quantiteRecue}
                            onChange={e => updateQte(idx, parseInt(e.target.value) || 0)}
                            className="w-20 h-7 rounded-lg border-2 border-[#1D6F42]/30 text-sm text-center font-bold text-[#1D6F42] outline-none focus:border-[#1D6F42]"
                            min={0}
                            max={ligne.quantiteCommandee}
                          />
                        </td>
                        <td className="px-3 py-3 text-xs font-mono text-gray-600">{ligne.prixUnitaireHT.toFixed(2)}</td>
                        <td className="px-3 py-3 text-xs font-mono text-gray-600">{ligne.pmpAvant.toFixed(2)}</td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-mono font-bold text-[#1D6F42]">{ligne.pmpApres.toFixed(2)}</span>
                          {ligne.pmpApres !== ligne.pmpAvant && (
                            <span className={cn(
                              'ml-1 text-[9px] font-semibold',
                              ligne.pmpApres > ligne.pmpAvant ? 'text-orange-500' : 'text-green-600'
                            )}>
                              {ligne.pmpApres > ligne.pmpAvant ? '▲' : '▼'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#E8F5E9] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-label">Total HT réceptionné</p>
                  <p className="text-2xl font-black text-[#1D6F42] font-mono">{totalHT.toLocaleString('fr-MA')} MAD</p>
                </div>
                <div className="text-right">
                  <p className="text-label">TVA estimée</p>
                  <p className="text-lg font-bold text-[#1D6F42]/70 font-mono">{(totalHT * 0.2).toLocaleString('fr-MA')} MAD</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm text-gray-600 font-medium rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors">
              Retour
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors ml-auto">
            Annuler
          </button>
          {step === 2 && (
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[#1D6F42] text-white rounded-xl hover:bg-[#175c36] transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Valider la réception
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReceptionsPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 space-y-6">
      {showModal && <NouvelleReceptionModal onClose={() => setShowModal(false)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Réceptions ce mois', value: '8', color: '#1D6F42', bg: '#E8F5E9' },
          { label: 'Entrées en valeur', value: '186k MAD', color: '#1565C0', bg: '#E3F2FD' },
          { label: 'Commandes à réceptionner', value: commandes.filter(c => c.statut === 'EN_ATTENTE' || c.statut === 'RECU_PARTIEL').length, color: '#E65100', bg: '#FFF3E0' },
          { label: 'PMP moyen', value: '–2.1%', color: '#6A1B9A', bg: '#F3E5F5' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-gray-100 p-4">
            <div className="text-xl font-bold mb-0.5" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#1D6F42] text-white text-sm font-semibold hover:bg-[#175c36] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle réception
        </button>
      </div>

      {/* Commandes en attente de réception */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Commandes en attente de réception</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {commandes.filter(c => c.statut === 'EN_ATTENTE' || c.statut === 'RECU_PARTIEL').map(cmd => (
            <div key={cmd.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                <PackageCheck className="w-5 h-5 text-[#1D6F42]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-gray-900">{cmd.numero}</span>
                  <StatusPill status={cmd.statut} size="sm" />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{cmd.fournisseur?.raisonSociale} · {cmd.lignes.length} articles</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 font-mono">{cmd.montantTotalHT.toLocaleString('fr-MA')} MAD</p>
                <p className="text-[11px] text-gray-400">Livraison: {cmd.dateLivraisonPrevue?.toLocaleDateString('fr-MA') || '—'}</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#1D6F42] text-white text-xs font-semibold hover:bg-[#175c36] transition-colors"
              >
                <PackageCheck className="w-3 h-3" />
                Réceptionner
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
