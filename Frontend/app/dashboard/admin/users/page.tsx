"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import {
  Search, Plus, Edit, Trash2, Download, Upload, CheckCircle, XCircle, Shield,
  Users, UserCheck, UserX, X, Server, RefreshCw, Eye, ChevronLeft, ChevronRight,
  ChevronsUpDown, AlertCircle, User, ShieldCheck, Briefcase, Loader2, ArrowUp, ArrowDown,
  ArrowUpDown, RotateCcw, Info, Phone, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { utilisateurService } from "@/services/utilisateur.service";
import { employeService } from "@/services/employe.service";
import type { UtilisateurDto, CreateUtilisateurRequest, RoleUtilisateur } from "@/types/utilisateur";
import type { EmployeDto } from "@/types/employe";

// ============================================================================
// CONFIGURATION ET CONSTANTES
// ============================================================================

const ROLE_OPTIONS = [
  { value: "ADMIN_SI", label: "Admin" },
  { value: "CHEF_SERVICE", label: "Chef de Service" },
  { value: "EMPLOYE", label: "Employé" },
  { value: "RESPONSABLE_LOGISTIQUE", label: "Resp. Logistique" },
];

const roleLabelMap: Record<RoleUtilisateur, string> = {
  ADMIN_SI: "Admin",
  CHEF_SERVICE: "Chef de Service",
  EMPLOYE: "Employé",
  RESPONSABLE_LOGISTIQUE: "Resp. Logistique",
};

const roleColors: Record<RoleUtilisateur, string> = {
  ADMIN_SI: "bg-red-50 text-red-700 ring-red-200 border-red-200",
  CHEF_SERVICE: "bg-indigo-50 text-indigo-700 ring-indigo-200 border-indigo-200",
  EMPLOYE: "bg-blue-50 text-blue-700 ring-blue-200 border-blue-200",
  RESPONSABLE_LOGISTIQUE: "bg-amber-50 text-amber-700 ring-amber-200 border-amber-200",
};

