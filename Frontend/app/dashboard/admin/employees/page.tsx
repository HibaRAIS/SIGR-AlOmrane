"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Search, Plus, Edit, Trash2, Download, Upload, Mail, Phone,
  Calendar, Briefcase, Building2, X, UserCheck, UserX, Grid, List,
  CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsUpDown,
  AlertCircle, User, Info, Loader2, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw, IdCard, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { employeService } from "@/services/employe.service";
import { structureService } from "@/services/structure.service";
import type { EmployeDto, CreateEmployeRequest } from "@/types/employe";
import type { StructureFlatDto } from "@/types/structure";

// ============================================================================
// TYPES ET CONSTANTES
// ============================================================================

type EmployeeStatus = "active" | "inactive";

interface Employee {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  grade: string;
  department: string;        
  direction: string;         
  structureId: number | null;
  manager: string;
  managerId: number | null;
  hireDate: string;          
  status: EmployeeStatus;
  badge: string;
}

const GRADE_OPTIONS = [
  { value: "CHEF_DIVISION", label: "Chef de Division" },
  { value: "CHEF_DEPARTEMENT", label: "Chef de Département" },
  { value: "DIRECTEUR_AGENCE", label: "Directeur d'Agence" },
  { value: "DIRECTEUR", label: "Directeur" },
  { value: "COORDINATEUR", label: "Coordinateur" },
  { value: "DELEGUE_COMMERCIAL", label: "Délégué Commercial" },
  { value: "SECRETAIRE", label: "Secrétaire" },
  { value: "AUCUN", label: "Aucun" },
];

const gradeLabelMap = Object.fromEntries(GRADE_OPTIONS.map(g => [g.value, g.label]));

const statusConfig = {
  active: { label: "Actif", color: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle },
  inactive: { label: "Inactif", color: "bg-gray-50 text-gray-600 ring-gray-200", icon: XCircle },
};

const ITEMS_PER_PAGE = 10;

// --- STYLES UNIFIÉS (Blancs, nets, parfaits) ---
const unifiedInputClass = "flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all disabled:cursor-not-allowed disabled:opacity-50 font-normal";
const dateInputClass = cn(unifiedInputClass, "block [color-scheme:light] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity");
const unifiedHoverClass = cn(
  "cursor-pointer text-slate-700",
  "hover:bg-emerald-50 hover:text-emerald-900",
  "focus:bg-emerald-50 focus:text-emerald-900",
  "data-[highlighted]:bg-emerald-50 data-[highlighted]:text-emerald-900",
  "data-[selected]:bg-emerald-50 data-[selected]:text-emerald-900",
  "transition-colors"
);

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function escapeCSVField(value: string): string {
  if (!value) return "";
  const needsQuotes = /[",\n\r]/.test(value);
  return needsQuotes ? `"${value.replace(/"/g, '""')}"` : value;
}

const validateField = (field: string, value: string): string | null => {
  switch (field) {
    case "matricule":
      if (!value.trim()) return "Le matricule est obligatoire.";
      break;
    case "firstName":
      if (!value.trim()) return "Le prénom est obligatoire.";
      break;
    case "lastName":
      if (!value.trim()) return "Le nom est obligatoire.";
      break;
    case "email":
      if (!value.trim()) return "L'email est obligatoire.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Format d'email invalide.";
      break;
    case "phone":
      if (value && !/^(\+2126\d{8}|06\d{8})$/.test(value.replace(/[\s.-]/g, "")))
        return "Format invalide (ex: 06XX... ou +2126XX...).";
      break;
    default:
      return null;
  }
  return null;
};

// Fonction pour extraire le message d'erreur sans afficher "Request failed with status code 500"
const extractErrorMessage = (err: any, defaultMsg: string) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message && !err.message.includes('status code')) return err.message;
  return defaultMsg;
};

// Extrait un message user-friendly d'une erreur API
const getUserFriendlyError = (err: any, defaultMsg: string = "Erreur API") => {
  // essayer de récupérer le message du backend (souvent dans response.data.message)
  if (err?.response?.data?.message) {
    const msg = err.response.data.message;
    // Si le message contient le texte typique d'une contrainte unique
    if (/clé dupliquée|duplicate key|unique constraint/i.test(msg)) {
      // Tenter d'extraire le nom du champ concerné
      if (/matricule/i.test(msg)) return "Ce matricule existe déjà.";
      if (/email_professionnel|email/i.test(msg)) return "Cet email existe déjà.";
      if (/badge/i.test(msg)) return "Ce badge existe déjà.";
      return "Une valeur en double a été détectée (matricule, email ou badge).";
    }
    return msg;
  }
  // Sinon, extraire un message générique sans les détails SQL
  if (err?.message && !err.message.includes('status code')) {
    // Nettoyer le message SQL s'il est présent
    if (err.message.includes('ERREUR:')) {
      return err.message.split('ERREUR:')[1].split('  Detail:')[0].trim();
    }
    return err.message;
  }
  return defaultMsg;
};

const isoToDisplay = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const displayToISO = (display: string) => {
  if (!display) return "";
  const parts = display.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return display;
};

