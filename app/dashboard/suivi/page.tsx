"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Package,
  Filter,
  CalendarDays,
  User,
  AlertCircle,
  Save,
  Plus,
  Minus,
} from "lucide-react"

interface RequestItem {
  id: number
  name: string
  quantity: number
  reference: string
}

interface Request {
  id: string
  title: string
  date: string
  status: "pending" | "approved" | "rejected" | "processing"
  statusLabel: string
  urgency: "Normal" | "Urgent" | "Critique"
  items: RequestItem[]
  justification: string
  approver?: string
  approvalDate?: string
  rejectionReason?: string
}

const initialRequests: Request[] = [
  {
    id: "DEM-2026-0148",
    title: "Fournitures de bureau",
    date: "11 Mars 2026",
    status: "pending",
    statusLabel: "En attente",
    urgency: "Normal",
    items: [
      { id: 1, name: "Stylo bille bleu", quantity: 10, reference: "STY-001" },
      { id: 2, name: "Ramette papier A4", quantity: 5, reference: "PAP-A4-500" },
      { id: 3, name: "Classeur à levier", quantity: 3, reference: "CLS-A4-01" },
    ],
    justification: "Besoin de renouveler les fournitures pour le service administratif",
  },
  {
    id: "DEM-2026-0145",
    title: "Fournitures de bureau",
    date: "10 Mars 2026",
    status: "approved",
    statusLabel: "Approuvée",
    urgency: "Normal",
    items: [
      { id: 1, name: "Post-it couleurs", quantity: 12, reference: "POST-CLR" },
      { id: 2, name: "Agrafeuse", quantity: 1, reference: "AGR-STD-01" },
      { id: 3, name: "Agrafes 24/6", quantity: 5, reference: "AGR-24-6" },
      { id: 4, name: "Stylo noir", quantity: 10, reference: "STY-002" },
      { id: 5, name: "Marqueurs", quantity: 4, reference: "MRQ-CLR" },
    ],
    justification: "Réapprovisionnement mensuel standard",
    approver: "Ahmed Benali",
    approvalDate: "10 Mars 2026",
  },
  {
    id: "DEM-2026-0142",
    title: "Cartouches d'imprimante",
    date: "8 Mars 2026",
    status: "processing",
    statusLabel: "En traitement",
    urgency: "Urgent",
    items: [
      { id: 1, name: "Cartouche HP 305 Noir", quantity: 2, reference: "HP-305-BK" },
      { id: 2, name: "Cartouche HP 305 Couleur", quantity: 1, reference: "HP-305-CLR" },
    ],
    justification: "Stock épuisé, impression urgente de rapports",
    approver: "Ahmed Benali",
    approvalDate: "8 Mars 2026",
  },
  {
    id: "DEM-2026-0138",
    title: "Matériel informatique",
    date: "5 Mars 2026",
    status: "rejected",
    statusLabel: "Refusée",
    urgency: "Normal",
    items: [
      { id: 1, name: "Souris sans fil", quantity: 1, reference: "SOU-WL-01" },
    ],
    justification: "Remplacement souris défectueuse",
    approver: "Ahmed Benali",
    approvalDate: "6 Mars 2026",
    rejectionReason: "Budget dépassé pour ce mois. Veuillez resoumettre le mois prochain.",
  },
  {
    id: "DEM-2026-0130",
    title: "Consommables divers",
    date: "1 Mars 2026",
    status: "approved",
    statusLabel: "Approuvée",
    urgency: "Normal",
    items: [
      { id: 1, name: "Ramette papier A4", quantity: 10, reference: "PAP-A4-500" },
      { id: 2, name: "Enveloppes A5", quantity: 100, reference: "ENV-A5" },
      { id: 3, name: "Classeurs", quantity: 5, reference: "CLS-A4-01" },
    ],
    justification: "Approvisionnement trimestriel",
    approver: "Ahmed Benali",
    approvalDate: "2 Mars 2026",
  },
]

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  approved: { icon: CheckCircle2, color: "text-[#1D6F42]", bg: "bg-[#1D6F42]/10", border: "border-[#1D6F42]/20" },
  rejected: { icon: XCircle, color: "text-[#E31837]", bg: "bg-[#E31837]/10", border: "border-[#E31837]/20" },
  processing: { icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
}

