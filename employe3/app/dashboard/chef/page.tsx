"use client"

import { useState, useEffect } from "react"
import { Search, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"

// --- TYPES ---
type Priorite = "urgente" | "haute" | "normale"
type Statut   = "en_attente" | "approuvee" | "rejetee"

interface Demande {
  id: string
  reference: string
  employe: { nom: string; initiales: string; service: string }
  datesoumission: string
  priorite: Priorite
  statut: Statut
  articles: { id: string; nom: string; quantiteDemandee: number }[]
}

const PRIORITE_CONFIG: Record<Priorite, any> = {
  urgente: { label: "Urgente", color: "text-red-700", bg: "bg-red-50 border-red-200" },
  haute:   { label: "Haute", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  normale: { label: "Normale", color: "text-slate-600", bg: "bg-slate-50 border-slate-200" },
}

const API_URL = "http://localhost:8081"

export default function FileValidationPage() {
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchDemandes = async () => {
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_URL}/api/demandes/a-valider`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      
      const mapped = data.map((d: any) => ({
        id: d.id,
        reference: d.reference,
        employe: { 
            nom: d.employeNom, 
            initiales: d.employeNom?.substring(0,2).toUpperCase() ?? "??", 
            service: d.structureNom 
        },
        datesoumission: d.dateCreation,
        // ✅ CORRECTION 1 : mapping sécurisé de la priorité
        priorite: (["urgente","haute","normale"].includes(d.urgence?.toLowerCase())
            ? d.urgence.toLowerCase()
            : "normale") as Priorite,
        statut: d.statut === "EN_ATTENTE" ? "en_attente" : (d.statut === "APPROUVEE" ? "approuvee" : "rejetee"),
        articles: (d.lignes ?? []).map((l: any) => ({ 
            id: String(l.produitId), 
            nom: l.produitDesignation, 
            quantiteDemandee: l.quantite 
        }))
      }))
      setDemandes(mapped)
    } catch (e) {
      console.error("Erreur API", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDemandes() }, [])

  const handleAction = async (id: string, action: 'approuver' | 'rejeter') => {
    const token = localStorage.getItem("token")
    try {
        await fetch(`${API_URL}/api/demandes/${id}/${action}`, {
            method: 'PUT',
            headers: { "Authorization": `Bearer ${token}` }
        })
        fetchDemandes()
    } catch (e) { alert("Erreur action") }
  }

  const filtered = demandes.filter(d => 
    d.reference.toLowerCase().includes(search.toLowerCase()) || 
    d.employe.nom.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="text-[#004d2c]" /> File de Validation
        </h1>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
            className="w-full pl-11 pr-4 py-3 border rounded-2xl shadow-sm outline-none text-sm" 
            placeholder="Rechercher une demande réelle..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
            <p className="text-center col-span-full text-gray-400">Connexion au serveur Spring Boot...</p>
        ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl text-gray-400">
                <p className="font-bold">Aucune demande en attente de validation.</p>
            </div>
        ) : (
            filtered.map(d => {
              // ✅ CORRECTION 2 : fallback sur "normale" si la clé n'existe pas
              const config = PRIORITE_CONFIG[d.priorite] ?? PRIORITE_CONFIG["normale"]
              return (
                <div key={d.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                            <div className="w-10 h-10 bg-[#004d2c] text-white rounded-xl flex items-center justify-center font-bold">{d.employe.initiales}</div>
                            <div>
                                <p className="font-bold text-sm">{d.employe.nom}</p>
                                <p className="text-[10px] text-gray-400 uppercase">{d.reference} · {d.employe.service}</p>
                            </div>
                        </div>
                        <div className={cn("text-[10px] px-2 py-1 rounded-full font-bold uppercase", config.bg, config.color)}>
                            {config.label}
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-xl">
                        {d.articles.map(a => (
                            <div key={a.id} className="flex justify-between text-xs mb-1">
                                <span>{a.nom}</span>
                                <span className="font-bold">x {a.quantiteDemandee}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleAction(d.id, 'approuver')}
                            className="flex-1 py-2 bg-green-600 text-white rounded-xl text-xs font-bold"
                        >
                            Approuver
                        </button>
                        <button 
                            onClick={() => handleAction(d.id, 'rejeter')}
                            className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
                        >
                            Rejeter
                        </button>
                    </div>
                </div>
              )
            })
        )}
      </div>
    </div>
  )
}