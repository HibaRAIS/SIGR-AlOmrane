"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Search, Clock, CheckCircle2, XCircle, Eye, Package, Filter,
  CalendarDays, User, AlertCircle,
} from "lucide-react"

const API_URL = "http://localhost:8081"

const statusConfig: Record<string, any> = {
  EN_ATTENTE: { icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",       border: "border-amber-200",     label: "En attente"   },
  APPROUVEE:  { icon: CheckCircle2, color: "text-[#1D6F42]",  bg: "bg-[#1D6F42]/10",  border: "border-[#1D6F42]/20",  label: "Approuvée"    },
  REFUSEE:    { icon: XCircle,      color: "text-[#E31837]",  bg: "bg-[#E31837]/10",  border: "border-[#E31837]/20",  label: "Refusée"      },
}

export default function SuiviPage() {
  const [demandes, setDemandes]               = useState<any[]>([])
  const [loading, setLoading]                 = useState(true)
  const [searchQuery, setSearchQuery]         = useState("")
  const [statusFilter, setStatusFilter]       = useState("all")
  const [selectedDemande, setSelectedDemande] = useState<any | null>(null)
  const [detailsOpen, setDetailsOpen]         = useState(false)

  const fetchDemandes = async () => {
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`${API_URL}/api/demandes/mes-demandes`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const data = await res.json()
      setDemandes(data)
    } catch (e) {
      console.error("Erreur chargement demandes", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDemandes() }, [])

  const filtered = demandes.filter(d => {
    const matchSearch = d.reference?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || d.statut === statusFilter
    return matchSearch && matchStatus
  })

  const getStatusBadge = (statut: string) => {
    const config = statusConfig[statut] ?? statusConfig["EN_ATTENTE"]
    const Icon = config.icon
    return (
      <Badge className={`${config.bg} ${config.color} border ${config.border} hover:${config.bg}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1D6F42]">Suivi des Demandes</h1>
        <p className="text-muted-foreground mt-1">Consultez l'état d'avancement de vos demandes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50"><Clock className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold">{demandes.filter(d => d.statut === "EN_ATTENTE").length}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </div>
        </CardContent></Card>

        <Card className="border-0 shadow-sm"><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1D6F42]/10"><CheckCircle2 className="w-5 h-5 text-[#1D6F42]" /></div>
            <div>
              <p className="text-2xl font-bold">{demandes.filter(d => d.statut === "APPROUVEE").length}</p>
              <p className="text-xs text-muted-foreground">Approuvées</p>
            </div>
          </div>
        </CardContent></Card>

        <Card className="border-0 shadow-sm"><CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#E31837]/10"><XCircle className="w-5 h-5 text-[#E31837]" /></div>
            <div>
              <p className="text-2xl font-bold">{demandes.filter(d => d.statut === "REFUSEE").length}</p>
              <p className="text-xs text-muted-foreground">Refusées</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-sm"><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-11">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="EN_ATTENTE">En attente</SelectItem>
              <SelectItem value="APPROUVEE">Approuvée</SelectItem>
              <SelectItem value="REFUSEE">Refusée</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {/* Liste */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground">Chargement...</p>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Aucune demande trouvée</h3>
          </CardContent></Card>
        ) : filtered.map((d) => {
          const config = statusConfig[d.statut] ?? statusConfig["EN_ATTENTE"]
          const Icon = config.icon
          return (
            <Card key={d.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-xl ${config.bg}`}>
                      <Icon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-sm text-[#1D6F42] font-semibold">{d.reference}</span>
                        {getStatusBadge(d.statut)}
                        <Badge variant="outline">{d.urgence}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(d.dateCreation).toLocaleDateString("fr-FR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {d.lignes?.length ?? 0} article(s)
                        </span>
                        {d.valideParNom && d.valideParNom !== "Non encore validée" && (
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {d.valideParNom}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setSelectedDemande(d); setDetailsOpen(true) }}>
                    <Eye className="w-4 h-4 mr-2" /> Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog Détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedDemande && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-[#1D6F42]">{selectedDemande.reference}</span>
                  {getStatusBadge(selectedDemande.statut)}
                </DialogTitle>
                <DialogDescription>
                  Soumise le {new Date(selectedDemande.dateCreation).toLocaleDateString("fr-FR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Justification</h4>
                  <p className="text-sm text-muted-foreground">{selectedDemande.justification}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Articles demandés</h4>
                  <div className="space-y-2">
                    {selectedDemande.lignes?.map((l: any) => (
                      <div key={l.produitId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{l.produitDesignation}</p>
                          <p className="text-xs text-muted-foreground">Réf: {l.produitReference}</p>
                        </div>
                        <Badge variant="secondary" className="bg-[#1D6F42]/10 text-[#1D6F42]">
                          Qté: {l.quantite}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedDemande.valideParNom && selectedDemande.valideParNom !== "Non encore validée" && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Validé par</h4>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{selectedDemande.valideParNom}</p>
                        {selectedDemande.dateValidation && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedDemande.dateValidation).toLocaleDateString("fr-FR")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedDemande.motifRefus && (
                  <div className="p-3 bg-[#E31837]/5 border border-[#E31837]/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-[#E31837] mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#E31837]">Motif du refus</p>
                        <p className="text-sm text-[#E31837]/80 mt-1">{selectedDemande.motifRefus}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>Fermer</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}