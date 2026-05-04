"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  CalendarRange,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { demandeService } from "@/services/demande.service";
import { produitService, Produit } from "@/services/produit.service";

// Configuration des statuts
const statusConfig: Record<string, any> = {
  EN_VALIDATION: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "En attente" },
  VALIDEE: { icon: CheckCircle2, color: "text-[#1D6F42]", bg: "bg-[#1D6F42]/10", border: "border-[#1D6F42]/20", label: "Approuvée" },
  REFUSEE: { icon: XCircle, color: "text-[#E31837]", bg: "bg-[#E31837]/10", border: "border-[#E31837]/20", label: "Refusée" },
  EN_PREPARATION: { icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "En préparation" },
  LIVREE: { icon: Package, color: "text-green-700", bg: "bg-green-50", border: "border-green-200", label: "Livrée" },
};

const urgencyOptions = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENT", label: "Urgent" },
  { value: "CRITIQUE", label: "Critique" },
];

type DateFilterType = "all" | "today" | "week" | "month" | "custom";

interface Ligne {
  produitId: number;
  produitDesignation: string;
  produitReference: string;
  quantiteDemandee: number;
  quantiteAccordee: number;
  ligneId: number;
}

interface Demande {
  id: number;
  numeroDemande: string;
  statut: string;
  priorite: string;
  motif: string;
  dateDemande: string;
  employeNom: string;
  structureNom: string;
  lignes: Ligne[];
  validePar: string | null;
  dateValidation: string | null;
  motifRefus: string | null;
  annotation: string | null;
}