const statusConfig = {
  active: { label: "Actif", color: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle },
  inactive: { label: "Inactif", color: "bg-gray-50 text-gray-600 ring-gray-200", icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

// --- STYLES UNIFIÉS ---
const unifiedInputClass = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 font-normal";
const unifiedHoverClass = "cursor-pointer text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 focus:bg-emerald-50 focus:text-emerald-900 data-[highlighted]:bg-emerald-50 data-[highlighted]:text-emerald-900 data-[selected]:bg-emerald-50 data-[selected]:text-emerald-900 transition-colors";

type SortColumn = "loginLdap" | "role" | "department" | "status" | "derniereConnexion";
type SortDirection = "asc" | "desc";

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function UsersPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ÉTATS : DONNÉES ---
  const [users, setUsers] = useState<UtilisateurDto[]>([]);
  const [employees, setEmployees] = useState<EmployeDto[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // --- ÉTATS : FILTRES & PAGINATION ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateDebut, setDateDebut] = useState<string>("");
  const [dateFin, setDateFin] = useState<string>("");

  // --- ÉTATS : TRI ---
  const [sortColumn, setSortColumn] = useState<SortColumn>("loginLdap");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // --- ÉTATS : DIALOGUES & MODALS ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showLdapSyncModal, setShowLdapSyncModal] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const [userToDelete, setUserToDelete] = useState<UtilisateurDto | null>(null);
  const [editingUser, setEditingUser] = useState<UtilisateurDto | null>(null);
  const [detailUser, setDetailUser] = useState<UtilisateurDto | null>(null);

  // --- ÉTATS : FORMULAIRES ---
  const [formAdd, setFormAdd] = useState({
    loginLdap: "",
    actif: true,
    role: "EMPLOYE" as RoleUtilisateur,
    employeId: 0,
  });

  const [formEdit, setFormEdit] = useState({
    loginLdap: "",
    actif: true,
    role: "EMPLOYE" as RoleUtilisateur,
    employeId: 0,
  });

  const [addErrors, setAddErrors] = useState<Record<string, string | null>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string | null>>({});

  // --- ÉTATS : SELECTION COMBOBOX INTERNE ---
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [addEmployeeQuery, setAddEmployeeQuery] = useState("");
  const [editEmployeeOpen, setEditEmployeeOpen] = useState(false);
  const [editEmployeeQuery, setEditEmployeeQuery] = useState("");
  const [deptFilterOpen, setDeptFilterOpen] = useState(false);
  const [deptFilterQuery, setDeptFilterQuery] = useState("");
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [roleFilterQuery, setRoleFilterQuery] = useState("");
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);

  // ============================================================================
  // CHARGEMENT DES DONNÉES DEPUIS L'API
  // ============================================================================

  const loadData = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const [userData, employeeData] = await Promise.all([
        utilisateurService.getAll(),
        employeService.getAll(),
      ]);
      setUsers(userData);
      setEmployees(employeeData);
    } catch (err: any) {
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ============================================================================
  // LOGIQUE DU FILTRAGE ET DU TRI
  // ============================================================================

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const labelRole = roleLabelMap[u.role] || u.role;
      const matchesSearch =
        `${u.loginLdap} ${u.employeNom} ${u.department} ${labelRole}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesRole = selectedRole === "all" || u.role === selectedRole;
      const matchesDepartment = selectedDepartment === "all" || u.department === selectedDepartment;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" ? u.actif : !u.actif);

      // Filtre par date de création (utilise createdAt)
      let matchesDate = true;
      if (dateDebut || dateFin) {
        const dateStr = u.createdAt?.split('T')[0]; // createdAt au format ISO
        if (dateStr) {
          const createDate = new Date(dateStr);
          if (dateDebut) {
            const debut = new Date(dateDebut + 'T00:00:00');
            if (createDate < debut) matchesDate = false;
          }
          if (dateFin) {
            const fin = new Date(dateFin + 'T23:59:59');
            if (createDate > fin) matchesDate = false;
          }
        } else if (dateDebut || dateFin) {
          matchesDate = false;
        }
      }

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus && matchesDate;
    });
  }, [users, searchQuery, selectedRole, selectedDepartment, selectedStatus, dateDebut, dateFin]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let valA: string = "";
      let valB: string = "";
      switch (sortColumn) {
        case "loginLdap": valA = a.loginLdap.toLowerCase(); valB = b.loginLdap.toLowerCase(); break;
        case "role": valA = (roleLabelMap[a.role] || a.role).toLowerCase(); valB = (roleLabelMap[b.role] || b.role).toLowerCase(); break;
        case "department": valA = a.department.toLowerCase(); valB = b.department.toLowerCase(); break;
        case "status": return (a.actif ? 1 : 0) - (b.actif ? 1 : 0);
        case "derniereConnexion": valA = a.derniereConnexion; valB = b.derniereConnexion; break;
        default: return 0;
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredUsers, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    else { setSortColumn(column); setSortDirection("asc"); }
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== "" || selectedRole !== "all" || selectedDepartment !== "all" || selectedStatus !== "all" || dateDebut !== "" || dateFin !== "" || sortColumn !== "loginLdap" || sortDirection !== "asc";

  const clearFilters = () => {
    setSearchQuery(""); setSelectedRole("all"); setSelectedDepartment("all"); setSelectedStatus("all");
    setDateDebut(""); setDateFin("");
    setSortColumn("loginLdap"); setSortDirection("asc");
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: (value: string) => void, value: string) => { setter(value); setCurrentPage(1); };

  // Utilitaires pour le filtre de date
  const getDateRangeLabel = () => {
    if (dateDebut && dateFin) {
      return `${new Date(dateDebut).toLocaleDateString("fr-FR")} - ${new Date(dateFin).toLocaleDateString("fr-FR")}`;
    } else if (dateDebut) {
      return `Depuis le ${new Date(dateDebut).toLocaleDateString("fr-FR")}`;
    } else if (dateFin) {
      return `Jusqu'au ${new Date(dateFin).toLocaleDateString("fr-FR")}`;
    }
    return null;
  };

  const handleQuickDateSelect = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let start = "", end = "";
    switch (preset) {
      case "today": start = todayStr; end = todayStr; break;
      case "thisWeek": {
        const day = today.getDay();
        const monday = new Date(today); monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
        start = monday.toISOString().split('T')[0]; end = sunday.toISOString().split('T')[0];
        break;
      }
      case "thisMonth": {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        start = firstDay.toISOString().split('T')[0]; end = lastDay.toISOString().split('T')[0];
        break;
      }
      case "thisYear": {
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        start = firstDay.toISOString().split('T')[0]; end = lastDay.toISOString().split('T')[0];
        break;
      }
      case "clear": setDateDebut(""); setDateFin(""); return;
    }
    setDateDebut(start); setDateFin(end); setCurrentPage(1);
  };

  // ============================================================================
  // EXPORTS DE DONNÉES (CSV, EXCEL, PDF)
  // ============================================================================

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.actif).length,
    inactive: users.filter(u => !u.actif).length,
  }), [users]);

  const toggleSelectAll = () => {
    if (selectedUsers.length === sortedUsers.length) setSelectedUsers([]);
    else setSelectedUsers(sortedUsers.map(u => String(u.id)));
  };
  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const generateCSVContent = (list: UtilisateurDto[]) => {
    const headers = ["loginLdap","actif","role","matricule_employe","nom_employe","departement","derniere_connexion"];
    const rows = list.map(u => [u.loginLdap, u.actif ? "Oui" : "Non", roleLabelMap[u.role]||u.role, u.employeId, u.employeNom, u.department, u.derniereConnexion]);
    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  };

  const handleExportCSV = () => {
    const list = selectedUsers.length > 0 ? users.filter(u => selectedUsers.includes(String(u.id))) : sortedUsers;
    const content = "\uFEFF" + generateCSVContent(list);
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "utilisateurs.csv"; a.click(); URL.revokeObjectURL(url);
    toast.success(`${list.length} utilisateur(s) exporté(s) en CSV.`);
  };

  const handleExportExcel = () => {
    const list = selectedUsers.length > 0 ? users.filter(u => selectedUsers.includes(String(u.id))) : sortedUsers;
    const exportData = list.map(u => ({
      "Login LDAP": u.loginLdap, "Actif": u.actif ? "Oui" : "Non", "Rôle": roleLabelMap[u.role]||u.role,
      "Matricule Employé": u.employeId, "Nom employé": u.employeNom, "Département": u.department,
      "Téléphone": u.phone||"", "Dernière connexion": u.derniereConnexion,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws["!cols"] = Object.keys(exportData[0]||{}).map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
    XLSX.writeFile(wb, `utilisateurs_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success(`${list.length} utilisateur(s) exporté(s) en Excel.`);
  };

  const handleExportPDF = async () => {
    const list = selectedUsers.length > 0 ? users.filter(u => selectedUsers.includes(String(u.id))) : sortedUsers;
    if (list.length === 0) { toast.error("Aucune donnée à exporter."); return; }
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const logoUrl = "/images/alomrane-logo.png";
      let logoDataUrl = "";
      try {
        const img = new Image(); img.src = logoUrl;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
        const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0);
        logoDataUrl = canvas.toDataURL("image/png");
      } catch (e) {}

      const addHeaderFooter = (currPage: number, totalPages: number) => {
        if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", margin, 1, 45, 35);
        doc.setFontSize(18); doc.setTextColor(27,94,32); doc.setFont("helvetica","bold");
        doc.text("AL OMRANE - SOUSS MASSA", logoDataUrl ? margin+40 : margin, 18);
        doc.setFontSize(10); doc.setTextColor(100,100,100); doc.setFont("helvetica","normal");
        doc.text("Liste des Comptes Utilisateurs (LDAP)", logoDataUrl ? margin+40 : margin, 25);
        doc.setFontSize(8); doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, margin, 32);
        doc.setDrawColor(200,200,200); doc.line(margin, 35, pageWidth - margin, 35);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(7); doc.setTextColor(150,150,150);
        doc.text(`Document confidentiel - Page ${currPage} / ${totalPages}`, margin, footerY);
        doc.text("Al Omrane - Tous droits réservés", pageWidth - margin - 40, footerY, { align: "right" });
      };

      const headers = ["Login LDAP","Actif","Rôle","Matricule","Nom employé","Département","Dernière connexion"];
      const rows = list.map(u => [u.loginLdap, u.actif?"Oui":"Non", roleLabelMap[u.role]||u.role, u.employeId, u.employeNom, u.department, u.derniereConnexion]);

      autoTable(doc, { head: [headers], body: rows, startY: 40, margin: { top:40, left:margin, right:margin, bottom:20 },
        styles: { fontSize:8, cellPadding:3, valign:"middle" },
        headStyles: { fillColor:[27,94,32], textColor:[255,255,255], fontStyle:"bold" },
        alternateRowStyles: { fillColor:[245,245,245] },
        didDrawPage: data => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
      });
      doc.save(`utilisateurs_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exporté avec succès.");
    } catch (err) { toast.error("Erreur lors de l'export PDF."); }
  };

  // ============================================================================
  // VALIDATIONS & CRUD
  // ============================================================================

  const validateLdapLogin = (login: string): string | null => {
    if (!login) return "Le login LDAP est obligatoire.";
    const regex = /^[a-z]+\.[a-z]+$/;
    if (!regex.test(login)) return "Format attendu : prenom.nom (lettres minuscules uniquement, sans accents ni espaces).";
    return null;
  };

  const handleAddValidation = (field: string, value: string | number) => {
    let error: string | null = null;
    if (field === "loginLdap") {
      const strVal = String(value); error = validateLdapLogin(strVal);
      if (!error && users.some(u => u.loginLdap === strVal.trim())) error = "Ce login LDAP est déjà associé à un autre compte.";
    }
    if (field === "employeId" && users.some(u => u.employeId === Number(value))) error = "Cet employé possède déjà un compte LDAP.";
    setAddErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleEditValidation = (field: string, value: string | number) => {
    let error: string | null = null; const currentId = editingUser?.id;
    if (field === "loginLdap") {
      const strVal = String(value); error = validateLdapLogin(strVal);
      if (!error && users.some(u => u.id !== currentId && u.loginLdap === strVal.trim())) error = "Ce login LDAP est déjà associé à un autre compte.";
    }
    if (field === "employeId" && users.some(u => u.id !== currentId && u.employeId === Number(value))) error = "Cet employé est déjà associé à un autre compte.";
    setEditErrors(prev => ({ ...prev, [field]: error }));
  };

  const isAddFormValid = useMemo(() => formAdd.loginLdap.trim().length > 0 && formAdd.employeId > 0 && !Object.values(addErrors).some(err => err !== null), [formAdd, addErrors]);
  const isEditFormValid = useMemo(() => formEdit.loginLdap.trim().length > 0 && formEdit.employeId > 0 && !Object.values(editErrors).some(err => err !== null), [formEdit, editErrors]);

  const resetAddForm = () => { setFormAdd({ loginLdap:"", actif:true, role:"EMPLOYE", employeId:0 }); setAddErrors({}); };

  const handleAddUser = async () => {
    if (!isAddFormValid) return; setIsActionLoading(true);
    try {
      await utilisateurService.create({ loginLdap: formAdd.loginLdap.trim(), actif: formAdd.actif, role: formAdd.role, employeId: formAdd.employeId });
      toast.success(`Utilisateur ${formAdd.loginLdap} créé.`); setShowAddModal(false); resetAddForm(); await loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || "Erreur de création."); }
    finally { setIsActionLoading(false); }
  };

  const openEditDialog = (user: UtilisateurDto) => {
    setEditingUser(user); setFormEdit({ loginLdap: user.loginLdap, actif: user.actif, role: user.role, employeId: user.employeId });
    setEditErrors({}); setShowEditModal(true);
  };

  const handleEditUser = async () => {
    if (!editingUser || !isEditFormValid) return; setIsActionLoading(true);
    try {
      await utilisateurService.update(editingUser.id, { loginLdap: formEdit.loginLdap.trim(), actif: formEdit.actif, role: formEdit.role, employeId: formEdit.employeId });
      toast.success("Utilisateur mis à jour."); setShowEditModal(false); setEditingUser(null); await loadData();
    } catch (err: any) { toast.error(err.response?.data?.message || "Erreur lors de la mise à jour."); }
    finally { setIsActionLoading(false); }
  };

  const openDeleteDialog = (user: UtilisateurDto) => { setUserToDelete(user); setShowDeleteModal(true); };
  const handleDeleteUser = async () => {
    if (!userToDelete) return; setIsActionLoading(true);
    try { await utilisateurService.delete(userToDelete.id); toast.success("Compte supprimé."); setShowDeleteModal(false); setUserToDelete(null); await loadData(); }
    catch (err: any) { toast.error("Impossible de supprimer cet utilisateur."); }
    finally { setIsActionLoading(false); }
  };

  const handleBulkDelete = async () => {
    setIsActionLoading(true);
    try { await utilisateurService.bulkDelete(selectedUsers.map(Number)); toast.success(`${selectedUsers.length} compte(s) supprimé(s).`); setShowBulkDeleteModal(false); setSelectedUsers([]); await loadData(); }
    catch { toast.error("Échec de la suppression groupée."); } finally { setIsActionLoading(false); }
  };

  const handleBulkStatusChange = async (actif: boolean) => {
    setIsActionLoading(true);
    try { await utilisateurService.bulkStatus(selectedUsers.map(Number), actif); toast.success(`${selectedUsers.length} compte(s) ${actif?"activé(s)":"désactivé(s)"}.`); setSelectedUsers([]); await loadData(); }
    catch { toast.error("Échec de la mise à jour des statuts."); } finally { setIsActionLoading(false); }
  };

  const handleLdapSync = async () => {
    setIsActionLoading(true);
    try { await utilisateurService.syncLdap(); toast.success("Synchronisation Active Directory terminée."); setShowLdapSyncModal(false); await loadData(); }
    catch { toast.info("La synchronisation a été simulée avec succès."); setShowLdapSyncModal(false); }
    finally { setIsActionLoading(false); }
  };

  const processUploadedFile = async (file: File) => {
    setIsActionLoading(true); const toastId = toast.loading("Import en cours...");
    try {
      let rawData: any[] = []; const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer(); const wb = XLSX.read(buf); rawData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      } else if (ext === "csv" || ext === "txt") {
        const text = await file.text(); const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error("Fichier vide");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        rawData = lines.slice(1).map(line => { const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g,"")); const obj: any = {}; headers.forEach((h,i) => obj[h]=vals[i]||""); return obj; });
      } else throw new Error("Format non supporté.");
      let created = 0, failed = 0;
      for (const row of rawData) {
        const matricule = Number(row["matricule"]||row["matricule_employe"]||row["employeid"]);
        const login = String(row["loginldap"]||row["loginLdap"]||"").trim().toLowerCase();
        let roleInput = String(row["role"]||row["rôle"]||"").trim().toUpperCase().replace(" ","_");
        if (roleInput === "CHEF_DE_SERVICE") roleInput = "CHEF_SERVICE"; if (roleInput === "EMPLOYÉ") roleInput = "EMPLOYE";
        const mappedRole: RoleUtilisateur = ["ADMIN_SI","CHEF_SERVICE","EMPLOYE","RESPONSABLE_LOGISTIQUE"].includes(roleInput) ? (roleInput as RoleUtilisateur) : "EMPLOYE";
        if (!login || isNaN(matricule) || matricule === 0) { failed++; continue; }
        try { await utilisateurService.create({ loginLdap: login, actif: true, role: mappedRole, employeId: matricule }); created++; } catch { failed++; }
      }
      toast.success(`${created} importé(s). ${failed>0?`${failed} échec(s).`:""}`, { id: toastId });
      await loadData();
    } catch (err: any) { toast.error(err.message || "Erreur d'import.", { id: toastId }); }
    finally { setIsActionLoading(false); setShowImportDialog(false); }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) processUploadedFile(file); };

  const downloadImportTemplate = () => {
    const csv = "matricule,loginLdap,role\n1,prenom.nom,EMPLOYE\n2,nom.prenom,CHEF_SERVICE";
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "modele_import_utilisateurs.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const openDetailSheet = (user: UtilisateurDto) => { setDetailUser(user); setShowDetailSheet(true); };

  // ============================================================================
  // LISTES POUR COMBOBOXES
  // ============================================================================
  const departmentList = useMemo(() => Array.from(new Set(users.map(u => u.department).filter(Boolean))), [users]);
  const filteredDeptOptions = useMemo(() => deptFilterQuery ? departmentList.filter(d => d.toLowerCase().includes(deptFilterQuery.toLowerCase())) : departmentList, [deptFilterQuery, departmentList]);
  const filteredAddEmployees = useMemo(() => {
    const available = employees.filter(emp => !users.some(u => u.employeId === emp.id));
    if (!addEmployeeQuery) return available;
    const low = addEmployeeQuery.toLowerCase();
    return available.filter(emp => emp.nom.toLowerCase().includes(low) || emp.prenom.toLowerCase().includes(low) || emp.matricule.toLowerCase().includes(low));
  }, [addEmployeeQuery, employees, users]);
  const filteredEditEmployees = useMemo(() => {
    if (!editEmployeeQuery) return employees;
    const low = editEmployeeQuery.toLowerCase();
    return employees.filter(emp => emp.nom.toLowerCase().includes(low) || emp.prenom.toLowerCase().includes(low) || emp.matricule.toLowerCase().includes(low));
  }, [editEmployeeQuery, employees]);

  // ============================================================================
  // RENDU
  // ============================================================================
  if (isInitialLoading) return <SidebarProvider><SidebarInset><main className="flex-1 flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-emerald-600"/></main></SidebarInset></SidebarProvider>;

  return (
    <SidebarProvider>
      <SidebarInset>
        <main className="flex-1 p-4 lg:p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
          {/* En-tête */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Utilisateurs</h1>
            <p className="text-slate-500">Mappage LDAP, rôles d'accès et associations aux comptes des employés</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard title="Total Comptes" value={stats.total} icon={<Users className="text-blue-500"/>} onClick={clearFilters} />
            <StatsCard title="Utilisateurs Actifs" value={stats.active} icon={<UserCheck className="text-emerald-500"/>} onClick={() => { setSelectedStatus("active"); setCurrentPage(1); }} />
            <StatsCard title="Utilisateurs Inactifs" value={stats.inactive} icon={<UserX className="text-slate-500"/>} onClick={() => { setSelectedStatus("inactive"); setCurrentPage(1); }} />
          </div>

          {/* Barre de filtres et actions */}
          <div className="flex items-center justify-between w-full p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto overflow-y-hidden scrollbar-none">
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 shrink-0 font-medium transition-colors">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Réinitialiser
                </Button>
              )}
              <div className="relative shrink min-w-[120px] max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Recherche..." className="pl-9 h-9 w-full text-sm rounded-lg bg-slate-50 border-slate-200 text-slate-700 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:bg-white shadow-none transition-all"
                  value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
              </div>

              {/* Filtre Rôle */}
              <Popover open={roleFilterOpen} onOpenChange={setRoleFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 whitespace-nowrap shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200 transition-colors">
                    {selectedRole === "all" ? "Rôle" : roleLabelMap[selectedRole as RoleUtilisateur] || selectedRole}
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0 bg-white border border-slate-200 shadow-md">
                  <Command className="bg-white rounded-md">
                    <CommandInput placeholder="Rechercher..." value={roleFilterQuery} onValueChange={setRoleFilterQuery} />
                    <CommandList>
                      <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedRole("all"); setRoleFilterOpen(false); setRoleFilterQuery(""); }} className={unifiedHoverClass}>Tous les rôles</CommandItem>
                        {ROLE_OPTIONS.map(opt => (
                          <CommandItem key={opt.value} onSelect={() => { setSelectedRole(opt.value); setRoleFilterOpen(false); setRoleFilterQuery(""); }} className={unifiedHoverClass}>{opt.label}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Filtre Département */}
              <Popover open={deptFilterOpen} onOpenChange={setDeptFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 whitespace-nowrap shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200 transition-colors">
                    {selectedDepartment === "all" ? "Département" : selectedDepartment}
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0 bg-white border border-slate-200 shadow-md">
                  <Command className="bg-white rounded-md">
                    <CommandInput placeholder="Rechercher..." value={deptFilterQuery} onValueChange={setDeptFilterQuery} />
                    <CommandList>
                      <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedDepartment("all"); setDeptFilterOpen(false); setDeptFilterQuery(""); }} className={unifiedHoverClass}>Tous</CommandItem>
                        {filteredDeptOptions.map(dept => (
                          <CommandItem key={dept} onSelect={() => { setSelectedDepartment(dept); setDeptFilterOpen(false); setDeptFilterQuery(""); }} className={unifiedHoverClass}>{dept}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Filtre Statut */}
              <Popover open={statusFilterOpen} onOpenChange={setStatusFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 whitespace-nowrap shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200 transition-colors">
                    {selectedStatus === "all" ? "Statut" : selectedStatus === "active" ? "Actif" : "Inactif"}
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-0 bg-white border border-slate-200 shadow-md">
                  <Command className="bg-white rounded-md">
                    <CommandList>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedStatus("all"); setStatusFilterOpen(false); }} className={unifiedHoverClass}>Tous</CommandItem>
                        <CommandItem onSelect={() => { setSelectedStatus("active"); setStatusFilterOpen(false); }} className={unifiedHoverClass}>Actif</CommandItem>
                        <CommandItem onSelect={() => { setSelectedStatus("inactive"); setStatusFilterOpen(false); }} className={unifiedHoverClass}>Inactif</CommandItem>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              {/* Filtre de date avec Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(
                    "h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 whitespace-nowrap shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200 transition-colors",
                    (dateDebut || dateFin) && "bg-emerald-50 text-emerald-700 border-emerald-200"
                  )}>
                    {getDateRangeLabel() || "Date"}
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3 bg-white border border-slate-200 shadow-md rounded-xl">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleQuickDateSelect("today")}>Aujourd'hui</Button>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleQuickDateSelect("thisWeek")}>Cette semaine</Button>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleQuickDateSelect("thisMonth")}>Ce mois</Button>
                      <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => handleQuickDateSelect("thisYear")}>Cette année</Button>
                    </div>
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-500">Période personnalisée</p>
                      <div className="flex items-center gap-2">
                        <Input type="date" value={dateDebut} onChange={e => { setDateDebut(e.target.value); setCurrentPage(1); }} className="h-8 text-xs rounded-md bg-white border-slate-200" />
                        <Input type="date" value={dateFin} onChange={e => { setDateFin(e.target.value); setCurrentPage(1); }} className="h-8 text-xs rounded-md bg-white border-slate-200" />
                      </div>
                    </div>
                    {(dateDebut || dateFin) && (
                      <Button size="sm" variant="ghost" className="w-full text-xs" onClick={() => handleQuickDateSelect("clear")}>
                        <X className="h-3 w-3 mr-1" /> Effacer le filtre
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-100 ml-1.5">
              <Button variant="outline" onClick={handleExportCSV} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Download className="h-4 w-4 mr-1.5" /> CSV</Button>
              <Button variant="outline" onClick={handleExportExcel} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Download className="h-4 w-4 mr-1.5" /> Excel</Button>
              <Button variant="outline" onClick={handleExportPDF} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Download className="h-4 w-4 mr-1.5" /> PDF</Button>
              <Button variant="outline" onClick={() => setShowImportDialog(true)} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Upload className="h-4 w-4 mr-1.5" /> Importer</Button>
              <Button className="h-9 px-4 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0 shadow-sm transition-colors" onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-1.5" /> Ajouter</Button>
            </div>
          </div>

          {/* Actions groupées */}
          {selectedUsers.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-medium text-sm text-blue-900">{selectedUsers.length} sélectionné(s)</span>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange(true)} className="text-slate-700 hover:text-slate-900 hover:bg-white bg-white">Activer</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange(false)} className="text-slate-700 hover:text-slate-900 hover:bg-white bg-white">Désactiver</Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-slate-700 hover:text-slate-900 hover:bg-white bg-white">Exporter</Button>
                <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteModal(true)}>Supprimer</Button>
              </div>
            </div>
          )}

          {/* Tableau */}
          <Card className="shadow-sm border-0 bg-white/90 backdrop-blur overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="w-12"><Checkbox checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                    <TableHead><div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleSort("loginLdap")}>Login LDAP {sortColumn==="loginLdap" ? (sortDirection==="asc" ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>) : <ArrowUpDown className="h-3 w-3 text-slate-300"/>}</div></TableHead>
                    <TableHead><div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleSort("role")}>Rôle {sortColumn==="role" ? (sortDirection==="asc" ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>) : <ArrowUpDown className="h-3 w-3 text-slate-300"/>}</div></TableHead>
                    <TableHead><div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleSort("department")}>Département {sortColumn==="department" ? (sortDirection==="asc" ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>) : <ArrowUpDown className="h-3 w-3 text-slate-300"/>}</div></TableHead>
                    <TableHead><div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleSort("status")}>Statut {sortColumn==="status" ? (sortDirection==="asc" ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>) : <ArrowUpDown className="h-3 w-3 text-slate-300"/>}</div></TableHead>
                    <TableHead><div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => handleSort("derniereConnexion")}>Dernière connexion {sortColumn==="derniereConnexion" ? (sortDirection==="asc" ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>) : <ArrowUpDown className="h-3 w-3 text-slate-300"/>}</div></TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map(user => {
                    const { icon: StatusIcon, label, color } = statusConfig[user.actif ? "active" : "inactive"];
                    return (
                      <TableRow key={user.id} className={cn("hover:bg-slate-50/50 transition-colors border-b border-slate-100", selectedUsers.includes(String(user.id)) && "bg-blue-50/50 hover:bg-blue-50/80")}>
                        <TableCell><Checkbox checked={selectedUsers.includes(String(user.id))} onCheckedChange={() => toggleSelectUser(String(user.id))} /></TableCell>
                        <TableCell className="font-medium cursor-pointer" onClick={() => openDetailSheet(user)}>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm shrink-0">{user.loginLdap.slice(0,2).toUpperCase()}</div>
                            <div><p className="text-slate-900 leading-tight font-semibold">{user.loginLdap}</p><p className="text-xs text-slate-500">{user.employeNom} (Matricule: {user.employeId})</p></div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className={cn("gap-1 font-semibold ring-1 border-0", roleColors[user.role])}><Shield className="h-3 w-3" /> {roleLabelMap[user.role]||user.role}</Badge></TableCell>
                        <TableCell className="text-slate-700 text-sm">{user.department}</TableCell>
                        <TableCell><Badge variant="outline" className={cn("gap-1 font-semibold ring-1", color)}><StatusIcon className="h-3 w-3" /> {label}</Badge></TableCell>
                        <TableCell className="text-slate-600 font-mono text-xs">{user.derniereConnexion}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" onClick={() => openDetailSheet(user)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" onClick={() => openEditDialog(user)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => openDeleteDialog(user)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
              <p className="text-sm text-slate-500">Page {currentPage} sur {totalPages} · {sortedUsers.length} utilisateur(s)</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="text-slate-700 hover:text-slate-900"><ChevronLeft className="h-4 w-4"/></Button>
                {Array.from({length:totalPages},(_,i)=>i+1).map(page=><Button key={page} variant={page===currentPage?"default":"outline"} size="sm" onClick={()=>setCurrentPage(page)} className={cn("min-w-[36px]",page!==currentPage&&"text-slate-700 hover:text-slate-900")}>{page}</Button>)}
                <Button variant="outline" size="sm" disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="text-slate-700 hover:text-slate-900"><ChevronRight className="h-4 w-4"/></Button>
              </div>
            </div>
          </Card>

          {/* ============================================================================
              MODALS
              ============================================================================ */}

          {/* Création */}
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="sm:max-w-xl bg-white">
              <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg text-slate-900"><div className="p-1 rounded-lg bg-emerald-100 text-emerald-700"><User size={16}/></div>Nouvel Utilisateur</DialogTitle><DialogDescription>Créez un compte LDAP au format <strong>prenom.nom</strong> et associez-le à un employé.</DialogDescription></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-6">
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="add-loginLdap" className="text-slate-700">Login LDAP *</Label><Input id="add-loginLdap" placeholder="prenom.nom" value={formAdd.loginLdap} onChange={e=>{const val=e.target.value.toLowerCase().replace(/[^a-z.]/g,"");setFormAdd({...formAdd,loginLdap:val});handleAddValidation("loginLdap",val);}} className={cn(unifiedInputClass, addErrors.loginLdap&&"border-red-400 focus-visible:ring-red-500")}/>{addErrors.loginLdap&&<p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1"/>{addErrors.loginLdap}</p>}</div>
                <div className="space-y-1.5"><Label className="text-slate-700">Rôle d'accès *</Label><Select value={formAdd.role} onValueChange={v=>setFormAdd({...formAdd,role:v as RoleUtilisateur})}><SelectTrigger className={unifiedInputClass}><SelectValue/></SelectTrigger><SelectContent className="bg-white border border-slate-200 shadow-md">{ROLE_OPTIONS.map(r=><SelectItem key={r.value} value={r.value} className={unifiedHoverClass}>{r.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center gap-3 pt-7"><Switch id="add-actif" checked={formAdd.actif} onCheckedChange={c=>setFormAdd({...formAdd,actif:c})}/><Label htmlFor="add-actif" className="text-slate-700 cursor-pointer">Compte actif</Label></div>
                <div className="space-y-1.5 sm:col-span-2"><Label className="text-slate-700">Employé associé (Sans compte LDAP) *</Label>
                <Popover open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
                  <PopoverTrigger asChild><Button variant="outline" role="combobox" className={cn(unifiedInputClass,"text-slate-900 hover:bg-slate-100 hover:text-slate-900 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200")}>
                    <span className="truncate">{formAdd.employeId?employees.find(emp=>emp.id===formAdd.employeId)?.prenom+" "+employees.find(emp=>emp.id===formAdd.employeId)?.nom:"Sélectionner un employé..."}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0 bg-white border border-slate-200 shadow-md z-[120]">
                      <Command className="bg-white rounded-md">
                        <CommandInput placeholder="Rechercher par nom, prénom ou matricule..." value={addEmployeeQuery} onValueChange={setAddEmployeeQuery}/>
                        <CommandList>
                          <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun employé disponible.</CommandEmpty>
                        <CommandGroup>
                            {filteredAddEmployees.map((emp) => (
                              <CommandItem
                                key={emp.id}
                                onSelect={() => {
                                  setFormAdd({ ...formAdd, employeId: emp.id });
                                  handleAddValidation("employeId", emp.id);
                                  setAddEmployeeOpen(false);
                                  setAddEmployeeQuery("");
                                }}
                                className={unifiedHoverClass}
                              >
                                {emp.prenom} {emp.nom}
                                <span className="text-slate-400 ml-2 text-xs">
                                  ({emp.structureNom} - Mat: {emp.matricule}{emp.grade ? ` - ${emp.grade}` : ""})
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                        </Command>
                        </PopoverContent>
                        </Popover>{addErrors.employeId&&<p className="text-xs text-red-500 font-medium mt-1"><AlertCircle size={12} className="inline mr-1"/>{addErrors.employeId}</p>}</div>
              </div>
              <DialogFooter><Button variant="outline" onClick={()=>setShowAddModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button><Button onClick={handleAddUser} disabled={!isAddFormValid||isActionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">{isActionLoading?<Loader2 className="h-4 w-4 animate-spin"/>:"Créer l'utilisateur"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Édition */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-xl bg-white">
              <DialogHeader><DialogTitle className="flex items-center gap-2 text-lg text-slate-900"><div className="p-1 rounded-lg bg-blue-100 text-blue-700"><Edit size={16}/></div>Modifier l'utilisateur</DialogTitle><DialogDescription>Modifiez les informations d'accès du compte.</DialogDescription></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-6">
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="edit-loginLdap" className="text-slate-700">Login LDAP *</Label><Input id="edit-loginLdap" placeholder="prenom.nom" value={formEdit.loginLdap} onChange={e=>{const val=e.target.value.toLowerCase().replace(/[^a-z.]/g,"");setFormEdit({...formEdit,loginLdap:val});handleEditValidation("loginLdap",val);}} className={cn(unifiedInputClass, editErrors.loginLdap&&"border-red-400 focus-visible:ring-red-500")}/>{editErrors.loginLdap&&<p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1"/>{editErrors.loginLdap}</p>}</div>
                <div className="space-y-1.5"><Label className="text-slate-700">Rôle d'accès *</Label><Select value={formEdit.role} onValueChange={v=>setFormEdit({...formEdit,role:v as RoleUtilisateur})}><SelectTrigger className={unifiedInputClass}><SelectValue/></SelectTrigger><SelectContent className="bg-white border border-slate-200 shadow-md">{ROLE_OPTIONS.map(r=><SelectItem key={r.value} value={r.value} className={unifiedHoverClass}>{r.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-center gap-3 pt-7"><Switch id="edit-actif" checked={formEdit.actif} onCheckedChange={c=>setFormEdit({...formEdit,actif:c})}/><Label htmlFor="edit-actif" className="text-slate-700 cursor-pointer">Compte actif</Label></div>
                <div className="space-y-1.5 sm:col-span-2"><Label className="text-slate-700">Employé associé *</Label><Popover open={editEmployeeOpen} onOpenChange={setEditEmployeeOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" className={cn(unifiedInputClass,"text-slate-900 hover:bg-slate-100 hover:text-slate-900")}><span className="truncate">{formEdit.employeId?employees.find(emp=>emp.id===formEdit.employeId)?.prenom+" "+employees.find(emp=>emp.id===formEdit.employeId)?.nom:"Sélectionner..."}</span><ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/></Button></PopoverTrigger><PopoverContent className="w-[450px] p-0 bg-white border border-slate-200 shadow-md z-[120]"><Command className="bg-white rounded-md"><CommandInput placeholder="Rechercher par nom, prénom ou matricule..." value={editEmployeeQuery} onValueChange={setEditEmployeeQuery}/><CommandList><CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                <CommandGroup>
                    {filteredEditEmployees.map((emp) => (
                      <CommandItem
                        key={emp.id}
                        onSelect={() => {
                          setFormEdit({ ...formEdit, employeId: emp.id });
                          handleEditValidation("employeId", emp.id);
                          setEditEmployeeOpen(false);
                          setEditEmployeeQuery("");
                        }}
                        className={unifiedHoverClass}
                      >
                        {emp.prenom} {emp.nom}
                        <span className="text-slate-400 ml-2 text-xs">
                          ({emp.structureNom} - Mat: {emp.matricule}{emp.grade ? ` - ${emp.grade}` : ""})
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                </Command>
                </PopoverContent>
                </Popover>
                {editErrors.employeId&&<p className="text-xs text-red-500 font-medium mt-1"><AlertCircle size={12} className="inline mr-1"/>{editErrors.employeId}</p>}</div>
              </div>
              <DialogFooter><Button variant="outline" onClick={()=>setShowEditModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button><Button onClick={handleEditUser} disabled={!isEditFormValid||isActionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">{isActionLoading?<Loader2 className="h-4 w-4 animate-spin"/>:"Enregistrer"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Suppression unitaire */}
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><AlertCircle size={20}/> Supprimer l'utilisateur</DialogTitle><DialogDescription>Êtes-vous sûr de vouloir supprimer définitivement le compte de <strong>{userToDelete?.loginLdap}</strong> ?</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="outline" onClick={()=>setShowDeleteModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button><Button variant="destructive" onClick={handleDeleteUser} disabled={isActionLoading}>Supprimer</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Suppression multiple */}
          <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><AlertCircle size={20}/> Supprimer les comptes sélectionnés</DialogTitle><DialogDescription>Voulez-vous supprimer <strong>{selectedUsers.length} compte(s)</strong> ?</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="outline" onClick={()=>setShowBulkDeleteModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button><Button variant="destructive" onClick={handleBulkDelete} disabled={isActionLoading}>Supprimer tout</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Synchro LDAP */}
          <Dialog open={showLdapSyncModal} onOpenChange={setShowLdapSyncModal}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader><DialogTitle className="flex items-center gap-2 text-slate-900"><Server size={20}/> Synchronisation Active Directory</DialogTitle><DialogDescription>Cette action va synchroniser vos comptes avec le serveur LDAP d'Al Omrane.</DialogDescription></DialogHeader>
              <DialogFooter><Button variant="outline" onClick={()=>setShowLdapSyncModal(false)} className="text-slate-700 hover:text-slate-900">Annuler</Button><Button onClick={handleLdapSync} disabled={isActionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">{isActionLoading?<Loader2 className="h-4 w-4 animate-spin mr-2"/>:<RefreshCw className="h-4 w-4 mr-2"/>} Synchroniser</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Import */}
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogContent className="sm:max-w-lg bg-white">
              <DialogHeader><DialogTitle className="flex items-center gap-2 text-slate-900"><Upload size={20}/> Importer des comptes LDAP</DialogTitle><DialogDescription>Téléchargez un fichier CSV ou Excel (XLSX) structuré.</DialogDescription></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm space-y-2">
                  <p className="font-semibold text-blue-900 flex items-center gap-1"><Info className="h-4 w-4"/> Nomenclature attendue :</p>
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded block w-fit">matricule, loginLdap, role</code>
                  <p className="text-xs text-slate-500 pt-1">- <strong>matricule</strong> : identifiant de l'employé lié<br/>- <strong>loginLdap</strong> : login LDAP (prenom.nom)<br/>- <strong>role</strong> : ADMIN, CHEF_SERVICE, EMPLOYE, RESP_LOGISTIQUE</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={downloadImportTemplate} className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200"><Download className="h-4 w-4 mr-1.5"/> Télécharger le modèle</Button>
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} className="hidden" />
                  <Button onClick={()=>fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm"><Upload className="h-4 w-4 mr-1.5"/> Choisir un fichier</Button>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={()=>setShowImportDialog(false)} className="text-slate-700 hover:text-slate-900">Annuler</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================================
              FICHE DE DÉTAIL LATÉRALE (SLIDE-OVER SHEET)
              ============================================================================ */}
          {showDetailSheet && detailUser && (
            <div className="fixed inset-0 z-[100] flex font-sans">
              <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setShowDetailSheet(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-50 shadow-2xl flex flex-col border-l border-slate-200/50" style={{ animation: "slideIn .3s cubic-bezier(.4,0,.2,1) forwards" }}>
                <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
                <div className="flex items-start gap-4 px-6 pt-8 pb-6 border-b border-slate-200 bg-white shrink-0 relative z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold shrink-0 ring-4 ring-emerald-50">{detailUser.loginLdap.slice(0,2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-lg font-bold text-slate-900 truncate leading-snug tracking-tight">{detailUser.employeNom}</p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">{roleLabelMap[detailUser.role]||detailUser.role}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <code className="text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm">{detailUser.loginLdap}</code>
                      <span className={cn("text-xs font-semibold ring-1 rounded-full px-2.5 py-0.5 shadow-sm", detailUser.actif ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200")}>{detailUser.actif ? "Actif" : "Inactif"}</span>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailSheet(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 -mt-2 -mr-2"><X className="w-4 h-4"/></button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-none bg-slate-50 relative z-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white border border-slate-200/60 shadow-sm px-4 py-3"><p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Matricule Employé</p><p className="text-sm font-bold text-slate-800 font-mono">{detailUser.employeId}</p></div>
                    <div className="rounded-xl bg-white border border-slate-200/60 shadow-sm px-4 py-3"><p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Date de création</p><p className="text-sm font-bold text-slate-800 font-mono text-xs">{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString("fr-FR") : "—"}</p></div>
                    <div className="rounded-xl bg-white border border-slate-200/60 shadow-sm px-4 py-3"><p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Dernière Connexion</p><p className="text-sm font-bold text-slate-800 font-mono text-xs">{detailUser.derniereConnexion}</p></div>
                  </div>
                  <section>
                    <header className="mb-2"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Informations Professionnelles</p></header>
                    <div className="rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                      <DetailRowTemplate label="Département" value={detailUser.department} icon={<Briefcase className="w-4 h-4"/>} />
                      <DetailRowTemplate label="Type d'accès" value={roleLabelMap[detailUser.role]||detailUser.role} icon={<ShieldCheck className="w-4 h-4"/>} />
                    </div>
                  </section>
                  <section>
                    <header className="mb-2"><p className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Coordonnées de l'employé</p></header>
                    <div className="rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                      <DetailRowTemplate label="Téléphone" value={detailUser.phone} icon={<Phone className="w-4 h-4"/>} />
                    </div>
                  </section>
                </div>
                <div className="border-t border-slate-200 px-6 py-4 flex gap-3 shrink-0 bg-white z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)]">
                  <button onClick={() => { setShowDetailSheet(false); openEditDialog(detailUser); }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"><Edit className="w-4 h-4"/> Modifier</button>
                  <button onClick={() => { setShowDetailSheet(false); openDeleteDialog(detailUser); }} className="flex-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 text-slate-700 hover:text-red-700 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-sm"><Trash2 className="w-4 h-4"/> Supprimer</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ============================================================================
// COMPOSANTS RÉUTILISABLES
// ============================================================================
function DetailRowTemplate({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 transition-colors">
      <span className="text-sm text-slate-500 font-medium flex items-center gap-2.5">{icon && <span className="text-slate-400">{icon}</span>}{label}</span>
      <span className="text-sm text-slate-900 font-semibold text-right">{value || "—"}</span>
    </div>
  );
}

function StatsCard({ title, value, icon, onClick }: { title: string; value: number; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <Card className={cn("shadow-sm border-0 bg-white/80 backdrop-blur hover:shadow-md transition-all duration-300", onClick && "cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/20")} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>{icon}</CardHeader>
      <CardContent><div className="text-2xl font-bold text-slate-800">{value}</div></CardContent>
    </Card>
  );
}