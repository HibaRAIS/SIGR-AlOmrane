"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
  AlertCircle,
  Check,
  Percent
} from "lucide-react";
import { tvaService } from "@/services/tva.service";
import type { Tva } from "@/types/tva";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Fonction utilitaire pour obtenir la date du jour au format YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().slice(0, 10);

export default function TvaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");
  const [tvas, setTvas] = useState<Tva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog Ajout
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formAdd, setFormAdd] = useState({
    code: "",
    libelle: "",
    taux: "",
    dateDebut: getTodayDate(),
    dateFin: "",
  });

  // Dialog Modification
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Tva | null>(null);
  const [formEdit, setFormEdit] = useState({
    code: "",
    libelle: "",
    taux: "",
    dateDebut: "",
    dateFin: "",
    actif: true,
  });

  // Dialog Suppression
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tva | null>(null);

  // ----- Chargement initial -----
  const fetchTvas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tvaService.getAll();
      setTvas(data);
    } catch (err) {
      console.error("Erreur chargement TVA:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les taux TVA."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTvas();
  }, [fetchTvas]);

  // ----- Stats (basées sur le champ actif) -----
  const stats = useMemo(() => {
    const active = tvas.filter((t) => t.actif);
    const archived = tvas.filter((t) => !t.actif);
    const standard = tvas.find((t) => t.code === "TVA20")?.taux ?? 20;
    const reducedCount = tvas.filter(
      (t) => t.taux > 0 && t.taux < 20 && t.actif
    ).length;
    return {
      activeCount: active.length,
      archivedCount: archived.length,
      standard,
      reducedCount,
    };
  }, [tvas]);

  // ----- Recherche + Filtre statut -----
  const filteredTvas = useMemo(() => {
    let result = tvas;

    // Filtre textuel
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.code.toLowerCase().includes(lower) ||
          t.libelle.toLowerCase().includes(lower)
      );
    }

    // Filtre statut
    if (statusFilter === "active") {
      result = result.filter((t) => t.actif);
    } else if (statusFilter === "archived") {
      result = result.filter((t) => !t.actif);
    }
    // "all" : pas de filtre additionnel

    return result;
  }, [tvas, searchTerm, statusFilter]);

  // ----- CRUD -----
  const resetAddForm = () =>
    setFormAdd({ code: "", libelle: "", taux: "", dateDebut: getTodayDate(), dateFin: "" });
  
  const resetEditForm = () =>
    setFormEdit({
      code: "",
      libelle: "",
      taux: "",
      dateDebut: "",
      dateFin: "",
      actif: true,
    });

  const handleAdd = async () => {
    if (!formAdd.code.trim() || !formAdd.libelle.trim() || !formAdd.taux) return;
    try {
      const newTva: Omit<Tva, "id"> = {
        code: formAdd.code.trim(),
        libelle: formAdd.libelle.trim(),
        taux: parseFloat(formAdd.taux),
        dateDebutValidite: formAdd.dateDebut || getTodayDate(), // Sécurité: fallback si vidé
        dateFinValidite: formAdd.dateFin || null,
        actif: true,
      };
      await tvaService.create(newTva);
      setIsAddOpen(false);
      resetAddForm();
      await fetchTvas();
      toast.success("Taux TVA créé avec succès");
    } catch (err: any) {
      console.error("Erreur création TVA:", err);
      // Gestion des erreurs backend (ex: Code unique existant)
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Erreur lors de la création du taux TVA"
      );
    }
  };

  const openEditDialog = (tva: Tva) => {
    setEditTarget(tva);
    setFormEdit({
      code: tva.code,
      libelle: tva.libelle,
      taux: tva.taux.toString(),
      dateDebut: tva.dateDebutValidite,
      dateFin: tva.dateFinValidite ?? "",
      actif: tva.actif,
    });
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (
      !editTarget ||
      !formEdit.code.trim() ||
      !formEdit.libelle.trim() ||
      !formEdit.taux
    )
      return;
    try {
      const updatedTva: Tva = {
        ...editTarget,
        code: formEdit.code.trim(),
        libelle: formEdit.libelle.trim(),
        taux: parseFloat(formEdit.taux),
        dateDebutValidite: formEdit.dateDebut || getTodayDate(),
        dateFinValidite: formEdit.dateFin || null,
        actif: formEdit.actif,
      };

      await tvaService.update(editTarget.id, updatedTva);
      
      setTvas((prev) =>
        prev.map((tva) => (tva.id === editTarget.id ? updatedTva : tva))
      );

      setIsEditOpen(false);
      setEditTarget(null);
      resetEditForm();
      toast.success("Taux TVA modifié avec succès");
    } catch (err: any) {
      console.error("Erreur modification TVA:", err);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Erreur lors de la modification"
      );
      await fetchTvas(); // On rafraîchit en cas de désynchronisation
    }
  };

  const openDeleteDialog = (tva: Tva) => {
    setDeleteTarget(tva);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await tvaService.delete(deleteTarget.id);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await fetchTvas();
      toast.success("Taux TVA supprimé");
    } catch (err: any) {
      console.error("Erreur suppression TVA:", err);
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || "Erreur lors de la suppression"
      );
    }
  };

  // ----- Rendu -----
  return (
    <SidebarProvider>
      <SidebarInset>
        <main className="flex-1 space-y-6 p-6 min-h-screen bg-gray-50/30">
          
          {/* En-tête (Sans cadre vert, texte foncé) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestion TVA</h1>
              <p className="text-sm text-gray-500">
                Configuration des taux de TVA applicables au Maroc
              </p>
            </div>
            <button
              onClick={() => {
                resetAddForm();
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 bg-[#1D6F42] text-white hover:bg-[#155430] hover:text-white rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau Taux TVA
            </button>
          </div>

          {/* Stats KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Taux Actifs */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#E8F5E9]">
                  <CheckCircle className="w-6 h-6 text-[#1D6F42]" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.activeCount}</div>
                <div className="text-sm font-medium text-gray-600">Taux Actifs</div>
                <div className="text-[11px] text-gray-400 mt-1">En vigueur</div>
              </div>
            </div>
            {/* Taux Standard */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#E3F2FD]">
                  <Percent className="w-6 h-6 text-[#1565C0]" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.standard}%</div>
                <div className="text-sm font-medium text-gray-600">Taux Standard</div>
                <div className="text-[11px] text-gray-400 mt-1">TVA par défaut</div>
              </div>
            </div>
            {/* Taux Réduits */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#FFF3E0]">
                  <DollarSign className="w-6 h-6 text-[#E65100]" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.reducedCount}</div>
                <div className="text-sm font-medium text-gray-600">Taux Réduits</div>
                <div className="text-[11px] text-gray-400 mt-1">7%, 10%, 14%…</div>
              </div>
            </div>
            {/* Archivés */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-5 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100">
                  <XCircle className="w-6 h-6 text-gray-500" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats.archivedCount}</div>
                <div className="text-sm font-medium text-gray-600">Archivés</div>
                <div className="text-[11px] text-gray-400 mt-1">Anciens taux</div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden">
            {/* En-tête de la table / Filtres */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between px-6 py-4 border-b border-gray-100 gap-4">
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-[#1565C0]" />
                  Liste des Taux TVA
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Tous les taux de TVA configurés dans le système
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    className="pl-9 h-9 text-sm border-gray-200 rounded-xl focus-visible:ring-[#1D6F42]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full sm:w-40 h-9 text-sm font-normal text-gray-600 border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-900">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="all" className="text-sm cursor-pointer">Tous</SelectItem>
                    <SelectItem value="active" className="text-sm cursor-pointer">Actif</SelectItem>
                    <SelectItem value="archived" className="text-sm cursor-pointer">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contenu de la table */}
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1D6F42]" />
                  <span className="ml-3 text-sm font-medium text-gray-500">Chargement…</span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-16 text-red-500 gap-3">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm font-medium">{error}</p>
                  <Button variant="outline" onClick={fetchTvas} className="mt-2 rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900">
                    Réessayer
                  </Button>
                </div>
              ) : filteredTvas.length === 0 ? (
                <div className="py-16 text-center text-sm font-medium text-gray-500">
                  Aucun taux TVA trouvé.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-b border-gray-100 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-6">Code</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Libellé</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Taux</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Date Début</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Date Fin</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider py-3">Statut</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider py-3 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-50">
                    {filteredTvas.map((tva) => (
                      <TableRow key={tva.id} className="hover:bg-gray-50/60 transition-colors border-0">
                        <TableCell className="py-3 px-6 font-mono font-semibold text-gray-900">
                          {tva.code}
                        </TableCell>
                        <TableCell className="py-3 text-sm font-medium text-gray-700">
                          {tva.libelle}
                        </TableCell>
                        <TableCell className="py-3 text-right font-bold text-gray-900">
                          {tva.taux.toFixed(2)}%
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(tva.dateDebutValidite).toLocaleDateString("fr-FR")}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {tva.dateFinValidite ? (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(tva.dateFinValidite).toLocaleDateString("fr-FR")}
                            </div>
                          ) : (
                            <span className="text-gray-400 ml-5">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "border-0 px-2.5 py-0.5 font-semibold text-xs rounded-lg",
                              tva.actif ? "bg-[#E8F5E9] text-[#1D6F42]" : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {tva.actif ? "Actif" : "Archivé"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 px-6 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              className="p-1.5 text-gray-400 hover:text-[#E65100] hover:bg-[#FFF3E0] rounded-lg transition-colors"
                              onClick={() => openEditDialog(tva)}
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() => openDeleteDialog(tva)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Info Structure */}
          <div className="bg-[#E3F2FD] border-2 border-[#90CAF9] rounded-2xl p-6">
            <h3 className="font-bold text-[#0D47A1] mb-2">Règles métier TVA</h3>
            <div className="text-xs text-[#1565C0] space-y-1.5 leading-relaxed">
              <p>• Un même code TVA peut avoir plusieurs versions dans le temps (dateDebutValidite, dateFinValidite).</p>
              <p>• Un taux est considéré comme <strong>actif</strong> si la date du jour est comprise entre la date de début (incluse) et la date de fin (exclue).</p>
              <p>• Si dateFinValidite est vide, le taux est considéré comme toujours actif.</p>
              <p>• Pour archiver un taux, définissez une date de fin – il deviendra inactif le jour même.</p>
            </div>
          </div>

          {/* Dialog Ajout */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-bold">Ajouter un taux TVA</DialogTitle>
                <DialogDescription className="text-gray-500 text-sm">
                  Créez un nouveau taux de TVA avec sa période de validité.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    placeholder="ex: TVA20"
                    value={formAdd.code}
                    onChange={(e) => setFormAdd({ ...formAdd, code: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Libellé <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    placeholder="TVA Standard"
                    value={formAdd.libelle}
                    onChange={(e) => setFormAdd({ ...formAdd, libelle: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Taux (%) <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    type="number"
                    step="0.01"
                    placeholder="20.00"
                    value={formAdd.taux}
                    onChange={(e) => setFormAdd({ ...formAdd, taux: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Date début <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    type="date"
                    value={formAdd.dateDebut}
                    onChange={(e) => setFormAdd({ ...formAdd, dateDebut: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Date fin</Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    type="date"
                    placeholder="Optionnel"
                    value={formAdd.dateFin}
                    onChange={(e) => setFormAdd({ ...formAdd, dateFin: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsAddOpen(false)}>
                  Annuler
                </Button>
                <Button
                  className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430] hover:text-white"
                  onClick={handleAdd}
                  disabled={!formAdd.code.trim() || !formAdd.libelle.trim() || !formAdd.taux || !formAdd.dateDebut}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Modification */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-bold">Modifier le taux TVA</DialogTitle>
                <DialogDescription className="text-gray-500 text-sm">
                  Modifiez les informations du taux <strong className="text-gray-900">{editTarget?.code}</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Code <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    value={formEdit.code}
                    onChange={(e) => setFormEdit({ ...formEdit, code: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Libellé <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    value={formEdit.libelle}
                    onChange={(e) => setFormEdit({ ...formEdit, libelle: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Taux (%) <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    type="number"
                    step="0.01"
                    value={formEdit.taux}
                    onChange={(e) => setFormEdit({ ...formEdit, taux: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Date début <span className="text-red-500">*</span></Label>
                  <Input
                    className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                    type="date"
                    value={formEdit.dateDebut}
                    onChange={(e) => setFormEdit({ ...formEdit, dateDebut: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-sm font-medium text-gray-700">Statut</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Switch
                      checked={formEdit.actif}
                      onCheckedChange={(checked) =>
                        setFormEdit({
                          ...formEdit,
                          actif: checked,
                          dateFin: checked
                            ? ""
                            : formEdit.dateFin || getTodayDate(),
                        })
                      }
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {formEdit.actif ? "Actif" : "Archivé"}
                    </span>
                  </div>
                </div>
                {!formEdit.actif && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-sm font-medium text-gray-700">Date fin</Label>
                    <Input
                      className="col-span-3 rounded-xl border-gray-200 focus-visible:ring-[#1D6F42]"
                      type="date"
                      value={formEdit.dateFin}
                      onChange={(e) => setFormEdit({ ...formEdit, dateFin: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsEditOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  className="rounded-xl bg-[#1D6F42] text-white hover:bg-[#155430] hover:text-white" 
                  onClick={handleEdit}
                  disabled={!formEdit.code.trim() || !formEdit.libelle.trim() || !formEdit.taux || !formEdit.dateDebut}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Suppression */}
          <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl border-red-100">
              <DialogHeader>
                <DialogTitle className="text-red-600 font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Confirmer la suppression
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  Voulez‑vous vraiment supprimer le taux TVA <strong className="text-gray-900">{deleteTarget?.code} ({deleteTarget?.libelle})</strong> ?
                  <br /><br />
                  <span className="text-red-500/80 text-xs font-medium">Cette action est irréversible.</span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="mt-4">
                <Button variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsDeleteOpen(false)}>
                  Annuler
                </Button>
                <Button className="rounded-xl bg-red-600 text-white hover:bg-red-700 hover:text-white" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}