const urgencyConfig = {
  Normal: { color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" },
  Urgent: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" },
  Critique: { color: "text-[#E31837]", bg: "bg-[#E31837]/10", border: "border-[#E31837]/30" },
}

export default function SuiviPage() {
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || request.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: Request["status"], label: string) => {
    const config = statusConfig[status]
    return (
      <Badge className={`${config.bg} ${config.color} border ${config.border} hover:${config.bg}`}>
        <config.icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const getUrgencyBadge = (urgency: Request["urgency"]) => {
    const config = urgencyConfig[urgency]
    return (
      <Badge variant="outline" className={`${config.bg} ${config.color} border ${config.border}`}>
        {urgency}
      </Badge>
    )
  }

  const handleEditRequest = (request: Request) => {
    setEditingRequest({ ...request, items: [...request.items.map(item => ({ ...item }))] })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingRequest) {
      setRequests(prev => prev.map(r => r.id === editingRequest.id ? editingRequest : r))
      setEditDialogOpen(false)
      setEditingRequest(null)
    }
  }

  const handleDeleteRequest = () => {
    if (requestToDelete) {
      setRequests(prev => prev.filter(r => r.id !== requestToDelete))
      setDeleteDialogOpen(false)
      setRequestToDelete(null)
    }
  }

  const updateItemQuantity = (itemId: number, delta: number) => {
    if (editingRequest) {
      setEditingRequest({
        ...editingRequest,
        items: editingRequest.items.map(item => 
          item.id === itemId 
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
      })
    }
  }

  const removeItem = (itemId: number) => {
    if (editingRequest && editingRequest.items.length > 1) {
      setEditingRequest({
        ...editingRequest,
        items: editingRequest.items.filter(item => item.id !== itemId)
      })
    }
  }

  const openDetails = (request: Request) => {
    setSelectedRequest(request)
    setDetailsOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1D6F42]">Suivi des Demandes</h1>
        <p className="text-muted-foreground mt-1">
          Consultez l&apos;état d&apos;avancement de vos demandes de matériel
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "processing").length}</p>
                <p className="text-xs text-muted-foreground">En traitement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1D6F42]/10">
                <CheckCircle2 className="w-5 h-5 text-[#1D6F42]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "approved").length}</p>
                <p className="text-xs text-muted-foreground">Approuvées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#E31837]/10">
                <XCircle className="w-5 h-5 text-[#E31837]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{requests.filter((r) => r.status === "rejected").length}</p>
                <p className="text-xs text-muted-foreground">Refusées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou titre..."
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
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="processing">En traitement</SelectItem>
                <SelectItem value="approved">Approuvée</SelectItem>
                <SelectItem value="rejected">Refusée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <Card key={request.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-xl ${statusConfig[request.status].bg}`}>
                    {(() => {
                      const Icon = statusConfig[request.status].icon
                      return <Icon className={`w-6 h-6 ${statusConfig[request.status].color}`} />
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-sm text-[#1D6F42] font-semibold">{request.id}</span>
                      {getStatusBadge(request.status, request.statusLabel)}
                      {getUrgencyBadge(request.urgency)}
                    </div>
                    <h3 className="font-semibold">{request.title}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {request.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {request.items.length} article(s)
                      </span>
                      {request.approver && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {request.approver}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:ml-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openDetails(request)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Détails
                  </Button>

                  {request.status === "pending" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditRequest(request)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[#E31837] hover:text-[#E31837] hover:bg-[#E31837]/10"
                        onClick={() => {
                          setRequestToDelete(request.id)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredRequests.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Aucune demande trouvée</h3>
              <p className="text-muted-foreground text-sm">
                Modifiez vos critères de recherche ou créez une nouvelle demande
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-[#1D6F42]">{selectedRequest.id}</span>
                  {getStatusBadge(selectedRequest.status, selectedRequest.statusLabel)}
                </DialogTitle>
                <DialogDescription>
                  Détails de la demande soumise le {selectedRequest.date}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Titre</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.title}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Justification</h4>
                  <p className="text-sm text-muted-foreground">{selectedRequest.justification}</p>
                </div>
                
                {/* Articles List */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Articles demandés</h4>
                  <div className="space-y-2">
                    {selectedRequest.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Réf: {item.reference}</p>
                        </div>
                        <Badge variant="secondary" className="bg-[#1D6F42]/10 text-[#1D6F42]">Qté: {item.quantity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Total articles</h4>
                    <p className="text-sm text-muted-foreground">{selectedRequest.items.length} article(s)</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Urgence</h4>
                    {getUrgencyBadge(selectedRequest.urgency)}
                  </div>
                </div>
                {selectedRequest.approver && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Historique de validation</h4>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{selectedRequest.approver}</p>
                        <p className="text-xs text-muted-foreground">{selectedRequest.approvalDate}</p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedRequest.rejectionReason && (
                  <div className="p-3 bg-[#E31837]/5 border border-[#E31837]/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-[#E31837] mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#E31837]">Motif du refus</p>
                        <p className="text-sm text-[#E31837]/80 mt-1">{selectedRequest.rejectionReason}</p>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1D6F42]">
              <Edit className="w-5 h-5" />
              Modifier la demande
            </DialogTitle>
            <DialogDescription>
              {editingRequest?.id} - Modifiez les détails de votre demande
            </DialogDescription>
          </DialogHeader>
          
          {editingRequest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la demande</Label>
                <Input
                  id="title"
                  value={editingRequest.title}
                  onChange={(e) => setEditingRequest({ ...editingRequest, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Niveau d&apos;urgence</Label>
                <Select 
                  value={editingRequest.urgency} 
                  onValueChange={(value: "Normal" | "Urgent" | "Critique") => setEditingRequest({ ...editingRequest, urgency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="Critique">Critique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Articles</Label>
                <div className="space-y-2">
                  {editingRequest.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Réf: {item.reference}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        {editingRequest.items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#E31837] hover:text-[#E31837] hover:bg-[#E31837]/10"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  value={editingRequest.justification}
                  onChange={(e) => setEditingRequest({ ...editingRequest, justification: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button className="bg-[#1D6F42] hover:bg-[#1D6F42]/90" onClick={handleSaveEdit}>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#E31837]">
              <Trash2 className="w-5 h-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler cette demande ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              className="bg-[#E31837] hover:bg-[#E31837]/90"
              onClick={handleDeleteRequest}
            >
              Supprimer la demande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