type SortColumn = 'hireDate' | 'lastName' | 'firstName' | 'matricule' | 'department' | 'grade' | 'status';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export default function EmployeesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ÉTATS : DONNÉES ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [structures, setStructures] = useState<StructureFlatDto[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // --- ÉTATS : FILTRES & PAGINATION ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  

  // --- ÉTATS : TRI ---
  const [sortColumn, setSortColumn] = useState<SortColumn>('hireDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // --- ÉTATS : DIALOGUES & FORMULAIRES ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  const [formAdd, setFormAdd] = useState({
    matricule: "", firstName: "", lastName: "", email: "", phone: "",
    grade: "AUCUN", department: "", direction: "", manager: "", badge: "",
    hireDate: "", structureId: null as number | null, managerId: null as number | null,
  });
  const [formEdit, setFormEdit] = useState({
    matricule: "", firstName: "", lastName: "", email: "", phone: "",
    grade: "", department: "", direction: "", manager: "", badge: "",
    hireDate: "", status: "active" as EmployeeStatus,
    structureId: null as number | null, managerId: null as number | null,
  });

  const [addErrors, setAddErrors] = useState<Record<string, string | null>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string | null>>({});

  // --- ÉTATS : COMBOBOXES INTERNES ---
  const [managerAddOpen, setManagerAddOpen] = useState(false);
  const [managerAddQuery, setManagerAddQuery] = useState("");
  const [managerEditOpen, setManagerEditOpen] = useState(false);
  const [managerEditQuery, setManagerEditQuery] = useState("");
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [addDeptQuery, setAddDeptQuery] = useState("");
  const [editDeptOpen, setEditDeptOpen] = useState(false);
  const [editDeptQuery, setEditDeptQuery] = useState("");
  const [deptFilterOpen, setDeptFilterOpen] = useState(false);
  const [deptFilterQuery, setDeptFilterQuery] = useState("");
  const [gradeFilterOpen, setGradeFilterOpen] = useState(false);
  const [gradeFilterQuery, setGradeFilterQuery] = useState("");

  // ============================================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================================
  
  const loadData = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const [empData, structData] = await Promise.all([
        employeService.getAll(),
        structureService.getAllFlat(),
      ]);
      const mapped: Employee[] = empData.map(e => ({
        id: String(e.id),
        matricule: e.matricule ?? "",
        firstName: e.prenom ?? "",
        lastName: e.nom ?? "",
        email: e.emailProfessionnel ?? "",
        phone: e.telephone ?? "",
        grade: e.grade ?? "",
        department: e.structureNom ?? "",
        direction: e.structureNom ?? "",
        structureId: e.structureId,
        manager: e.managerNom || "-",
        managerId: e.managerId,
        hireDate: e.dateEmbauche ? isoToDisplay(e.dateEmbauche) : "",
        status: e.actif ? "active" : "inactive",
        badge: e.badge || "",
      }));
      setEmployees(mapped);
      setStructures(structData);
    } catch (err: any) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ============================================================================
  // LOGIQUE : FILTRAGE ET TRI
  // ============================================================================

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = `${emp.firstName} ${emp.lastName} ${emp.email} ${emp.matricule} ${gradeLabelMap[emp.grade] || emp.grade}`
        .toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDepartment === "all" || emp.department === selectedDepartment;
      const matchesStatus = selectedStatus === "all" || emp.status === selectedStatus;
      const matchesGrade = selectedGrade === "all" || emp.grade === selectedGrade;
      return matchesSearch && matchesDept && matchesStatus && matchesGrade;
    });
  }, [employees, searchQuery, selectedDepartment, selectedStatus, selectedGrade]);

  const sortedEmployees = useMemo(() => {
    const sorted = [...filteredEmployees];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';
      switch (sortColumn) {
        case 'hireDate':
          const dateA = a.hireDate ? new Date(displayToISO(a.hireDate)) : new Date(0);
          const dateB = b.hireDate ? new Date(displayToISO(b.hireDate)) : new Date(0);
          return sortDirection === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
        case 'lastName': valA = a.lastName.toLowerCase(); valB = b.lastName.toLowerCase(); break;
        case 'firstName': valA = a.firstName.toLowerCase(); valB = b.firstName.toLowerCase(); break;
        case 'matricule': valA = a.matricule.toLowerCase(); valB = b.matricule.toLowerCase(); break;
        case 'department': valA = a.department.toLowerCase(); valB = b.department.toLowerCase(); break;
        case 'grade': valA = a.grade.toLowerCase(); valB = b.grade.toLowerCase(); break;
        case 'status': valA = a.status; valB = b.status; break;
        default: return 0;
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredEmployees, sortColumn, sortDirection]);

  const totalPages = Math.ceil(sortedEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = sortedEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: Function, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery !== "" || 
                           selectedDepartment !== "all" || 
                           selectedStatus !== "all" || 
                           selectedGrade !== "all" || 
                           sortColumn !== 'hireDate' || 
                           sortDirection !== 'desc';

  const clearFilters = () => {
    setSearchQuery(""); 
    setSelectedDepartment("all"); 
    setSelectedStatus("all"); 
    setSelectedGrade("all");
    setSortColumn('hireDate');
    setSortDirection('desc');
    setCurrentPage(1);
  };

  // ============================================================================
  // LOGIQUE : ACTIONS & EXPORTS
  // ============================================================================

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    inactive: employees.filter(e => e.status === "inactive").length,
    departments: structures.length,
  }), [employees, structures]);

  const toggleSelectAll = () => {
    if (selectedEmployees.length === sortedEmployees.length) setSelectedEmployees([]);
    else setSelectedEmployees(sortedEmployees.map(e => e.id));
  };
  
  const toggleSelectEmployee = (id: string) => {
    setSelectedEmployees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const generateCSVContent = (list: Employee[]) => {
    const headers = ["matricule", "prenom", "nom", "email", "telephone", "grade", "departement", "direction", "manager", "badge", "statut", "date_embauche"];
    const rows = list.map(e => [
      escapeCSVField(e.matricule), escapeCSVField(e.firstName), escapeCSVField(e.lastName),
      escapeCSVField(e.email), escapeCSVField(e.phone), escapeCSVField(gradeLabelMap[e.grade] || e.grade),
      escapeCSVField(e.department), escapeCSVField(e.direction), escapeCSVField(e.manager),
      escapeCSVField(e.badge), escapeCSVField(e.status), escapeCSVField(e.hireDate),
    ]);
    return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const list = selectedEmployees.length > 0 ? employees.filter(e => selectedEmployees.includes(e.id)) : sortedEmployees;
    downloadFile(generateCSVContent(list), "employes.csv", "text/csv;charset=utf-8;");
    toast.success(`${list.length} employé(s) exporté(s) en CSV.`);
  };

  const handleExportExcel = () => {
    const list = selectedEmployees.length > 0 ? employees.filter(e => selectedEmployees.includes(e.id)) : sortedEmployees;
    const csv = generateCSVContent(list);
    const ws = XLSX.utils.aoa_to_sheet(csv.split("\n").map(row => row.split(",")));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employés");
    XLSX.writeFile(wb, "employes.xlsx");
    toast.success(`${list.length} employé(s) exporté(s) en Excel.`);
  };

  const handleExportPDF = async () => {
    const list = selectedEmployees.length > 0 ? employees.filter(e => selectedEmployees.includes(e.id)) : sortedEmployees;
    if (list.length === 0) {
      toast.error("Aucune donnée à exporter");
      return;
    }
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const logoUrl = "/images/alomrane-logo.png";

      let logoDataUrl = "";
      try {
        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
        const canvas = document.createElement("canvas");
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0);
        logoDataUrl = canvas.toDataURL("image/png");
      } catch (e) { /* silent fail for logo */ }

      const addHeaderFooter = (currentPage: number, totalPages: number) => {
        if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", margin, 1, 45, 35);
        doc.setFontSize(18); doc.setTextColor(27, 94, 32); doc.setFont("helvetica", "bold");
        doc.text("AL OMRANE - SOUSS MASSA", logoDataUrl ? margin + 40 : margin, 18);
        doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
        doc.text("Liste des Employés", logoDataUrl ? margin + 40 : margin, 25);
        doc.setFontSize(8); doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, margin, 32);
        doc.setDrawColor(200, 200, 200); doc.line(margin, 35, pageWidth - margin, 35);
        const footerY = doc.internal.pageSize.getHeight() - 10;
        doc.setFontSize(7); doc.setTextColor(150, 150, 150);
        doc.text(`Document confidentiel - Page ${currentPage} / ${totalPages}`, margin, footerY);
        doc.text("Al Omrane - Tous droits réservés", pageWidth - margin - 40, footerY, { align: "right" });
      };

      const headers = ["Matricule", "Prénom", "Nom", "Email", "Téléphone", "Grade", "Département", "Manager", "Statut", "Date embauche"];
      const rows = list.map(e => [
        e.matricule, e.firstName, e.lastName, e.email, e.phone,
        gradeLabelMap[e.grade] || e.grade, e.department, e.manager,
        e.status === 'active' ? 'Actif' : 'Inactif', e.hireDate,
      ]);

      autoTable(doc, {
        head: [headers], body: rows, startY: 40, margin: { top: 40, left: margin, right: margin, bottom: 20 },
        styles: { fontSize: 8, cellPadding: 3, valign: "middle", halign: "left", textColor: [50, 50, 50], lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: [27, 94, 32], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        didDrawPage: (data) => addHeaderFooter(data.pageNumber, doc.getNumberOfPages()),
      });

      doc.save(`employes_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exporté");
    } catch (err: any) {
      toast.error("Erreur lors de l'export PDF");
    }
  };

  // ============================================================================
  // LOGIQUE : API CRUD (AVEC LE BACKEND STRICT SUR L'ACTIVATION)
  // ============================================================================

  const handleAddFieldChange = (field: string, value: string) => {
    const safeValue = String(value ?? '');
    setFormAdd(prev => ({ ...prev, [field]: safeValue }));
    // Validation basique
    const basicError = validateField(field, safeValue);
    // Validation de doublons
    let duplicateError: string | null = null;
    if (field === 'matricule' && safeValue.trim() !== '') {
      if (employees.some(emp => emp.matricule.toLowerCase() === safeValue.trim().toLowerCase())) {
        duplicateError = 'Ce matricule est déjà utilisé.';
      }
    }
    if (field === 'badge' && safeValue.trim() !== '') {
      if (employees.some(emp => emp.badge?.toLowerCase() === safeValue.trim().toLowerCase())) {
        duplicateError = 'Ce badge est déjà attribué.';
      }
    }
    if (field === 'email' && safeValue.trim() !== '') {
      if (employees.some(emp => emp.email.toLowerCase() === safeValue.trim().toLowerCase())) {
        duplicateError = 'Cet email est déjà utilisé.';
      }
    }
    setAddErrors(prev => ({ ...prev, [field]: basicError || duplicateError }));
  };

  const handleEditFieldChange = (field: string, value: string) => {
    const safeValue = String(value ?? '');
    setFormEdit(prev => ({ ...prev, [field]: safeValue }));
    const basicError = validateField(field, safeValue);
    let duplicateError: string | null = null;
    const currentId = editingEmployee?.id;
    if (field === 'matricule' && safeValue.trim() !== '') {
      if (employees.some(emp => emp.id !== currentId && emp.matricule.toLowerCase() === safeValue.trim().toLowerCase())) {
        duplicateError = 'Ce matricule est déjà utilisé.';
      }
    }
    if (field === 'badge' && safeValue.trim() !== '') {
      const currentId = editingEmployee?.id;
      if (employees.some(emp => emp.id !== currentId && emp.badge?.toLowerCase() === safeValue.trim().toLowerCase())) {
        duplicateError = 'Ce badge est déjà attribué.';
      }
    }
    if (field === 'email' && safeValue.trim() !== '') {
      if (employees.some(emp => emp.id !== currentId && emp.email.toLowerCase() === safeValue.trim().toLowerCase())) {
        duplicateError = 'Cet email est déjà utilisé.';
      }
    }
    setEditErrors(prev => ({ ...prev, [field]: basicError || duplicateError }));
  };

  const isAddFormValid = useMemo(() => {
    const required = ["matricule", "firstName", "lastName", "email"] as const;
    return !Object.values(addErrors).some(err => err) && required.every(f => String(formAdd[f] ?? '').trim().length > 0);
  }, [addErrors, formAdd]);

  const isEditFormValid = useMemo(() => {
    const required = ["matricule", "firstName", "lastName", "email"] as const;
    return !Object.values(editErrors).some(err => err) && required.every(f => String(formEdit[f] ?? '').trim().length > 0);
  }, [editErrors, formEdit]);

  const resetAddForm = () => {
    setFormAdd({
      matricule: "", firstName: "", lastName: "", email: "", phone: "",
      grade: "AUCUN", department: "", direction: "", manager: "", badge: "",
      hireDate: "", structureId: null, managerId: null,
    });
    setAddErrors({});
  };

  // 1. CRÉATION D'EMPLOYÉ
  const handleAddEmployee = async () => {
    if (!isAddFormValid) return;
    setIsActionLoading(true);
    try {
      const payload: CreateEmployeRequest = {
        matricule: formAdd.matricule.trim(), 
        badge: formAdd.badge.trim() || undefined, 
        nom: formAdd.lastName.trim(),
        prenom: formAdd.firstName.trim(), 
        emailProfessionnel: formAdd.email.trim(), 
        telephone: formAdd.phone.trim() || undefined, 
        grade: formAdd.grade, 
        structureId: formAdd.structureId, 
        managerId: formAdd.managerId, 
        dateEmbauche: formAdd.hireDate || undefined,
      };
      
      const created = await employeService.create(payload);
      
      try {
        await employeService.updateStatus(created.id, true);
        toast.success("Employé créé et activé avec succès.");
      } catch (err: any) {
        toast.warning("Employé créé, mais impossible de l'activer (aucun compte utilisateur associé).", { duration: 6000 });
      }
      
      setShowAddModal(false);
      resetAddForm();
      await loadData();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Erreur lors de la création de l'employé."));
    } finally {
      setIsActionLoading(false);
    }
  };

  // 2. ÉDITION D'EMPLOYÉ
  const openEditDialog = (emp: Employee) => {
    setEditingEmployee(emp);
    const dateIso = displayToISO(emp.hireDate);
    setFormEdit({
      matricule: emp.matricule ?? '', firstName: emp.firstName ?? '', lastName: emp.lastName ?? '',
      email: emp.email ?? '', phone: emp.phone ?? '', grade: emp.grade ?? '',
      department: emp.department ?? '', direction: emp.direction ?? '', manager: emp.manager === "-" ? "__none__" : (emp.manager ?? ''),
      badge: emp.badge ?? '', hireDate: dateIso ?? '', status: emp.status ?? 'active',
      structureId: emp.structureId, managerId: emp.managerId,
    });
    setEditErrors({});
    setShowEditModal(true);
  };

const handleEditEmployee = async () => {
    if (!editingEmployee || !isEditFormValid) return;
    setIsActionLoading(true);
    try {
      const payload: CreateEmployeRequest = {
        matricule: formEdit.matricule.trim(), 
        badge: formEdit.badge.trim() || undefined, 
        nom: formEdit.lastName.trim(),
        prenom: formEdit.firstName.trim(), 
        emailProfessionnel: formEdit.email.trim(), 
        telephone: formEdit.phone.trim() || undefined,
        grade: formEdit.grade, 
        structureId: formEdit.structureId, 
        managerId: formEdit.managerId, 
        dateEmbauche: formEdit.hireDate || undefined,
      };
      
      await employeService.update(Number(editingEmployee.id), payload);
      
      let statusError = false;
      if (formEdit.status !== editingEmployee.status) {
        try {
          await employeService.updateStatus(Number(editingEmployee.id), formEdit.status === "active");
        } catch (err: any) {
          statusError = true;
        }
      }

      if (statusError) {
        toast.warning("Informations modifiées, mais impossible d'activer (aucun compte utilisateur associé).", { duration: 6000 });
      } else {
        toast.success("Employé modifié avec succès.");
      }
      
      setShowEditModal(false);
      setEditingEmployee(null);
      await loadData();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Erreur lors de la modification de l'employé."));
    } finally {
      setIsActionLoading(false);
    }
  };

  // 3. SUPPRESSION D'EMPLOYÉ
  const openDeleteDialog = (emp: Employee) => { setEmployeeToDelete(emp); setShowDeleteModal(true); };
  
  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    setIsActionLoading(true);
    try {
      await employeService.delete(Number(employeeToDelete.id));
      toast.success("Employé supprimé avec succès.");
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, "Erreur lors de la suppression."));
    } finally {
      setIsActionLoading(false);
    }
  };

  // 4. SUPPRESSION EN MASSE
  const handleBulkDelete = async () => {
    setIsActionLoading(true);
    try {
      await Promise.all(selectedEmployees.map(id => employeService.delete(Number(id))));
      toast.success(`${selectedEmployees.length} employé(s) supprimé(s).`);
      setShowBulkDeleteModal(false);
      setSelectedEmployees([]);
      await loadData();
    } catch (err: any) {
      toast.error("Échec de la suppression groupée.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // 5. ACTIVATION/DÉSACTIVATION EN MASSE
  const handleBulkStatusChange = async (newStatus: EmployeeStatus) => {
    const actif = newStatus === "active";
    setIsActionLoading(true);
    
    let successCount = 0;
    let failedCount = 0;

    for (const id of selectedEmployees) {
      try {
        await employeService.updateStatus(Number(id), actif);
        successCount++;
      } catch (err) {
        failedCount++;
      }
    }

    if (failedCount === 0) {
      toast.success(`${successCount} employé(s) mis à jour avec succès.`);
    } else if (successCount === 0) {
      toast.error("Aucun employé mis à jour. Créez un compte pour qu'ils puissent être activés.", { duration: 6000 });
    } else {
      toast.warning(`${successCount} employé(s) activés. ${failedCount} ont été ignorés (aucun compte associé).`, { duration: 6000 });
    }

    setSelectedEmployees([]);
    await loadData();
    setIsActionLoading(false);
  };

  // 6. IMPORT API LOGIC
  const processUploadedFile = async (file: File) => {
    setIsActionLoading(true);
    const toastId = toast.loading("Import en cours...");
    try {
      let rows: any[] = [];
      if (file.name.endsWith(".csv") || file.name.endsWith(".txt")) {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) throw new Error("Fichier vide");
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
        rows = lines.slice(1).map(line => {
          const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const obj: any = {};
          headers.forEach((h, i) => obj[h] = vals[i] || "");
          return obj;
        });
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      } else {
        throw new Error("Format non supporté (utilisez CSV, XLSX ou XLS).");
      }
 

    let createdCount = 0;
    let failedCount = 0;
    const failedReasons: string[] = [];
    const existingMatricules = new Set(employees.map(e => e.matricule.toLowerCase()));

    for (const row of rows) {
      const prenom = String(row.prenom ?? "").trim();
      const nom = String(row.nom ?? "").trim();
      const email = String(row.email ?? "").trim();
      const matricule = String(row.matricule ?? "").trim();

      if (!prenom || !nom || !email || !matricule) {
        failedCount++;
        failedReasons.push(`Champs obligatoires manquants (prénom, nom, email ou matricule).`);
        continue;
      }

      // Doublon local : matricule
      if (existingMatricules.has(matricule.toLowerCase())) {
        failedCount++;
        failedReasons.push(`Matricule "${matricule}" déjà utilisé.`);
        continue;
      }

      // Doublon local : email (optionnel mais améliore l'expérience)
      if (employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
        failedCount++;
        failedReasons.push(`Email "${email}" déjà attribué à un autre employé.`);
        continue;
      }

      const grade = GRADE_OPTIONS.some(g => g.value === row.grade) ? row.grade : "AUCUN";
      const dateStr = row.date_embauche || "";
      const dateIso = dateStr.includes("/") ? dateStr.split("/").reverse().join("-") : dateStr;

      const payload: CreateEmployeRequest = {
        matricule,
        badge: String(row.badge ?? "").trim() || undefined,
        nom,
        prenom,
        emailProfessionnel: email,
        telephone: String(row.telephone ?? "").trim() || undefined,
        grade,
        structureId: null,
        managerId: null,
        dateEmbauche: dateIso || undefined,
      };

      try {
        const created = await employeService.create(payload);
        try { await employeService.updateStatus(created.id, true); } catch(e) {}
        createdCount++;
        existingMatricules.add(matricule.toLowerCase());
      } catch (err: any) {
        failedCount++;
        // Nettoyage du message d'erreur
        const reason = getUserFriendlyError(err);
        failedReasons.push(`${prenom} ${nom} (${matricule}) : ${reason}`);
      }
    }

    // Toast final (ferme automatiquement le toast "Import en cours…")
    if (createdCount > 0) {
      if (failedCount > 0) {
        const details = failedReasons.slice(0, 3).join('\n');
        toast.warning(
          `${createdCount} employé(s) importé(s). ${failedCount} échec(s).\n${details}`,
          { id: toastId, duration: 8000 }
        );
      } else {
        toast.success(`${createdCount} employé(s) importé(s) avec succès.`, { id: toastId });
      }
    } else if (failedCount > 0) {
      const details = failedReasons.slice(0, 3).join('\n');
      toast.error(
        `Aucun employé importé. ${failedCount} échec(s).\n${details}`,
        { id: toastId, duration: 8000 }
      );
    } else {
      toast.error("Aucune donnée valide dans le fichier.", { id: toastId });
    }

    // Recharger les données si au moins une création a réussi
    if (createdCount > 0) await loadData();

  } catch (err: any) {
    // Erreur globale de lecture du fichier
    toast.error(extractErrorMessage(err, "Erreur lors de la lecture du fichier."), { id: toastId });
  } finally {
    setIsActionLoading(false);
    setShowImportModal(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const downloadImportTemplate = () => {
    const csv = "prenom,nom,email,matricule,telephone,grade,departement,direction,manager,badge,statut,date_embauche\nMohammed,Alami,m.alami@alomrane.ma,AO-2024-001,0612345678,DIRECTEUR,Direction Générale,Direction Générale,-,B-001,active,15/01/2020";
    downloadFile(csv, "modele_import_employes.csv", "text/csv;charset=utf-8;");
  };

  const openDetailSheet = (emp: Employee) => { setDetailEmployee(emp); setShowDetailSheet(true); };

  // ============================================================================
  // PREPARATION DES DONNEES DES COMBOBOXES
  // ============================================================================

  const departmentList = useMemo(() => Array.from(new Set(structures.map(s => s.nom))), [structures]);
  const managerOptions = useMemo(() => employees.map(e => ({ id: e.id, name: `${e.firstName} ${e.lastName}` })), [employees]);

  const filteredDeptFilter = useMemo(() => {
    if (!deptFilterQuery) return departmentList;
    return departmentList.filter(d => d.toLowerCase().includes(deptFilterQuery.toLowerCase()));
  }, [deptFilterQuery, departmentList]);
  
  const filteredGradeFilter = useMemo(() => {
    if (!gradeFilterQuery) return GRADE_OPTIONS;
    return GRADE_OPTIONS.filter(g => g.label.toLowerCase().includes(gradeFilterQuery.toLowerCase()));
  }, [gradeFilterQuery]);
  
  const filteredManagerAddOptions = useMemo(() => {
    if (!managerAddQuery) return managerOptions;
    return managerOptions.filter(m => m.name.toLowerCase().includes(managerAddQuery.toLowerCase()));
  }, [managerAddQuery, managerOptions]);
  
  const filteredManagerEditOptions = useMemo(() => {
    if (!managerEditQuery) return managerOptions;
    return managerOptions.filter(m => m.name.toLowerCase().includes(managerEditQuery.toLowerCase()));
  }, [managerEditQuery, managerOptions]);
  
  const filteredAddDept = useMemo(() => {
    if (!addDeptQuery) return departmentList;
    return departmentList.filter(d => d.toLowerCase().includes(addDeptQuery.toLowerCase()));
  }, [addDeptQuery, departmentList]);
  
  const filteredEditDept = useMemo(() => {
    if (!editDeptQuery) return departmentList;
    return departmentList.filter(d => d.toLowerCase().includes(editDeptQuery.toLowerCase()));
  }, [editDeptQuery, departmentList]);

  // Composant d'en-tête triable
  const SortableHeader = ({ column, label, currentColumn, direction, onClick }: {
    column: SortColumn; label: string; currentColumn: SortColumn; direction: SortDirection; onClick: (col: SortColumn) => void;
  }) => (
    <div className="flex items-center gap-1 cursor-pointer select-none" onClick={() => onClick(column)}>
      {label}
      {currentColumn === column ? (
        direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 text-gray-300" />
      )}
    </div>
  );

  // ============================================================================
  // RENDU DU COMPOSANT PRINCIPAL
  // ============================================================================

  if (isInitialLoading) {
    return (<SidebarProvider><SidebarInset><main className="flex-1 flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></main></SidebarInset></SidebarProvider>);
  }

  return (
    <SidebarProvider>
      <SidebarInset>
        <main className="flex-1 p-4 lg:p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
          {/* En-tête */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Employés</h1>
            <p className="text-slate-500">Gérer les informations du personnel</p>
          </div>

          {/* Statistiques */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard title="Total" value={stats.total} icon={<Briefcase className="text-blue-500" />} onClick={() => { setSelectedStatus("all"); setCurrentPage(1); }} />
            <StatsCard title="Actifs" value={stats.active} icon={<UserCheck className="text-emerald-500" />} onClick={() => { setSelectedStatus("active"); setCurrentPage(1); }} />
            <StatsCard title="Inactifs" value={stats.inactive} icon={<UserX className="text-slate-500" />} onClick={() => { setSelectedStatus("inactive"); setCurrentPage(1); }} />
            <StatsCard title="Départements" value={stats.departments} icon={<Building2 className="text-indigo-500" />} onClick={() => { }} />
          </div>

          {/* Barre filtres + actions parfaitement ajustée sur une ligne */}
          <div className="flex items-center justify-between w-full p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Filtres - Partie gauche */}
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto overflow-y-hidden scrollbar-none">
              
              {/* Bouton Réinitialiser bien visible à gauche s'il y a des filtres actifs ou un tri spécifique */}
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 shrink-0 font-medium transition-colors">
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Réinitialiser
                </Button>
              )}

              <div className="relative shrink min-w-[120px] max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Recherche..."
                  className="pl-9 h-9 w-full text-sm rounded-lg bg-slate-50 border-slate-200 text-slate-700 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:bg-white shadow-none transition-all"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <Popover open={deptFilterOpen} onOpenChange={setDeptFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 whitespace-nowrap shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200 transition-colors">
                    {selectedDepartment === "all" ? "Département" : selectedDepartment}
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0 bg-white border border-slate-200 shadow-md">
                  <Command shouldFilter={false} className="bg-white rounded-md">
                    <CommandInput placeholder="Rechercher..." value={deptFilterQuery} onValueChange={setDeptFilterQuery} />
                    <CommandList>
                      <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedDepartment("all"); setDeptFilterOpen(false); setDeptFilterQuery(""); }} className={unifiedHoverClass}>Tous</CommandItem>
                        {filteredDeptFilter.map(dept => (
                          <CommandItem key={dept} onSelect={() => { setSelectedDepartment(dept); setDeptFilterOpen(false); setDeptFilterQuery(""); }} className={unifiedHoverClass}>{dept}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Select value={selectedStatus} onValueChange={(v) => handleFilterChange(setSelectedStatus, v)}>
                <SelectTrigger className="h-9 w-[130px] text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200 transition-colors">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 shadow-md">
                  <SelectItem value="all" className={unifiedHoverClass}>Tous les statuts</SelectItem>
                  <SelectItem value="active" className={unifiedHoverClass}>Actif</SelectItem>
                  <SelectItem value="inactive" className={unifiedHoverClass}>Inactif</SelectItem>
                </SelectContent>
              </Select>
              <Popover open={gradeFilterOpen} onOpenChange={setGradeFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 whitespace-nowrap shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200 transition-colors">
                    {selectedGrade === "all" ? "Grade" : gradeLabelMap[selectedGrade] || selectedGrade}
                    <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0 bg-white border border-slate-200 shadow-md">
                  <Command shouldFilter={false} className="bg-white rounded-md">
                    <CommandInput placeholder="Rechercher..." value={gradeFilterQuery} onValueChange={setGradeFilterQuery} />
                    <CommandList>
                      <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedGrade("all"); setGradeFilterOpen(false); setGradeFilterQuery(""); }} className={unifiedHoverClass}>Tous</CommandItem>
                        {filteredGradeFilter.map(g => (
                          <CommandItem key={g.value} onSelect={() => { setSelectedGrade(g.value); setGradeFilterOpen(false); setGradeFilterQuery(""); }} className={unifiedHoverClass}>{g.label}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Actions - Partie droite */}
            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-slate-100 ml-1.5">
              <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 shadow-none">
                <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-none text-slate-700 hover:text-slate-900 hover:bg-slate-100", viewMode === "list" && "bg-white text-emerald-700 hover:text-emerald-800 shadow-sm")} onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className={cn("h-9 w-9 rounded-none text-slate-700 hover:text-slate-900 hover:bg-slate-100", viewMode === "grid" && "bg-white text-emerald-700 hover:text-emerald-800 shadow-sm")} onClick={() => setViewMode("grid")}><Grid className="h-4 w-4" /></Button>
              </div>
              <Button variant="outline" onClick={handleExportCSV} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Download className="h-4 w-4 mr-1.5" /> CSV</Button>
              <Button variant="outline" onClick={handleExportExcel} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Download className="h-4 w-4 mr-1.5" /> Excel</Button>
              <Button variant="outline" onClick={handleExportPDF} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Download className="h-4 w-4 mr-1.5" /> PDF</Button>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} className="hidden" />
              <Button variant="outline" onClick={() => setShowImportModal(true)} className="h-9 px-3 text-sm rounded-lg bg-slate-50 border-slate-200 shrink-0 shadow-none text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"><Upload className="h-4 w-4 mr-1.5" /> Importer</Button>
              <Button className="h-9 px-4 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0 shadow-sm transition-colors" onClick={() => setShowAddModal(true)}><Plus className="h-4 w-4 mr-1.5" /> Ajouter</Button>
            </div>
          </div>

          {/* Action de masse (quand des cases sont cochées) */}
          {selectedEmployees.length > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-medium text-sm">{selectedEmployees.length} sélectionné(s)</span>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange("active")} className="text-slate-700 hover:text-slate-900 hover:bg-white">Activer</Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange("inactive")} className="text-slate-700 hover:text-slate-900 hover:bg-white">Désactiver</Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-slate-700 hover:text-slate-900 hover:bg-white">Exporter</Button>
                <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteModal(true)}>Supprimer</Button>
              </div>
            </div>
          )}

          {/* Vue liste / grille */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEmployees.map(emp => {
                const { icon: StatusIcon, label, color } = statusConfig[emp.status];
                return (
                  <Card key={emp.id} className={cn("relative shadow-sm border-0 bg-white/90 hover:shadow-md transition-shadow", selectedEmployees.includes(emp.id) && "ring-2 ring-blue-500")}>
                    <CardHeader className="flex flex-row items-start justify-between pb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={selectedEmployees.includes(emp.id)} onCheckedChange={() => toggleSelectEmployee(emp.id)} />
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{emp.firstName[0]}{emp.lastName[0]}</div>
                      </div>
                      <Badge variant="outline" className={cn("gap-1 font-semibold ring-1", color)}><StatusIcon className="h-3 w-3" /> {label}</Badge>
                    </CardHeader>
                    <CardContent className="space-y-2 cursor-pointer" onClick={() => openDetailSheet(emp)}>
                      <h3 className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</h3>
                      <p className="text-sm text-slate-500">{gradeLabelMap[emp.grade]}</p>
                      <div className="text-xs text-slate-400 space-y-1">
                        <div className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {emp.department}</div>
                        <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {emp.email}</div>
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {emp.hireDate}</div>
                      </div>
                      <Badge variant="outline" className="text-slate-500">{emp.badge}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="shadow-sm border-0 bg-white/90 backdrop-blur overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="w-12"><Checkbox checked={selectedEmployees.length === sortedEmployees.length && sortedEmployees.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                      <TableHead>Employé</TableHead>
                      <TableHead>
                        <SortableHeader column="matricule" label="Matricule" currentColumn={sortColumn} direction={sortDirection} onClick={handleSort} />
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="grade" label="Grade" currentColumn={sortColumn} direction={sortDirection} onClick={handleSort} />
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="department" label="Département" currentColumn={sortColumn} direction={sortDirection} onClick={handleSort} />
                      </TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>
                        <SortableHeader column="status" label="Statut" currentColumn={sortColumn} direction={sortDirection} onClick={handleSort} />
                      </TableHead>
                      <TableHead>
                        <SortableHeader column="hireDate" label="Date embauche" currentColumn={sortColumn} direction={sortDirection} onClick={handleSort} />
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.map(emp => {
                      const { icon: StatusIcon, label, color } = statusConfig[emp.status];
                      return (
                        <TableRow key={emp.id} className={cn("hover:bg-slate-50/50 transition-colors border-b border-slate-100", selectedEmployees.includes(emp.id) && "bg-blue-50/50 hover:bg-blue-50/80")}>
                          <TableCell><Checkbox checked={selectedEmployees.includes(emp.id)} onCheckedChange={() => toggleSelectEmployee(emp.id)} /></TableCell>
                          <TableCell className="font-medium cursor-pointer" onClick={() => openDetailSheet(emp)}>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm shrink-0">{emp.firstName[0]}{emp.lastName[0]}</div>
                              <div><p className="text-slate-900 leading-tight">{emp.firstName} {emp.lastName}</p><p className="text-xs text-slate-500">{emp.email}</p></div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-slate-700">{emp.matricule}</TableCell>
                          <TableCell className="text-slate-700">{gradeLabelMap[emp.grade]}</TableCell>
                          <TableCell className="text-slate-700">{emp.department}</TableCell>
                          <TableCell><Badge variant="outline" className="text-slate-500 font-normal">{emp.badge}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={cn("gap-1 font-semibold ring-1", color)}><StatusIcon className="h-3 w-3" /> {label}</Badge></TableCell>
                          <TableCell className="text-slate-700">{emp.hireDate}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" onClick={() => openDetailSheet(emp)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" onClick={() => openEditDialog(emp)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => openDeleteDialog(emp)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white">
                <p className="text-sm text-slate-500">Page {currentPage} sur {totalPages} · {sortedEmployees.length} employé(s)</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="text-slate-700 hover:text-slate-900"><ChevronLeft className="h-4 w-4" /></Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button key={page} variant={page === currentPage ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className={cn("min-w-[36px]", page !== currentPage && "text-slate-700 hover:text-slate-900")}>{page}</Button>
                  ))}
                  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="text-slate-700 hover:text-slate-900"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          )}

          {/* ============================================================================
              DIALOGUES (MODALS)
              ============================================================================ */}

          {/* 1. Modal AJOUT */}
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="sm:max-w-xl bg-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg text-slate-900"><div className="p-1 rounded-lg bg-emerald-100 text-emerald-700"><User size={16} /></div>Nouvel employé</DialogTitle>
                <DialogDescription>Les champs marqués d'un astérisque (*) sont obligatoires.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-6">
                <div className="space-y-1.5">
                  <Label htmlFor="add-matricule" className="text-slate-700">Matricule *</Label>
                  <Input id="add-matricule" placeholder="Ex: AO-2024-001" value={formAdd.matricule ?? ''} onChange={e => handleAddFieldChange("matricule", e.target.value)} className={cn(unifiedInputClass, addErrors.matricule && "border-red-400 focus-visible:ring-red-500")} />
                  {addErrors.matricule && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{addErrors.matricule}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-firstName" className="text-slate-700">Prénom *</Label>
                  <Input id="add-firstName" placeholder="Prénom" value={formAdd.firstName ?? ''} onChange={e => handleAddFieldChange("firstName", e.target.value)} className={cn(unifiedInputClass, addErrors.firstName && "border-red-400 focus-visible:ring-red-500")} />
                  {addErrors.firstName && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{addErrors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-lastName" className="text-slate-700">Nom *</Label>
                  <Input id="add-lastName" placeholder="Nom" value={formAdd.lastName ?? ''} onChange={e => handleAddFieldChange("lastName", e.target.value)} className={cn(unifiedInputClass, addErrors.lastName && "border-red-400 focus-visible:ring-red-500")} />
                  {addErrors.lastName && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{addErrors.lastName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-email" className="text-slate-700">Email *</Label>
                  <Input id="add-email" type="email" placeholder="email@alomrane.ma" value={formAdd.email ?? ''} onChange={e => handleAddFieldChange("email", e.target.value)} className={cn(unifiedInputClass, addErrors.email && "border-red-400 focus-visible:ring-red-500")} />
                  {addErrors.email && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{addErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="add-phone" className="text-slate-700">Téléphone</Label>
                  <Input id="add-phone" placeholder="+212 6XX XXX XXX" value={formAdd.phone ?? ''} onChange={e => handleAddFieldChange("phone", e.target.value)} className={cn(unifiedInputClass, addErrors.phone && "border-red-400 focus-visible:ring-red-500")} />
                  {addErrors.phone && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{addErrors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Grade</Label>
                  <Select value={formAdd.grade} onValueChange={v => setFormAdd({...formAdd, grade: v})}>
                    <SelectTrigger className={unifiedInputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-md">
                      {GRADE_OPTIONS.map(g => <SelectItem key={g.value} value={g.value} className={unifiedHoverClass}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Département (Structure)</Label>
                  <Popover open={addDeptOpen} onOpenChange={setAddDeptOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(unifiedInputClass, "text-slate-900 hover:bg-slate-100 hover:text-slate-900","data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200")}>
                        <span className="truncate">{formAdd.department || "Sélectionner..."}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[230px] p-0 bg-white border border-slate-200 shadow-md">
                      <Command shouldFilter={false} className="bg-white rounded-md">
                        <CommandInput placeholder="Rechercher..." value={addDeptQuery} onValueChange={setAddDeptQuery} className="border-none focus:ring-0" />
                        <CommandList>
                          <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                          <CommandGroup>
                            {structures.map(s => (
                              <CommandItem key={s.id} onSelect={() => { setFormAdd({ ...formAdd, department: s.nom, structureId: s.id, direction: s.nom }); setAddDeptOpen(false); setAddDeptQuery(""); }} className={unifiedHoverClass}>{s.nom} ({s.codeAnalytique})</CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              <div className="space-y-1.5">
                    <Label className="text-slate-700">Badge</Label>
                    <Input
                      placeholder="Ex: B-001"
                      value={formAdd.badge ?? ''}
                      onChange={e => handleAddFieldChange("badge", e.target.value)}
                      className={cn(
                        unifiedInputClass,
                        addErrors.badge && "border-red-400 focus-visible:ring-red-500"
                      )}
                    />
                    {addErrors.badge && (
                      <p className="text-xs text-red-500 font-medium">
                        <AlertCircle size={12} className="inline mr-1" />
                        {addErrors.badge}
                      </p>
                    )}
                  </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Date d'embauche</Label>
                  <Input type="date" value={formAdd.hireDate || ''} onChange={e => setFormAdd({...formAdd, hireDate: e.target.value})} className={dateInputClass} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-slate-700">Manager</Label>
                  <Popover open={managerAddOpen} onOpenChange={setManagerAddOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(unifiedInputClass,"text-slate-900 hover:bg-slate-100 hover:text-slate-900","data-[state=open]:bg-emerald-50 data-[state=open]:text-emerald-700 data-[state=open]:border-emerald-200")}>
                        <span className="truncate">{formAdd.manager === "__none__" ? "Aucun" : (formAdd.manager || "Sélectionner...")}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[230px] p-0 bg-white border border-slate-200 shadow-md">
                      <Command shouldFilter={false} className="bg-white rounded-md">
                        <CommandInput placeholder="Rechercher..." value={managerAddQuery} onValueChange={setManagerAddQuery} className="border-none focus:ring-0" />
                        <CommandList>
                          <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem onSelect={() => { setFormAdd({...formAdd, manager: "__none__", managerId: null}); setManagerAddOpen(false); setManagerAddQuery(""); }} className={unifiedHoverClass}>Aucun</CommandItem>
                            {filteredManagerAddOptions.map(m => (
                              <CommandItem key={m.id} onSelect={() => { setFormAdd({...formAdd, manager: m.name, managerId: Number(m.id)}); setManagerAddOpen(false); setManagerAddQuery(""); }} className={unifiedHoverClass}>{m.name}</CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button>
                <Button onClick={handleAddEmployee} disabled={!isAddFormValid || isActionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 2. Modal MODIFICATION */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg text-slate-900"><div className="p-1 rounded-lg bg-blue-100 text-blue-700"><Edit size={16} /></div>Modifier l'employé</DialogTitle>
                <DialogDescription>Les champs marqués d'un astérisque (*) sont obligatoires.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-6">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-matricule" className="text-slate-700">Matricule *</Label>
                  <Input id="edit-matricule" value={formEdit.matricule ?? ''} onChange={e => handleEditFieldChange("matricule", e.target.value)} className={cn(unifiedInputClass, editErrors.matricule && "border-red-400 focus-visible:ring-red-500")} />
                  {editErrors.matricule && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{editErrors.matricule}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-firstName" className="text-slate-700">Prénom *</Label>
                  <Input id="edit-firstName" value={formEdit.firstName ?? ''} onChange={e => handleEditFieldChange("firstName", e.target.value)} className={cn(unifiedInputClass, editErrors.firstName && "border-red-400 focus-visible:ring-red-500")} />
                  {editErrors.firstName && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{editErrors.firstName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-lastName" className="text-slate-700">Nom *</Label>
                  <Input id="edit-lastName" value={formEdit.lastName ?? ''} onChange={e => handleEditFieldChange("lastName", e.target.value)} className={cn(unifiedInputClass, editErrors.lastName && "border-red-400 focus-visible:ring-red-500")} />
                  {editErrors.lastName && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{editErrors.lastName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-email" className="text-slate-700">Email *</Label>
                  <Input id="edit-email" type="email" value={formEdit.email ?? ''} onChange={e => handleEditFieldChange("email", e.target.value)} className={cn(unifiedInputClass, editErrors.email && "border-red-400 focus-visible:ring-red-500")} />
                  {editErrors.email && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{editErrors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="text-slate-700">Téléphone</Label>
                  <Input id="edit-phone" value={formEdit.phone ?? ''} onChange={e => handleEditFieldChange("phone", e.target.value)} className={cn(unifiedInputClass, editErrors.phone && "border-red-400 focus-visible:ring-red-500")} />
                  {editErrors.phone && <p className="text-xs text-red-500 font-medium"><AlertCircle size={12} className="inline mr-1" />{editErrors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Grade</Label>
                  <Select value={formEdit.grade} onValueChange={v => setFormEdit({...formEdit, grade: v})}>
                    <SelectTrigger className={unifiedInputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-md">
                      {GRADE_OPTIONS.map(g => <SelectItem key={g.value} value={g.value} className={unifiedHoverClass}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Département</Label>
                  <Popover open={editDeptOpen} onOpenChange={setEditDeptOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(unifiedInputClass, "text-slate-900 hover:bg-slate-100 hover:text-slate-900")}>
                        <span className="truncate">{formEdit.department || "Sélectionner..."}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[230px] p-0 bg-white border border-slate-200 shadow-md">
                      <Command shouldFilter={false} className="bg-white rounded-md">
                        <CommandInput placeholder="Rechercher..." value={editDeptQuery} onValueChange={setEditDeptQuery} className="border-none focus:ring-0" />
                        <CommandList>
                          <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                          <CommandGroup>
                            {structures.map(s => (
                              <CommandItem key={s.id} onSelect={() => { setFormEdit({ ...formEdit, department: s.nom, structureId: s.id, direction: s.nom }); setEditDeptOpen(false); setEditDeptQuery(""); }} className={unifiedHoverClass}>{s.nom} ({s.codeAnalytique})</CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-slate-700">Badge</Label>
                    <Input
                      value={formEdit.badge ?? ''}
                      onChange={e => handleEditFieldChange("badge", e.target.value)}
                      className={cn(
                        unifiedInputClass,
                        editErrors.badge && "border-red-400 focus-visible:ring-red-500"
                      )}
                    />
                    {editErrors.badge && (
                      <p className="text-xs text-red-500 font-medium">
                        <AlertCircle size={12} className="inline mr-1" />
                        {editErrors.badge}
                      </p>
                    )}
                  </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Date d'embauche</Label>
                  <Input type="date" value={formEdit.hireDate || ''} onChange={e => setFormEdit({...formEdit, hireDate: e.target.value})} className={dateInputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Statut</Label>
                  <Select value={formEdit.status} onValueChange={(v) => setFormEdit({...formEdit, status: v as EmployeeStatus})}>
                    <SelectTrigger className={unifiedInputClass}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 shadow-md">
                      <SelectItem value="active" className={unifiedHoverClass}>Actif</SelectItem>
                      <SelectItem value="inactive" className={unifiedHoverClass}>Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-slate-700">Manager</Label>
                  <Popover open={managerEditOpen} onOpenChange={setManagerEditOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn(unifiedInputClass, "text-slate-900 hover:bg-slate-100 hover:text-slate-900")}>
                        <span className="truncate">{formEdit.manager === "__none__" ? "Aucun" : (formEdit.manager || "Sélectionner...")}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[230px] p-0 bg-white border border-slate-200 shadow-md">
                      <Command shouldFilter={false} className="bg-white rounded-md">
                        <CommandInput placeholder="Rechercher..." value={managerEditQuery} onValueChange={setManagerEditQuery} className="border-none focus:ring-0" />
                        <CommandList>
                          <CommandEmpty className="py-3 text-center text-sm text-slate-500">Aucun résultat.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem onSelect={() => { setFormEdit({...formEdit, manager: "__none__", managerId: null}); setManagerEditOpen(false); setManagerEditQuery(""); }} className={unifiedHoverClass}>Aucun</CommandItem>
                            {filteredManagerEditOptions.map(m => (
                              <CommandItem key={m.id} onSelect={() => { setFormEdit({...formEdit, manager: m.name, managerId: Number(m.id)}); setManagerEditOpen(false); setManagerEditQuery(""); }} className={unifiedHoverClass}>{m.name}</CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button>
                <Button onClick={handleEditEmployee} disabled={!isEditFormValid || isActionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 3. Modal SUPPRESSION UNITAIRE */}
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader><DialogTitle className="text-red-600">Supprimer l'employé</DialogTitle><DialogDescription>Êtes-vous sûr de vouloir supprimer {employeeToDelete?.firstName} {employeeToDelete?.lastName} ({employeeToDelete?.matricule}) ?</DialogDescription></DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button>
                <Button variant="destructive" onClick={handleDeleteEmployee} disabled={isActionLoading}>Supprimer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 4. Modal SUPPRESSION MULTIPLE */}
          <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
            <DialogContent className="sm:max-w-md bg-white">
              <DialogHeader><DialogTitle className="text-red-600">Supprimer les employés</DialogTitle><DialogDescription>Êtes-vous sûr de vouloir supprimer {selectedEmployees.length} employé(s) ?</DialogDescription></DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-100">Annuler</Button>
                <Button variant="destructive" onClick={handleBulkDelete} disabled={isActionLoading}>Supprimer tout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* 5. Modal IMPORT */}
          <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
            <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-slate-900"><Upload size={18} />Importer des employés</DialogTitle>
                <DialogDescription>
                  Téléchargez un fichier <strong>CSV, XLSX ou XLS</strong> respectant le format décrit ci-dessous.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm space-y-3">
                  <p className="font-medium text-blue-900 flex items-center gap-1"><Info className="h-4 w-4" />Format attendu (CSV / Excel avec en-tête) :</p>
                  <code className="text-xs bg-blue-100 px-2 py-1 rounded">prenom,nom,email,matricule,telephone,grade,departement, direction,manager,badge,statut,date_embauche</code>
                  <div className="space-y-2 mt-4">
                    <p className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Description des colonnes :</p>
                    <ul className="space-y-1.5 text-xs list-disc pl-4 text-slate-600">
                      <li><strong>prenom</strong> : Prénom (obligatoire)</li>
                      <li><strong>nom</strong> : Nom (obligatoire)</li>
                      <li><strong>email</strong> : Adresse email professionnelle (obligatoire)</li>
                      <li><strong>matricule</strong> : Identifiant matricule (obligatoire, unique)</li>
                      <li><strong>telephone</strong> : Numéro de téléphone (optionnel)</li>
                      <li><strong>grade</strong> : Grade selon la nomenclature</li>
                      <li><strong>departement</strong> : Département de rattachement</li>
                      <li><strong>direction</strong> : Direction</li>
                      <li><strong>manager</strong> : Nom complet du manager (optionnel)</li>
                      <li><strong>badge</strong> : Numéro de badge (optionnel)</li>
                      <li><strong>statut</strong> : active / inactive</li>
                      <li><strong>date_embauche</strong> : Date d'embauche (JJ/MM/AAAA)</li>
                    </ul>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" size="sm" onClick={downloadImportTemplate} className="text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200"><Download className="h-4 w-4 mr-1.5" /> Télécharger le modèle</Button>
                  <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleImportFile} className="hidden" />
                  <Button size="sm" onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-900 text-white shadow-sm"><Upload className="h-4 w-4 mr-1.5" /> Choisir un fichier</Button>
                </div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setShowImportModal(false)} className="text-slate-700 hover:text-slate-900 hover:bg-slate-50">Annuler</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ============================================================================
              FICHE DE DETAIL (PANNEAU LATÉRAL SUR-MESURE)
              ============================================================================ */}
          {showDetailSheet && detailEmployee && (
            <div className="fixed inset-0 z-[100] flex font-sans">
              {/* Overlay arrière-plan flou */}
              <div 
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" 
                onClick={() => setShowDetailSheet(false)} 
              />
              
              {/* Panneau coulissant */}
              <div
                className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-50 shadow-2xl flex flex-col border-l border-slate-200/50"
                style={{ animation: "slideIn .3s cubic-bezier(.4,0,.2,1) forwards" }}
              >
                <style>{`
                  @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; box-shadow: none; }
                    to   { transform: translateX(0);    opacity: 1; }
                  }
                `}</style>

                {/* Header du détail */}
                <div className="flex items-start gap-4 px-6 pt-8 pb-6 border-b border-slate-200 bg-white shrink-0 relative z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold shrink-0 ring-4 ring-emerald-50">
                    {detailEmployee.firstName[0]}{detailEmployee.lastName[0]}
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-lg font-bold text-slate-900 truncate leading-snug tracking-tight">{detailEmployee.firstName} {detailEmployee.lastName}</p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">{gradeLabelMap[detailEmployee.grade] || detailEmployee.grade || "Aucun grade"}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <code className="text-xs font-mono font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                        {detailEmployee.matricule}
                      </code>
                      <span className={cn("text-xs font-semibold ring-1 rounded-full px-2.5 py-0.5 shadow-sm", detailEmployee.status === 'active' ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200")}>
                        {statusConfig[detailEmployee.status].label}
                      </span>
                      {detailEmployee.department && (
                        <span className="text-[11px] font-medium text-slate-600 bg-white shadow-sm px-2.5 py-[3px] rounded-full border border-slate-200">
                          {detailEmployee.department}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button onClick={() => setShowDetailSheet(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0 -mt-2 -mr-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Corps du détail (Scrollable) */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 [&::-webkit-scrollbar]:hidden scrollbar-none bg-slate-50 relative z-0">
                  
                  {/* Métadonnées en cartes */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white border border-slate-200/60 shadow-sm px-4 py-3 hover:border-emerald-200 transition-colors">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Date d'embauche</p>
                      <p className="text-sm font-bold text-slate-800">{detailEmployee.hireDate || "Non renseigné"}</p>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-200/60 shadow-sm px-4 py-3 hover:border-emerald-200 transition-colors">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Badge</p>
                      <p className="text-sm font-bold text-slate-800 font-mono">{detailEmployee.badge || "Aucun"}</p>
                    </div>
                  </div>

                  {/* Professionnel */}
                  <section>
                    <header className="mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Infos Professionnelles</p>
                    </header>
                    <div className="rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                      <DetailRowTemplate label="Direction" value={detailEmployee.direction} icon={<Briefcase className="w-4 h-4" />} />
                      <DetailRowTemplate label="Département" value={detailEmployee.department} icon={<Building2 className="w-4 h-4" />} />
                      <DetailRowTemplate label="Manager" value={detailEmployee.manager} icon={<User className="w-4 h-4" />} />
                    </div>
                  </section>

                  {/* Contact */}
                  <section>
                    <header className="mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Coordonnées</p>
                    </header>
                    <div className="rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                      <DetailRowTemplate label="Email" value={detailEmployee.email} icon={<Mail className="w-4 h-4" />} />
                      <DetailRowTemplate label="Téléphone" value={detailEmployee.phone} icon={<Phone className="w-4 h-4" />} />
                    </div>
                  </section>
                </div>

                {/* Footer des actions */}
                <div className="border-t border-slate-200 px-6 py-4 flex gap-3 shrink-0 bg-white z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)]">
                  <button
                    onClick={() => { setShowDetailSheet(false); openEditDialog(detailEmployee); }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={() => { setShowDetailSheet(false); openDeleteDialog(detailEmployee); }}
                    className="flex-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 text-slate-700 hover:text-red-700 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" /> Supprimer
                  </button>
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
// COMPOSANTS UI UTILITAIRES
// ============================================================================

function DetailRowTemplate({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/80 transition-colors">
      <span className="text-sm text-slate-500 font-medium flex items-center gap-2.5">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </span>
      <span className="text-sm text-slate-900 font-semibold text-right">{value || "—"}</span>
    </div>
  );
}

function StatsCard({ title, value, icon, onClick }: { title: string; value: number; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <Card 
      className={cn(
        "shadow-sm border-0 bg-white/80 backdrop-blur hover:shadow-md transition-shadow",
        onClick && "cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
      </CardContent>
    </Card>
  );
}