export default function SuiviPage() {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingDemande, setEditingDemande] = useState<Demande | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demandeToDelete, setDemandeToDelete] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [selectedProduitId, setSelectedProduitId] = useState<string>("");
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState<{ index: number } | null>(null);
  const [justificationError, setJustificationError] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const filteredProducts = produits.filter(p =>
    p.designation.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.codeArticle.toLowerCase().includes(productSearch.toLowerCase())
  );
  const [showProductList, setShowProductList] = useState(false);

  // Chargement des produits
  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const data = await produitService.getCatalogue();
        setProduits(data);
      } catch (error) {
        console.error("Erreur chargement produits", error);
      }
    };
    fetchProduits();
  }, []);

  // Récupération des demandes
  const fetchDemandes = async () => {
    try {
      setLoading(true);
      const data = await demandeService.getMesDemandes();
      setDemandes(data);
    } catch (error) {
      toast.error("Erreur lors du chargement des demandes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, []);

  // Filtre date
  const isDateInRange = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (dateFilter) {
      case "today": return date >= today;
      case "week": return date >= startOfWeek;
      case "month": return date >= startOfMonth;
      case "custom":
        if (!customStartDate && !customEndDate) return true;
        const start = customStartDate ? new Date(customStartDate) : null;
        const end = customEndDate ? new Date(customEndDate) : null;
        if (start && end) return date >= start && date <= end;
        if (start) return date >= start;
        if (end) return date <= end;
        return true;
      default: return true;
    }
  };

  // Filtrage global
  const filtered = demandes.filter(d => {
    const matchSearch = d.numeroDemande.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || d.statut === statusFilter;
    const matchUrgency = urgencyFilter === "all" || d.priorite === urgencyFilter;
    const matchDate = isDateInRange(d.dateDemande);
    return matchSearch && matchStatus && matchUrgency && matchDate;
  });

  // Statistiques
  const stats = {
    EN_VALIDATION: demandes.filter(d => d.statut === "EN_VALIDATION").length,
    VALIDEE: demandes.filter(d => d.statut === "VALIDEE").length,
    REFUSEE: demandes.filter(d => d.statut === "REFUSEE").length,
    EN_PREPARATION: demandes.filter(d => d.statut === "EN_PREPARATION").length,
    LIVREE: demandes.filter(d => d.statut === "LIVREE").length,
  };

  const getStatusBadge = (statut: string) => {
    const config = statusConfig[statut] ?? statusConfig["EN_VALIDATION"];
    const Icon = config.icon;
    return (
      <Badge className={`${config.bg} ${config.color} border ${config.border}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (priorite: string) => {
    switch (priorite) {
      case "CRITIQUE": return <Badge variant="destructive">Critique</Badge>;
      case "URGENT": return <Badge variant="default" className="bg-amber-600 hover:bg-amber-700">Urgent</Badge>;
      default: return <Badge variant="outline">Normal</Badge>;
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setUrgencyFilter("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const handleEdit = (demande: Demande) => {
    setEditingDemande(JSON.parse(JSON.stringify(demande)));
    setJustificationError("");
    setSelectedProduitId("");
    setNewItemQuantity(1);
    setProductSearch("");
    setEditDialogOpen(true);
  };

  const updateItemQuantity = (index: number, delta: number) => {
    if (!editingDemande) return;
    const newLignes = [...editingDemande.lignes];
    const newQty = newLignes[index].quantiteDemandee + delta;
    if (newQty < 1) return;
    newLignes[index].quantiteDemandee = newQty;
    newLignes[index].quantiteAccordee = newQty;
    setEditingDemande({ ...editingDemande, lignes: newLignes });
  };

  const confirmRemoveItem = (index: number) => setShowDeleteItemConfirm({ index });
  const handleRemoveItem = () => {
    if (!editingDemande || !showDeleteItemConfirm) return;
    const newLignes = editingDemande.lignes.filter((_, i) => i !== showDeleteItemConfirm.index);
    setEditingDemande({ ...editingDemande, lignes: newLignes });
    setShowDeleteItemConfirm(null);
    toast.success("Article supprimé");
  };

  const handleAddItem = () => {
    if (!selectedProduitId || !newItemQuantity || newItemQuantity < 1) {
      toast.error("Veuillez sélectionner un produit et une quantité valide");
      return;
    }
    const produit = produits.find(p => p.id === Number(selectedProduitId));
    if (!produit) {
      toast.error("Produit non trouvé");
      return;
    }
    const newLigne: Ligne = {
      produitId: produit.id,
      produitDesignation: produit.designation,
      produitReference: produit.codeArticle,
      quantiteDemandee: newItemQuantity,
      quantiteAccordee: newItemQuantity,
      ligneId: Date.now(),
    };
    setEditingDemande(prev => ({
      ...prev!,
      lignes: [...prev!.lignes, newLigne],
    }));
    setSelectedProduitId("");
    setProductSearch("");
    setNewItemQuantity(1);
    toast.success("Article ajouté");
  };

  const handleSaveEdit = async () => {
    if (!editingDemande) return;
    if (!editingDemande.motif || editingDemande.motif.trim().length < 20) {
      setJustificationError("La justification doit contenir au moins 20 caractères");
      toast.error("Justification trop courte (minimum 20 caractères)");
      return;
    }
    setJustificationError("");
    setSubmitting(true);
    try {
      const payload = {
        motif: editingDemande.motif,
        priorite: editingDemande.priorite,
        lignes: editingDemande.lignes.map(l => ({
          produitId: l.produitId,
          quantite: l.quantiteDemandee,
        })),
      };
      await demandeService.updateDemande(editingDemande.id, payload);
      toast.success("Demande modifiée avec succès");
      setEditDialogOpen(false);
      fetchDemandes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la modification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!demandeToDelete) return;
    setSubmitting(true);
    try {
      await demandeService.deleteDemande(demandeToDelete);
      toast.success("Demande supprimée avec succès");
      setDeleteDialogOpen(false);
      setDemandeToDelete(null);
      fetchDemandes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1D6F42]">Suivi des Demandes</h1>
        <p className="text-muted-foreground mt-1">Consultez et gérez vos demandes de matériel</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-amber-50"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{stats.EN_VALIDATION}</p><p className="text-xs text-muted-foreground">En attente</p></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-[#1D6F42]/10"><CheckCircle2 className="w-5 h-5 text-[#1D6F42]" /></div><div><p className="text-2xl font-bold">{stats.VALIDEE}</p><p className="text-xs text-muted-foreground">Approuvées</p></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-[#E31837]/10"><XCircle className="w-5 h-5 text-[#E31837]" /></div><div><p className="text-2xl font-bold">{stats.REFUSEE}</p><p className="text-xs text-muted-foreground">Refusées</p></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-50"><Package className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{stats.EN_PREPARATION}</p><p className="text-xs text-muted-foreground">En préparation</p></div></div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-50"><Package className="w-5 h-5 text-green-700" /></div><div><p className="text-2xl font-bold">{stats.LIVREE}</p><p className="text-xs text-muted-foreground">Livrées</p></div></div></CardContent></Card>
      </div>

      {/* Filtres */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          {/* Ligne 1 : recherche et bouton reset */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button variant="outline" size="sm" className="h-11 px-4 md:w-auto w-full" onClick={resetFilters}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
          {/* Ligne 2 : statut, urgence, période */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_VALIDATION">En attente</SelectItem>
                <SelectItem value="VALIDEE">Approuvée</SelectItem>
                <SelectItem value="REFUSEE">Refusée</SelectItem>
                <SelectItem value="EN_PREPARATION">En préparation</SelectItem>
                <SelectItem value="LIVREE">Livrée</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full sm:w-44 h-11">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Urgence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {urgencyOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilterType)}>
              <SelectTrigger className="w-full sm:w-48 h-11">
                <CalendarRange className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute la période</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="custom">Personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Ligne 3 : dates personnalisées */}
          {dateFilter === "custom" && (
            <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Date de début</Label>
                <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="mt-1 h-10" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Date de fin</Label>
                <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="mt-1 h-10" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-[#1D6F42]" /></div>
        ) : filtered.length === 0 ? (
          <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" /><h3 className="font-semibold text-lg mb-2">Aucune demande trouvée</h3></CardContent></Card>
        ) : (
          filtered.map((d) => {
            const config = statusConfig[d.statut] ?? statusConfig["EN_VALIDATION"];
            const Icon = config.icon;
            const isPending = d.statut === "EN_VALIDATION";
            return (
              <Card key={d.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${config.bg}`}><Icon className={`w-6 h-6 ${config.color}`} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-sm text-[#1D6F42] font-semibold">{d.numeroDemande}</span>
                          {getStatusBadge(d.statut)}
                          {getUrgencyBadge(d.priorite)}
                        </div>
                        <h3 className="font-semibold">{d.motif || "Sans motif"}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" />{new Date(d.dateDemande).toLocaleDateString("fr-FR")}</span>
                          <span className="flex items-center gap-1"><Package className="w-4 h-4" />{d.lignes.length} article(s)</span>
                          {d.validePar && d.validePar !== "Non encore validée" && <span className="flex items-center gap-1"><User className="w-4 h-4" />{d.validePar}</span>}
                        </div>
                        {/* Quantités demandées / accordées */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {d.lignes.slice(0, 3).map(l => (
                            <div key={l.ligneId} className="inline-flex items-center gap-1 text-xs bg-gray-50 rounded-full px-2 py-0.5 border">
                              <span className="max-w-[150px] truncate font-medium">{l.produitDesignation}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-mono text-gray-500">{l.quantiteDemandee}</span>
                              <span className="text-gray-300">/</span>
                              <span className={`font-mono font-semibold ${l.quantiteAccordee !== l.quantiteDemandee ? "text-[#1D6F42]" : "text-gray-600"}`}>
                                {l.quantiteAccordee}
                              </span>
                            </div>
                          ))}
                          {d.lignes.length > 3 && <span className="text-xs text-gray-400">+{d.lignes.length - 3}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:ml-4">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedDemande(d); setDetailsOpen(true); }}><Eye className="w-4 h-4 mr-2" />Détails</Button>
                      {isPending && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(d)}><Edit className="w-4 h-4 mr-2" />Modifier</Button>
                          <Button variant="ghost" size="sm" className="text-[#E31837] hover:text-[#E31837] hover:bg-[#E31837]/10" onClick={() => { setDemandeToDelete(d.id); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialogue Détails */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedDemande && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[#1D6F42]">{selectedDemande.numeroDemande}</span>
                  {getStatusBadge(selectedDemande.statut)}
                  {getUrgencyBadge(selectedDemande.priorite)}
                </DialogTitle>
                <DialogDescription>Soumise le {new Date(selectedDemande.dateDemande).toLocaleDateString("fr-FR")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div><h4 className="text-sm font-medium mb-1">Justification</h4><p className="text-sm text-muted-foreground">{selectedDemande.motif}</p></div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Articles</h4>
                  <div className="space-y-2">
                    {selectedDemande.lignes.map((l) => (
                      <div key={l.ligneId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{l.produitDesignation}</p>
                          <p className="text-xs text-muted-foreground">Réf: {l.produitReference}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right"><p className="text-xs text-muted-foreground">Demandée</p><p className="text-sm font-medium">{l.quantiteDemandee}</p></div>
                          <div className="w-px h-8 bg-gray-200" />
                          <div className="text-right"><p className="text-xs text-[#1D6F42]">Accordée</p><p className={`text-sm font-bold ${l.quantiteAccordee !== l.quantiteDemandee ? "text-[#1D6F42]" : "text-gray-600"}`}>{l.quantiteAccordee}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedDemande.validePar && selectedDemande.validePar !== "Non encore validée" && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Validé par</h4>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div><p className="text-sm font-medium">{selectedDemande.validePar}</p>{selectedDemande.dateValidation && <p className="text-xs text-muted-foreground">{new Date(selectedDemande.dateValidation).toLocaleDateString("fr-FR")}</p>}</div>
                    </div>
                  </div>
                )}
                {selectedDemande.motifRefus && (
                  <div className="p-3 bg-[#E31837]/5 border border-[#E31837]/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-[#E31837] mt-0.5" />
                      <div><p className="text-sm font-medium text-[#E31837]">Motif du refus</p><p className="text-sm text-[#E31837]/80 mt-1">{selectedDemande.motifRefus}</p></div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setDetailsOpen(false)}>Fermer</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialogue de modification (inchangé) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[#1D6F42]"><Edit className="w-5 h-5" />Modifier la demande</DialogTitle><DialogDescription>{editingDemande?.numeroDemande}</DialogDescription></DialogHeader>
          {editingDemande && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="motif">Justification <span className="text-red-500">*</span></Label>
                <Textarea id="motif" value={editingDemande.motif} onChange={(e) => { setEditingDemande({ ...editingDemande, motif: e.target.value }); if (e.target.value.trim().length >= 20) setJustificationError(""); }} rows={3} className={justificationError ? "border-red-500" : ""} />
                {justificationError && <p className="text-xs text-red-500">{justificationError}</p>}
                <p className="text-xs text-muted-foreground">Minimum 20 caractères ({editingDemande.motif?.trim().length || 0}/20)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priorite">Niveau d'urgence</Label>
                <Select value={editingDemande.priorite} onValueChange={(val) => setEditingDemande({ ...editingDemande, priorite: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{urgencyOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Articles</Label>
                <div className="space-y-2">
                  {editingDemande.lignes.map((ligne, idx) => (
                    <div key={ligne.ligneId} className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium break-words">{ligne.produitDesignation}</p><p className="text-xs text-muted-foreground">Réf: {ligne.produitReference}</p></div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(idx, -1)}><Minus className="w-3 h-3" /></Button>
                        <span className="w-8 text-center font-medium">{ligne.quantiteDemandee}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(idx, 1)}><Plus className="w-3 h-3" /></Button>
                        {editingDemande.lignes.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#E31837] hover:bg-[#E31837]/10" onClick={() => confirmRemoveItem(idx)}><Trash2 className="w-3 h-3" /></Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 border-t pt-4">
                <Label>Ajouter un article</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 relative">
                    <div className="relative">
                      <Input placeholder="Sélectionner un produit..." value={productSearch} onFocus={() => setShowProductList(true)} onChange={(e) => { setProductSearch(e.target.value); if (selectedProduitId) setSelectedProduitId(""); setShowProductList(true); }} className="pr-20" />
                      <button type="button" onClick={() => setShowProductList(!showProductList)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">{showProductList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                      {productSearch && <button type="button" onClick={() => { setProductSearch(""); setShowProductList(true); }} className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-4 h-4" /></button>}
                    </div>
                    {showProductList && (
                      <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredProducts.length === 0 ? <div className="p-2 text-sm text-gray-500">Aucun produit trouvé</div> :
                          filteredProducts.map(prod => (
                            <div key={prod.id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm" onMouseDown={(e) => { e.preventDefault(); setSelectedProduitId(String(prod.id)); setProductSearch(""); setShowProductList(false); }}>
                              <p className="font-medium break-words">{prod.designation}</p>
                              <p className="text-xs text-muted-foreground">{prod.codeArticle}</p>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}><Minus className="w-3 h-3" /></Button>
                    <span className="w-12 text-center font-medium">{newItemQuantity}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setNewItemQuantity(newItemQuantity + 1)}><Plus className="w-3 h-3" /></Button>
                  </div>
                  <Button variant="secondary" onClick={handleAddItem} disabled={!selectedProduitId}><Plus className="w-4 h-4 mr-2" />Ajouter</Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Annuler</Button>
            <Button className="bg-[#1D6F42] hover:bg-[#1D6F42]/90" onClick={handleSaveEdit} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue suppression article */}
      <Dialog open={!!showDeleteItemConfirm} onOpenChange={() => setShowDeleteItemConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[#E31837]"><Trash2 className="w-5 h-5" />Confirmer la suppression</DialogTitle><DialogDescription>Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setShowDeleteItemConfirm(null)}>Annuler</Button><Button variant="destructive" onClick={handleRemoveItem}>Supprimer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue suppression demande */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-[#E31837]"><Trash2 className="w-5 h-5" />Confirmer la suppression</DialogTitle><DialogDescription>Cette action est irréversible. La demande sera définitivement supprimée.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Annuler</Button><Button variant="destructive" onClick={handleDelete} disabled={submitting}>{submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Supprimer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}