import React from "react"
import type { BonSortie } from "@/types"

const logoUrl = "/images/alomrane-logo.png"

const formatNumber = (n: number) => new Intl.NumberFormat("fr-MA").format(n)
const formatMAD = (n: number) =>
  new Intl.NumberFormat("fr-MA", { style: "currency", currency: "MAD" }).format(n)
const formatDateTime = (d: Date | string) => new Date(d).toLocaleString("fr-MA")

export function BonSortieA4({ bon }: { bon: BonSortie }) {
  const totalQte = bon.lignes.reduce((s: number, l) => s + l.quantiteServie, 0)
  const totalValeur = bon.lignes.reduce((s: number, l) => s + l.quantiteServie * l.pmpSnapshot, 0)

  return (
    <div className="mx-auto w-[210mm] bg-white p-8 text-[13px] text-gray-900 shadow-xl print:shadow-none print:p-0">
      {/* En-tête */}
      <div className="flex items-start justify-between border-b-4 border-[#1D6F42] pb-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border-2 border-[#1D6F42]/20 bg-[#F1F8E9] p-1">
            <img src={logoUrl} alt="Al Omrane" className="h-full w-full object-contain" />
          </div>
          <div>
            <div className="text-xl font-bold text-[#1D6F42]">GROUPE AL OMRANE</div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              SIGR — Système Intégré de Gestion des Ressources
            </div>
            <div className="mt-1 text-[10px] text-gray-400">Bon de sortie N° {bon.numero}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="rounded-lg border-2 border-[#1D6F42] bg-[#F1F8E9] px-3 py-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1B5E20]">
              Date d'émission
            </div>
            <div className="text-sm font-bold text-gray-800">{formatDateTime(bon.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Informations bénéficiaire */}
      <div className="mt-5 grid grid-cols-2 gap-4 text-[12px]">
        <div className="rounded-lg border bg-gray-50 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Demandeur</div>
          <div className="font-bold">{bon.demande?.demandeurNom ?? "—"}</div>
        </div>
        <div className="rounded-lg border bg-gray-50 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Département</div>
          <div className="font-bold">{bon.departementBeneficiaire}</div>
        </div>
      </div>

      {/* Tableau des articles */}
      <div className="mt-5">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#0d3b66] text-white">
              <th className="border border-[#0d3b66] px-2 py-1.5 text-left">N°</th>
              <th className="border border-[#0d3b66] px-2 py-1.5 text-left">Code article</th>
              <th className="border border-[#0d3b66] px-2 py-1.5 text-left">Désignation</th>
              <th className="border border-[#0d3b66] px-2 py-1.5 text-right">Qté</th>
              <th className="border border-[#0d3b66] px-2 py-1.5 text-right">PMP</th>
              <th className="border border-[#0d3b66] px-2 py-1.5 text-right">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {bon.lignes.map((l, i) => (
              <tr key={l.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/70"}>
                <td className="border px-2 py-1 text-center">{i + 1}</td>
                <td className="border px-2 py-1 font-mono text-[11px]">{l.produit?.codeArticle ?? "—"}</td>
                <td className="border px-2 py-1">{l.produit?.designation ?? "Produit supprimé"}</td>
                <td className="border px-2 py-1 text-right">{formatNumber(l.quantiteServie)}</td>
                <td className="border px-2 py-1 text-right">{formatNumber(l.pmpSnapshot)}</td>
                <td className="border px-2 py-1 text-right">{formatNumber(l.quantiteServie * l.pmpSnapshot)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#F1F8E9] font-bold">
              <td colSpan={3} className="border px-2 py-1.5 text-right text-sm">TOTAL</td>
              <td className="border px-2 py-1.5 text-right">{formatNumber(totalQte)}</td>
              <td className="border px-2 py-1.5"></td>
              <td className="border px-2 py-1.5 text-right text-[#1D6F42] text-base">{formatMAD(totalValeur)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Signatures */}
      <div className="mt-8 grid grid-cols-3 gap-6 text-[11px]">
        <SignatureBlock label="Demandeur" img={bon.signatureDemandeur} />
        <SignatureBlock label="Réceptionnaire" img={bon.signatureReceptionnaire} />
        <SignatureBlock label="Magasinier" img={bon.signatureMagasinier} />
        <SignatureBlock label="Chef Département" img={bon.signatureChefDept} />
        <SignatureBlock label="Directeur" img={bon.signatureDirecteur} />
        <SignatureBlock label="Chef Hiérarchique" img={bon.signatureChefHierarchique} />
      </div>

      <div className="mt-6 border-t border-gray-200 pt-3 text-center text-[10px] text-gray-400">
        Document généré par SIGR — Groupe Al Omrane • {new Date().toLocaleDateString('fr-MA')}
      </div>
    </div>
  )
}

function SignatureBlock({ label, img }: { label: string; img?: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-14 w-full items-end justify-center border-2 border-dashed border-gray-400 rounded-md p-1">
        {img ? (
          <img src={img} alt={label} className="h-10 object-contain" />
        ) : (
          <span className="text-[9px] text-gray-300">{label}</span>
        )}
      </div>
      <span className="mt-1 text-center font-semibold uppercase tracking-wider text-gray-600">{label}</span>
    </div>
  )
}