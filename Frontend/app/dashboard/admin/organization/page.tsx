"use client";

import { useState, useMemo, useRef, useEffect, memo, useCallback } from "react";
import {
  Building2, Users, ChevronDown, ChevronRight, Plus, Edit, Trash2, MapPin,
  X, Layers, Network, FolderTree, Download, Upload, RefreshCw,
  AlertCircle, FileText, EyeOff, Eye, Loader2, ShieldCheck, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { structureService } from "@/services/structure.service";
import type { StructureFlatDto, EmployeFlatDto, TypeStructure, CreateStructureRequest } from "@/types/structure";

// ------------------------------------------------------------------
// Types locaux pour l'affichage
// ------------------------------------------------------------------
interface Employee {
  id: string;
  name: string;        // prénom + nom
  position: string;    // grade (enum)
  email: string;
  phone?: string;
}

interface OrganizationUnit {
  id: string;                  // id backend en string
  name: string;                // nom de la structure
  type: TypeStructure;
  code: string;                // codeAnalytique
  location?: string;           // site
  children?: OrganizationUnit[];
  employees?: Employee[];
}

// Pour la vue filtrée par type (liste plate)
interface FlatUnit extends OrganizationUnit {
  fullPath: string;
}

// ------------------------------------------------------------------
// Configuration visuelle des types
// ------------------------------------------------------------------
const typeConfig: Record<TypeStructure, {
  label: string;
  bgColor: string;
  textColor: string;
  bgLight: string;
  borderLight: string;
  icon: React.ElementType;
}> = {
  DIRECTION:   { label: "Direction",   bgColor: "bg-red-600",    textColor: "text-red-700",    bgLight: "bg-red-50",    borderLight: "border-red-200",    icon: Building2 },
  DEPARTEMENT: { label: "Département", bgColor: "bg-emerald-600",  textColor: "text-emerald-700",  bgLight: "bg-emerald-50",  borderLight: "border-emerald-200",  icon: Layers },
  DIVISION:    { label: "Division",    bgColor: "bg-blue-600",   textColor: "text-blue-700",   bgLight: "bg-blue-50",   borderLight: "border-blue-200",   icon: Network },
  UGP:         { label: "UGP",         bgColor: "bg-amber-600",  textColor: "text-amber-700",  bgLight: "bg-amber-50",  borderLight: "border-amber-200",  icon: FolderTree },
  AGENCE:      { label: "Agence",      bgColor: "bg-purple-600", textColor: "text-purple-700", bgLight: "bg-purple-50", borderLight: "border-purple-200", icon: MapPin },
};

// ------------------------------------------------------------------
// Petits composants réutilisables (Styles modernisés avec bordures nettes)
// ------------------------------------------------------------------
const FieldWrap = ({ children, error }: { children: React.ReactNode; error?: string }) => (
  <div className="space-y-1">
    {children}
    {error && <p className="text-xs text-red-500 flex items-center gap-1 animate-in fade-in"><AlertCircle className="h-3 w-3" />{error}</p>}
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-1">{children}</label>
);

const Input = ({
  icon: Icon,
  placeholder,
  value,
  error,
  onChange,
  className = "",
}: {
  icon: React.ElementType;
  placeholder: string;
  value: string;
  error?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) => (
  <div className="relative shadow-sm rounded-xl">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={cn(
        "w-full pl-10 pr-3 py-2.5 rounded-xl border bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-400 transition-all",
        error ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-300",
        className
      )}
    />
  </div>
);

const SelectInput = ({
  icon: Icon,
  value,
  onChange,
  children,
}: {
  icon: React.ElementType;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) => (
  <div className="relative shadow-sm rounded-xl">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    <select
      value={value}
      onChange={onChange}
      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 hover:border-gray-400 appearance-none transition-all"
    >
      {children}
    </select>
  </div>
);

// Sélecteur de parent avec recherche
const SearchableParentSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (parentId: string) => void;
  options: { code: string; path: string }[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedOption = options.find((opt) => opt.code === value);

  const filteredOptions = useMemo(
    () => options.filter((opt) => opt.path.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Network className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <div
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white shadow-sm cursor-pointer flex items-center justify-between transition-all hover:border-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          onClick={() => {
            setIsOpen(!isOpen);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <span className={value === "" ? "text-gray-500 font-medium" : "text-gray-900 font-medium"}>
            {value === "" ? "Aucune — niveau racine" : selectedOption?.path || "Aucune — niveau racine"}
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform text-gray-400 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <input
              ref={inputRef}
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-gray-600 font-medium" onClick={() => handleSelect("")}>
              Aucune — niveau racine
            </div>
            {filteredOptions.map((opt) => (
              <div
                key={opt.code}
                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm font-medium text-gray-700"
                onClick={() => handleSelect(opt.code)}
              >
                {opt.path}
              </div>
            ))}
            {filteredOptions.length === 0 && searchTerm && (
              <div className="px-4 py-2 text-sm text-gray-400">Aucune unité trouvée</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Arbre organisationnel – Indentation forte et liseré vertical
// ------------------------------------------------------------------

// Largeur de l'indentation visuelle par niveau (en px)
const INDENT_LEVEL_WIDTH = 28; // Standard pour un aspect propre

const OrganizationTree = ({
  units,
  showEmployees,
  selectedIds,
  onSelectUnit,
  onViewDetail,
  onEdit,
  onDelete,
}: {
  units: OrganizationUnit[];
  showEmployees: boolean;
  selectedIds: Set<string>;
  onSelectUnit: (id: string, checked: boolean) => void;
  onViewDetail: (unit: OrganizationUnit) => void;
  onEdit: (unit: OrganizationUnit) => void;
  onDelete: (unit: OrganizationUnit) => void;
}) => {
  const allIds = useMemo(() => {
    const collect = (items: OrganizationUnit[]): string[] => {
      let res: string[] = [];
      for (const u of items) {
        res.push(u.id);
        if (u.children) res = res.concat(collect(u.children));
      }
      return res;
    };
    return collect(units);
  }, [units]);

  const [expanded, setExpanded] = useState<string[]>(allIds);

  useEffect(() => {
    setExpanded(allIds);
  }, [allIds]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  if (units.length === 0) {
    return <div className="text-center text-gray-500 py-8 font-medium">Aucune structure à afficher.</div>;
  }

  return (
    <div className="space-y-0.5 pt-2">
      {units.map((unit, index, array) => (
        <TreeNode
          key={unit.id}
          unit={unit}
          level={0}
          expanded={expanded}
          toggleExpand={toggleExpand}
          showEmployees={showEmployees}
          selectedIds={selectedIds}
          onSelectUnit={onSelectUnit}
          onViewDetail={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
          isLastSibling={index === array.length - 1}
        />
      ))}
    </div>
  );
};

const TreeNode = ({
  unit, level, expanded, toggleExpand, showEmployees, selectedIds, onSelectUnit, onViewDetail, onEdit, onDelete, isLastSibling,
}: {
  unit: OrganizationUnit; level: number; expanded: string[]; toggleExpand: (id: string) => void;
  showEmployees: boolean; selectedIds: Set<string>; onSelectUnit: (id: string, checked: boolean) => void;
  onViewDetail: (unit: OrganizationUnit) => void; onEdit: (unit: OrganizationUnit) => void;
  onDelete: (unit: OrganizationUnit) => void; isLastSibling: boolean;
}) => {
  const Icon = typeConfig[unit.type].icon;
  const isExpanded = expanded.includes(unit.id);
  const hasChildren = unit.children && unit.children.length > 0;
  const style = typeConfig[unit.type];
  const hasEmployees = unit.employees && unit.employees.length > 0;
  const isSelected = selectedIds.has(unit.id);
  const employeeCount = unit.employees?.length ?? 0;

  const getAllDescendantIds = useCallback((u: OrganizationUnit): string[] => {
    let ids = [u.id];
    if (u.children) for (const c of u.children) ids = ids.concat(getAllDescendantIds(c));
    return ids;
  }, []);

  const handleCheckboxChange = useCallback((checked: boolean) => {
    const ids = getAllDescendantIds(unit);
    ids.forEach((id) => onSelectUnit(id, checked));
  }, [unit, getAllDescendantIds, onSelectUnit]);

  const currentLevelPaddingLeft = level * INDENT_LEVEL_WIDTH;
  const lineVisualOffset = currentLevelPaddingLeft - (INDENT_LEVEL_WIDTH / 2) - 1;

  return (
    <div className="relative">
      {level > 0 && (
        <div
          className={cn("absolute bg-gray-300 w-px", isLastSibling ? "top-0 h-[22px]" : "top-0 bottom-0")}
          style={{ left: `${lineVisualOffset}px` }}
        />
      )}

      <div
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-xl transition-all group hover:bg-slate-50 relative z-10",
          isSelected && "bg-emerald-50/10 border border-emerald-100",
        )}
        style={{ marginLeft: `${currentLevelPaddingLeft}px` }}
      >
        {level > 0 && (
          <div
            className="absolute bg-gray-300 z-0 h-px"
            style={{
              left: `${lineVisualOffset}px`,
              top: '50%',
              width: `${INDENT_LEVEL_WIDTH / 2 + 1}px`,
              transform: 'translateY(-50%)',
            }}
          />
        )}

        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer flex-shrink-0 z-10"
        />

        <div className="w-6 flex items-center justify-center flex-shrink-0 z-10">
          {hasChildren ? (
            <button onClick={() => toggleExpand(unit.id)} className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
          )}
        </div>

        <div className={cn("p-1.5 rounded-lg text-white flex-shrink-0 z-10 shadow-sm", style.bgColor)}>
          <Icon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0 cursor-pointer z-10" onClick={() => onViewDetail(unit)}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 truncate text-sm">{unit.name}</span>
            <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-bold border tracking-wide uppercase shadow-sm", style.bgLight, style.textColor, style.borderLight)}>
              {unit.code} - {style.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium mt-0.5">
            <span className="flex items-center gap-1 font-mono">{unit.code}</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{employeeCount} agents</span>
            {unit.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{unit.location}</span>}
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pr-2 flex-shrink-0 z-10">
          <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" onClick={(e) => { e.stopPropagation(); onEdit(unit); }}>
            <Edit className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(unit); }}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showEmployees && hasEmployees && isExpanded && (
        <div className="mt-1 mb-2 space-y-1" style={{ marginLeft: `${currentLevelPaddingLeft + INDENT_LEVEL_WIDTH + 14}px` }}>
          {unit.employees!.map((emp) => (
            <div key={emp.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg bg-gray-50 border border-gray-200 shadow-sm w-full max-w-lg">
              <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold border border-emerald-200 shadow-sm">
                {emp.name.charAt(0)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-bold text-gray-800 truncate">{emp.name}</span>
                <span className="text-[10px] text-gray-500 truncate">{emp.position}{emp.email ? ` • ${emp.email}` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className="relative">
          {unit.children!.map((child, index, array) => (
            <TreeNode
              key={child.id}
              unit={child}
              level={level + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
              showEmployees={showEmployees}
              selectedIds={selectedIds}
              onSelectUnit={onSelectUnit}
              onViewDetail={onViewDetail}
              onEdit={onEdit}
              onDelete={onDelete}
              isLastSibling={index === array.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------------------
// Formulaire modal (mémorisé et stylisé)
// ------------------------------------------------------------------
const FormModal = memo(
  ({
    title, isOpen, onClose, onSubmit, submitLabel, formData, setFormData, allCodes, unitToEdit, parentOptions,
  }: {
    title: string; isOpen: boolean; onClose: () => void; onSubmit: () => void; submitLabel: string;
    formData: { name: string; type: TypeStructure; code: string; location: string; parentId: string };
    setFormData: React.Dispatch<React.SetStateAction<{ name: string; type: TypeStructure; code: string; location: string; parentId: string }>>;
    allCodes: string[]; unitToEdit: OrganizationUnit | null; parentOptions: { code: string; path: string }[];
  }) => {
    if (!isOpen) return null;

    const nameErr = formData.name !== "" && formData.name.trim().length < 2;
    // Permet un seul caractère pour le code analytique (ex: "A")
    const codeEmpty = formData.code.trim().length === 0;
    const codeDup = formData.code !== "" && !codeEmpty && allCodes.filter((c) => c.toLowerCase() === formData.code.toLowerCase()).length > (unitToEdit ? 1 : 0);
    const isValidLocal = formData.name.trim() !== "" && !codeEmpty && !nameErr && !codeDup;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-2xl">
            <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-all">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            <FieldWrap error={nameErr ? "Minimum 2 caractères" : undefined}>
              <FieldLabel>Nom *</FieldLabel>
              <Input
                icon={Building2}
                placeholder="Ex : Direction Marketing"
                value={formData.name}
                error={nameErr}
                onChange={(e: any) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </FieldWrap>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrap>
                <FieldLabel>Type *</FieldLabel>
                <SelectInput
                  icon={Layers}
                  value={formData.type}
                  onChange={(e: any) => setFormData((p) => ({ ...p, type: e.target.value as TypeStructure }))}
                >
                  {Object.entries(typeConfig).map(([k, c]) => (
                    <option key={k} value={k}>
                      {c.label}
                    </option>
                  ))}
                </SelectInput>
              </FieldWrap>
              <FieldWrap error={codeEmpty ? "Requis" : codeDup ? "Déjà utilisé" : undefined}>
                <FieldLabel>Code *</FieldLabel>
                <Input
                  icon={FolderTree}
                  placeholder="Ex : A"
                  value={formData.code}
                  error={codeEmpty || codeDup}
                  // Plus de uppercase forcé, accepte les minuscules et 1 caractère
                  onChange={(e: any) => setFormData((p) => ({ ...p, code: e.target.value }))}
                />
              </FieldWrap>
            </div>
            <FieldWrap>
              <FieldLabel>Unité parente (optionnel)</FieldLabel>
              <SearchableParentSelect
                value={formData.parentId}
                onChange={(parentId: string) => setFormData((p) => ({ ...p, parentId }))}
                options={parentOptions}
              />
            </FieldWrap>
            <FieldWrap>
              <FieldLabel>Site / Localisation</FieldLabel>
              <Input
                icon={MapPin}
                placeholder="Ville ou adresse"
                value={formData.location}
                onChange={(e: any) => setFormData((p) => ({ ...p, location: e.target.value }))}
              />
            </FieldWrap>
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-100 shadow-sm transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onSubmit}
              disabled={!isValidLocal}
              className={cn(
                "px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2 shadow-sm hover:bg-emerald-700 transition-all",
                !isValidLocal && "opacity-50 cursor-not-allowed"
              )}
            >
              {submitLabel === "Créer" ? <Plus className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }
);
FormModal.displayName = "FormModal";

// ------------------------------------------------------------------
// Génération du PDF professionnel Exactement comme demandé
// ------------------------------------------------------------------
const generateProfessionalPDF = async (units: OrganizationUnit[]) => {
  const flattenUnits = (items: OrganizationUnit[], parentCode = "", prefix = ""): any[] => {
    let flat: any[] = [];
    for (const unit of items) {
      const currentPath = prefix ? `${prefix} > ${unit.name} (${unit.code})` : `${unit.name} (${unit.code})`;
      flat.push({
        Nom: unit.name,
        Type: typeConfig[unit.type].label,
        Code: unit.code,
        "Code Parent": parentCode,
        Localisation: unit.location || "",
        Effectif: unit.employees?.length ?? 0,
        Chemin: currentPath,
      });
      if (unit.children) flat = flat.concat(flattenUnits(unit.children, unit.code, currentPath));
    }
    return flat;
  };

  const data = flattenUnits(units);
  if (data.length === 0) throw new Error("Aucune donnée à exporter");

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const logoUrl = "/images/alomrane-logo.png";

  // Chargement du logo
  let logoDataUrl = "";
  try {
    const img = new Image();
    img.src = logoUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0);
    logoDataUrl = canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("Logo non trouvé, export sans logo");
  }

  // Fonction d'en-tête/pied de page
  const addHeaderFooter = (currentPage: number, totalPages: number) => {
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, "PNG", margin, 1, 45, 35);
    }
    doc.setFontSize(18);
    doc.setTextColor(27, 94, 32);
    doc.setFont("helvetica", "bold");
    doc.text("AL OMRANE - SOUSS MASSA", logoDataUrl ? margin + 40 : margin, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Structure Organisationnelle", logoDataUrl ? margin + 40 : margin, 25);
    doc.setFontSize(8);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}`, margin, 32);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 35, pageWidth - margin, 35);

    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Document confidentiel - Page ${currentPage} / ${totalPages}`, margin, footerY);
    doc.text("Al Omrane - Tous droits réservés", pageWidth - margin - 40, footerY, { align: "right" });
  };

  const headers = Object.keys(data[0]);
  const rows: (string | number)[][] = data.map(row => Object.values(row) as (string | number)[]);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 40,
    margin: { top: 40, left: margin, right: margin, bottom: 20 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: "middle",
      halign: "left",
      textColor: [50, 50, 50],
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [27, 94, 32],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: (data) => {
      addHeaderFooter(data.pageNumber, doc.getNumberOfPages());
    },
  });

  doc.save(`organisation_${new Date().toISOString().split("T")[0]}.pdf`);
};

// ------------------------------------------------------------------
// Page principale OrganizationPage
// ------------------------------------------------------------------
export default function OrganizationPage() {
  const [units, setUnits] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUnit, setSelectedUnit] = useState<OrganizationUnit | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unitToEdit, setUnitToEdit] = useState<OrganizationUnit | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<OrganizationUnit | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [filterType, setFilterType] = useState<TypeStructure | "all">("all");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showEmployees, setShowEmployees] = useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "", type: "DIRECTION" as TypeStructure, code: "", location: "", parentId: "",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [structures, employes] = await Promise.all([
        structureService.getAllFlat(),
        structureService.getAllEmployesFlat(),
      ]);

      const map = new Map<number, OrganizationUnit>();
      structures.forEach((s) => {
        map.set(s.id, { id: String(s.id), name: s.nom, type: s.type, code: s.codeAnalytique, location: s.site, children: [], employees: [] });
      });

      employes.forEach((e) => {
        if (e.structureId && map.has(e.structureId)) {
          const unit = map.get(e.structureId)!;
          if (!unit.employees) unit.employees = []; // Initialise si null
          unit.employees.push({
            id: String(e.id),
            name: `${e.prenom} ${e.nom}`,
            position: e.grade,
            email: e.emailProfessionnel,
            phone: e.telephone,
          });
        }
      });

      const roots: OrganizationUnit[] = [];
      structures.forEach((s) => {
        const unit = map.get(s.id)!;
        if (s.parentId && map.has(s.parentId)) {
          const parent = map.get(s.parentId)!;
          if (!parent.children) parent.children = []; // Initialise si null
          parent.children.push(unit);
        } else {
          roots.push(unit);
        }
      });

      setUnits(roots);
    } catch (e: any) {
      setError(e.message || "Erreur de chargement des données.");
      toast.error("Impossible de charger l'organisation.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(); // Lance le chargement au montage du composant
  }, [loadData]);

  const allCodes = useMemo(() => {
    const collect = (items: OrganizationUnit[]): string[] =>
      items.flatMap((u) => [u.code, ...(u.children ? collect(u.children) : [])]);
    return collect(units);
  }, [units]);

  const parentOptions = useMemo(() => {
    const flatten = (items: OrganizationUnit[], prefix = ""): { code: string; path: string }[] => {
      let res: { code: string; path: string }[] = [];
      for (const u of items) {
        const currentPath = prefix ? `${prefix} > ${u.name} (${u.code})` : `${u.name} (${u.code})`;
        res.push({ code: String(u.id), path: currentPath }); 
        if (u.children) res = res.concat(flatten(u.children, currentPath));
      }
      return res;
    };
    let options = flatten(units);
    if (unitToEdit) options = options.filter((o) => o.code !== String(unitToEdit.id));
    return options;
  }, [units, unitToEdit]);

  const addUnit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Le nom et le code sont obligatoires.");
      return;
    }
    setIsActionLoading(true);
    try {
      await structureService.create({
        nom: formData.name.trim(),
        codeAnalytique: formData.code.trim(), // Envoi le code trimmé propre
        type: formData.type,
        site: formData.location || undefined,
        parentId: formData.parentId ? Number(formData.parentId) : null,
      });
      toast.success("Unité créée avec succès !");
      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Erreur lors de la création de l'unité.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const updateUnit = async () => {
    if (!unitToEdit) return; 
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Le nom et le code sont obligatoires.");
      return;
    }
    setIsActionLoading(true);
    try {
      await structureService.update(Number(unitToEdit.id), {
        nom: formData.name.trim(),
        codeAnalytique: formData.code.trim(), // Envoi le code trimmé propre
        type: formData.type,
        site: formData.location || undefined,
        parentId: formData.parentId ? Number(formData.parentId) : null,
      });
      toast.success("Unité modifiée avec succès !");
      setShowEditModal(false);
      setUnitToEdit(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Erreur lors de la modification de l'unité.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteUnit = async (id: string) => {
    setIsActionLoading(true);
    try {
      await structureService.delete(Number(id));
      toast.success("Unité supprimée avec succès.");
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la suppression de l'unité.");
    } finally {
      setIsActionLoading(false);
      setSelectedUnitIds(prev => { 
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedUnitIds.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    setIsActionLoading(true);
    try {
      // Pour éviter les erreurs Hibernate "Row was updated or deleted by another transaction", 
      // il faut supprimer les enfants avant les parents.
      // On récupère toutes les unités plates pour analyser la profondeur.
      const flattenUnits = (items: OrganizationUnit[], depth = 0): { id: string; depth: number }[] => {
          let flat: { id: string; depth: number }[] = [];
          for (const unit of items) {
              flat.push({ id: unit.id, depth });
              if (unit.children) flat = flat.concat(flattenUnits(unit.children, depth + 1));
          }
          return flat;
      };
      
      const allFlatUnits = flattenUnits(units);
      
      // On trie les IDs sélectionnés par profondeur décroissante (enfants en premier)
      const sortedIdsToDelete = Array.from(selectedUnitIds).sort((a, b) => {
          const depthA = allFlatUnits.find(u => u.id === a)?.depth || 0;
          const depthB = allFlatUnits.find(u => u.id === b)?.depth || 0;
          return depthB - depthA;
      });

      // Suppression séquentielle propre
      for(const id of sortedIdsToDelete) {
         try {
           await structureService.delete(Number(id));
         } catch (e) {
           // Si l'élément a déjà été supprimé en cascade par la suppression d'un parent, on ignore l'erreur
           console.warn(`Unité ${id} déjà supprimée ou erreur mineure`);
         }
      }
      
      toast.success(`${selectedUnitIds.size} unité(s) supprimée(s) avec succès !`);
      setSelectedUnitIds(new Set());
      setShowBulkDeleteModal(false);
      await loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Échec de la suppression groupée. Veuillez réessayer.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const getParentIdByChildId = (childId: string, currentUnits: OrganizationUnit[]): string | null => {
    for (const unit of currentUnits) {
      if (unit.children && unit.children.some(child => child.id === childId)) {
        return unit.id;
      }
      if (unit.children) {
        const found = getParentIdByChildId(childId, unit.children);
        if (found) return found;
      }
    }
    return null;
  };

  const openAddModal = () => {
    setFormData({ name: "", type: "DIRECTION", code: "", location: "", parentId: "" });
    setShowAddModal(true);
  };

  const openEditModal = (unit: OrganizationUnit) => {
    setUnitToEdit(unit);
    setFormData({
      name: unit.name,
      type: unit.type,
      code: unit.code,
      location: unit.location || "",
      parentId: getParentIdByChildId(unit.id, units) || "", 
    });
    setShowEditModal(true);
  };

  const handleSelectUnit = useCallback((id: string, checked: boolean) => {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const totalEmployees = useMemo(() => {
    const count = (items: OrganizationUnit[]): number =>
      items.reduce((acc, u) => {
        const local = u.employees?.length ?? 0;
        const children = u.children ? count(u.children) : 0;
        return acc + local + children;
      }, 0);
    return count(units);
  }, [units]);

  const getFilteredView = () => {
    if (filterType === "all") {
      return (
        <OrganizationTree
          units={units}
          showEmployees={showEmployees}
          selectedIds={selectedUnitIds}
          onSelectUnit={handleSelectUnit}
          onViewDetail={setSelectedUnit}
          onEdit={openEditModal}
          onDelete={setUnitToDelete}
        />
      );
    } else {
      const flatten = (items: OrganizationUnit[], prefix = ""): FlatUnit[] => {
        let res: FlatUnit[] = [];
        for (const u of items) {
          if (u.type === filterType) {
            res.push({ ...u, fullPath: prefix ? `${prefix} > ${u.name} (${u.code})` : `${u.name} (${u.code})`, children: undefined });
          }
          if (u.children) res = res.concat(flatten(u.children, prefix ? `${prefix} > ${u.name} (${u.code})` : `${u.name} (${u.code})`));
        }
        return res;
      };
      const list = flatten(units);
      if (!list.length) return <div className="text-center text-gray-500 py-8">Aucune unité de ce type.</div>;

      return (
        <div className="space-y-2">
          {list.map((unit) => {
            const Icon = typeConfig[unit.type].icon;
            const style = typeConfig[unit.type];
            const isSelected = selectedUnitIds.has(unit.id);
            return (
              <div key={unit.id} className="flex flex-col rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all overflow-hidden p-1">
                <div className="flex items-center gap-3 p-3">
                  <input type="checkbox" checked={isSelected} onChange={(e) => handleSelectUnit(unit.id, e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  <div className={cn("p-1.5 rounded-lg text-white", style.bgColor)}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 cursor-pointer" onClick={() => setSelectedUnit(unit)}>
                    <div className="font-medium text-gray-800">{unit.name}</div>
                    <div className="text-xs text-gray-400">Code: {unit.code} • Chemin: {unit.fullPath}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded hover:bg-blue-50 text-blue-600" onClick={(e) => { e.stopPropagation(); openEditModal(unit); }}><Edit className="h-3.5 w-3.5" /></button>
                    <button className="p-1 rounded hover:bg-red-100 text-red-600" onClick={(e) => { e.stopPropagation(); setUnitToDelete(unit); }}><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
                  </div>
                </div>
                {/* Employés dans la vue plate aussi */}
                {showEmployees && unit.employees && unit.employees.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 p-3 flex flex-wrap gap-2">
                    {unit.employees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-gray-200 shadow-sm w-fit">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">{emp.name.charAt(0)}</div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-gray-700">{emp.name}</span>
                          <span className="text-[9px] text-gray-400">{emp.position}{emp.email ? ` • ${emp.email}` : ""}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
  };

  const SegmentedButton = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
        active ? "bg-white text-slate-900 shadow-sm border border-gray-200" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 border border-transparent"
      )}
    >
      {label}
    </button>
  );

  const ActionButton = ({
    onClick, icon, label, title, destructive = false,
  }: {
    onClick: () => void; icon: React.ReactNode; label?: string; title?: string; destructive?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all active:scale-95 shadow-sm border",
        destructive
          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          : "bg-white border-gray-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
      )}
    >
      {icon}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );

  const exportCSV = () => {
    const flattenAll = (items: OrganizationUnit[], parentCode = "", prefix = ""): any[] => {
      let res: any[] = [];
      for (const unit of items) {
        const currentPath = prefix ? `${prefix} > ${unit.name} (${unit.code})` : `${unit.name} (${unit.code})`;
        res.push({
          Nom: unit.name, Type: typeConfig[unit.type].label, Code: unit.code,
          "Code Parent": parentCode, Site: unit.location || "", Effectif: unit.employees?.length ?? 0, Chemin: currentPath,
        });
        if (unit.children) res = res.concat(flattenAll(unit.children, unit.code, currentPath));
      }
      return res;
    };
    const data = flattenAll(units);
    if (!data.length) return toast.error("Aucune donnée à exporter.");
    const headers = Object.keys(data[0]);
    const rows = [headers.join(",")];
    data.forEach((row) => { rows.push(headers.map((h) => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(",")); });
    const bom = "\uFEFF";
    const blob = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "organisation.csv";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV exporté avec succès.");
  };

  const exportXLSX = () => {
    const flattenAll = (items: OrganizationUnit[], parentCode = "", prefix = ""): any[] => {
      let res: any[] = [];
      for (const unit of items) {
        const currentPath = prefix ? `${prefix} > ${unit.name} (${unit.code})` : `${unit.name} (${unit.code})`;
        res.push({
          Nom: unit.name, Type: typeConfig[unit.type].label, Code: unit.code,
          "Code Parent": parentCode, Site: unit.location || "", Effectif: unit.employees?.length ?? 0, Chemin: currentPath,
        });
        if (unit.children) res = res.concat(flattenAll(unit.children, unit.code, currentPath));
      }
      return res;
    };
    const data = flattenAll(units);
    if (!data.length) return toast.error("Aucune donnée à exporter.");
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Organisation");
    XLSX.writeFile(wb, `organisation_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel exporté avec succès.");
  };

  const exportPDF = () =>
    generateProfessionalPDF(units)
      .then(() => toast.success("PDF exporté avec succès."))
      .catch((e) => toast.error(e.message || "Erreur lors de l'export PDF."));

  // Création du modèle d'import
  const downloadImportTemplate = () => {
    const templateData = [
      { Nom: "Direction Financière", Type: "Direction", Code: "DF", "Code Parent": "", Site: "Siège Casablanca" },
      { Nom: "Département Comptabilité", Type: "Département", Code: "DF-COMPT", "Code Parent": "DF", Site: "Siège Casablanca" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modèle");
    XLSX.writeFile(wb, "Modele_Import_Organisation.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) importFromFile(file);
  };

  const importFromFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Fichier trop volumineux (>5 Mo).");
    setIsActionLoading(true);
    const toastId = toast.loading("Importation en cours...");
    try {
      let rows: any[] = [];
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      } else if (ext === "csv" || ext === "txt") {
        const text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) throw new Error("Fichier CSV vide ou mal formaté.");
        const headers = lines[0].split(",").map((h) => h.trim());
        rows = lines.slice(1).map((line) => {
          const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const obj: any = {};
          headers.forEach((h, i) => (obj[h] = vals[i] || ""));
          return obj;
        });
      } else throw new Error("Format de fichier non supporté. Utilisez .csv ou .xlsx.");

      const required = ["Nom", "Type", "Code"];
      const firstRow = rows[0] || {};
      const missing = required.filter((r) => !(r in firstRow));
      if (missing.length) throw new Error(`Colonnes obligatoires manquantes : ${missing.join(", ")}.`);

      // Récupération des données fraîches de l'API pour un mapping d'ID parfait (Tri Topologique)
      const liveStructures = await structureService.getAllFlat();
      const codeToIdMap = new Map<string, number>();
      liveStructures.forEach(s => codeToIdMap.set(s.codeAnalytique.toLowerCase(), s.id));

      const sortedRows = [];
      const visitedCodes = new Set<string>();
      codeToIdMap.forEach((_, key) => visitedCodes.add(key));

      let pending = [...rows];
      let loops = 0;
      while (pending.length > 0 && loops < 1000) {
          loops++;
          const nextPending = [];
          for (const row of pending) {
              const pCode = row["Code Parent"]?.toString().trim().toLowerCase();
              if (!pCode || visitedCodes.has(pCode)) {
                  sortedRows.push(row);
                  const myCode = row["Code"]?.toString().trim().toLowerCase();
                  if (myCode) visitedCodes.add(myCode);
              } else {
                  nextPending.push(row);
              }
          }
          if (pending.length === nextPending.length) {
              sortedRows.push(...nextPending);
              break;
          }
          pending = nextPending;
      }

      let createdCount = 0;

      for (const row of sortedRows) {
        const nom = row["Nom"]?.toString().trim();
        const typeStr = row["Type"]?.toString().trim();
        const code = row["Code"]?.toString().trim();
        
        if (!nom || !typeStr || !code) continue;
        
        if (codeToIdMap.has(code.toLowerCase())) {
          toast.error(`Code "${code}" ignoré (déjà existant).`, { id: toastId });
          continue;
        }

        const typeEntry = Object.entries(typeConfig).find(
          ([, cfg]) => cfg.label.toLowerCase() === typeStr.toLowerCase()
        );
        if (!typeEntry) {
          toast.error(`Type "${typeStr}" invalide pour "${nom}".`, { id: toastId });
          continue;
        }
        const type = typeEntry[0] as TypeStructure;

        let parentId: number | null = null;
        
        // Logique de recherche exacte par CODE PARENT
        const parentCode = row["Code Parent"]?.toString().trim();
        if (parentCode) {
          if (codeToIdMap.has(parentCode.toLowerCase())) {
             parentId = codeToIdMap.get(parentCode.toLowerCase())!;
          } else {
             toast.error(`Parent avec le code "${parentCode}" introuvable pour "${nom}". Créé à la racine.`, { id: toastId });
          }
        }

        try {
          const res = await structureService.create({
            nom,
            codeAnalytique: code,
            type,
            site: row["Site"] || row["Localisation"] || "",
            parentId,
          });
          codeToIdMap.set(code.toLowerCase(), res.id); // Met à jour la map en direct
          createdCount++;
        } catch (err: any) {
          toast.error(`Erreur pour "${nom}" : ${err.response?.data?.message || err.message}`, { id: toastId });
        }
      }

      if (createdCount > 0) {
        await loadData();
        toast.success(`${createdCount} unité(s) importée(s) avec succès !`, { id: toastId });
      } else {
        toast.error("Aucune unité importée.", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsActionLoading(false);
      setShowImportModal(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen">
      {/* En-tête de la page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Organisation</h1>
          <p className="text-muted-foreground mt-1">Structure hiérarchique connectée</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 bg-white rounded-xl hover:shadow-sm transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Rafraîchir
        </button>
      </div>

      {/* Affichage du loader ou de l'erreur */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" /> {error}
          <button onClick={loadData} className="ml-auto underline font-bold">
            Réessayer
          </button>
        </div>
      )}

      {/* Contenu principal */}
      {!loading && !error && (
        <>
          {/* Cartes KPI */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(typeConfig).map(([key, cfg]) => {
              const count = (() => {
                const countInTree = (items: OrganizationUnit[]): number =>
                  items.reduce(
                    (acc, u) =>
                      acc + (u.type === key ? 1 : 0) + (u.children ? countInTree(u.children) : 0),
                    0
                  );
                return countInTree(units);
              })();
              return (
                <div
                  key={key}
                  className={cn(
                    "cursor-pointer rounded-xl bg-white p-4 text-center transition-all hover:shadow-md border-0 shadow-sm",
                    filterType === key ? "ring-2 ring-emerald-500 shadow-md" : ""
                  )}
                  onClick={() => setFilterType(filterType === key ? "all" : (key as TypeStructure))}
                >
                  <div className={cn("inline-flex p-2 rounded-full text-white mb-2", cfg.bgColor)}>
                    <cfg.icon className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}s</p>
                </div>
              );
            })}
            <div
              className="cursor-pointer rounded-xl bg-white p-4 text-center shadow-sm hover:shadow-md transition-all"
              onClick={() => setShowEmployees((prev) => !prev)}
            >
              <div className="inline-flex p-2 rounded-full bg-gray-100 text-gray-600 mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
              <p className="text-xs text-muted-foreground">Total Employés</p>
            </div>
          </div>

          {/* Barre d'actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/40">
            <div className="flex flex-wrap items-center gap-1 p-0.5 bg-slate-100/80 rounded-lg border border-slate-200/50">
              <SegmentedButton active={filterType === "all"} onClick={() => setFilterType("all")} label="Tous" />
              {Object.entries(typeConfig).map(([key, cfg]) => (
                <SegmentedButton
                  key={key}
                  active={filterType === key}
                  onClick={() => setFilterType(key as TypeStructure)}
                  label={cfg.label}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <ActionButton onClick={exportCSV} title="Exporter en CSV" icon={<FileText className="w-3.5 h-3.5" />} />
              <ActionButton onClick={exportXLSX} title="Exporter en Excel" icon={<Download className="w-3.5 h-3.5" />} />
              <ActionButton onClick={exportPDF} title="Exporter en PDF" icon={<RefreshCw className="w-3.5 h-3.5" />} />
              <div className="h-5 w-px bg-slate-200 mx-1" />
              <ActionButton
                onClick={() => setShowImportModal(true)}
                title="Importer des structures"
                icon={<Upload className="w-3.5 h-3.5" />}
                label="Importer"
              />
              <ActionButton
                onClick={() => setShowEmployees((prev) => !prev)}
                title={showEmployees ? "Masquer la liste des employés dans l'arbre" : "Afficher la liste des employés dans l'arbre"}
                icon={showEmployees ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                label={showEmployees ? "Masquer" : "Afficher"}
              />
              {selectedUnitIds.size > 0 && (
                <ActionButton
                  onClick={handleBulkDelete}
                  destructive
                  title={`Supprimer la sélection (${selectedUnitIds.size} unités)`}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  label={`Suppr. (${selectedUnitIds.size})`}
                />
              )}
              {/* Le bouton "Ajouter" demandé, sans le dégradé */}
              <button
                onClick={openAddModal}
                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Ajouter
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm p-6">{getFilteredView()}</div>
        </>
      )}

      {/* --- Modaux (Dialogues) --- */}

      {/* Modal Détails exact (selon image 1) */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{selectedUnit.name}</h2>
              <button onClick={() => setSelectedUnit(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <InfoCard label="Code" value={selectedUnit.code} />
                <InfoCard label="Type" value={typeConfig[selectedUnit.type].label} />
                <InfoCard label="Employés" value={`${selectedUnit.employees?.length ?? 0}`} />
                {selectedUnit.location && <InfoCard label="Site" value={selectedUnit.location} />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Sous‑unités ({selectedUnit.children?.length || 0})</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUnit.children && selectedUnit.children.length > 0 ? (
                    selectedUnit.children.map((child) => (
                      <span
                        key={child.id}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer hover:shadow-sm transition-all",
                          typeConfig[child.type].bgLight,
                          typeConfig[child.type].textColor,
                          typeConfig[child.type].borderLight
                        )}
                        onClick={() => setSelectedUnit(child)}
                      >
                        {child.name} ({child.code})
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400 italic">Aucune sous-unité.</span>
                  )}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setSelectedUnit(null);
                  openEditModal(selectedUnit);
                }}
                className="px-5 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 shadow-sm transition-all"
              >
                Modifier
              </button>
              <button
                onClick={() => setSelectedUnit(null)}
                className="px-5 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-sm transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaires d'ajout et d'édition (Bordures nettes, petit format) */}
      <FormModal
        title={showAddModal ? "Nouvelle Unité" : "Modifier l'Unité"}
        isOpen={showAddModal || showEditModal}
        onClose={() => { setShowAddModal(false); setShowEditModal(false); setUnitToEdit(null); }}
        onSubmit={showAddModal ? addUnit : updateUnit}
        submitLabel={showAddModal ? "Créer l'unité" : "Enregistrer"}
        formData={formData}
        setFormData={setFormData}
        allCodes={allCodes}
        unitToEdit={unitToEdit}
        parentOptions={parentOptions}
      />

      {/* Modal Suppression Exact (selon image 2) */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-red-600">Supprimer l'unité</h2>
              <button onClick={() => setUnitToDelete(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-base">
                Êtes-vous sûr de vouloir supprimer {unitToDelete.name} ({unitToDelete.code}) ?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setUnitToDelete(null)} 
                className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 shadow-sm transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deleteUnit(unitToDelete.id);
                  setUnitToDelete(null);
                }}
                className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Multiple (Identique à suppression unique) */}
      {showBulkDeleteModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-red-600">Suppression multiple</h2>
              <button onClick={() => setShowBulkDeleteModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 text-base">
                Êtes-vous sûr de vouloir supprimer les <strong>{selectedUnitIds.size} entités sélectionnées</strong> et leurs descendants ?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button 
                onClick={() => setShowBulkDeleteModal(false)} 
                className="px-5 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 shadow-sm transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmBulkDelete} 
                disabled={isActionLoading} 
                className="px-5 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 shadow-sm transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal (Exactement le style demandé via Tailwind) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <Upload className="h-5 w-5" /> Importer des structures
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Téléchargez un fichier <strong>CSV, XLSX ou XLS</strong> respectant le format décrit ci-dessous.
                </p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm space-y-3">
                <p className="font-medium flex items-center gap-1 text-blue-900">
                  <Info className="h-4 w-4" />Format attendu (CSV / Excel avec en-tête) :
                </p>
                <code className="text-[11px] bg-blue-100 px-2 py-1.5 rounded block text-blue-800 border border-blue-200 font-mono tracking-wider">
                  Nom, Type, Code, Code Parent, Site
                </code>
                <div className="space-y-2 text-blue-900">
                  <p className="text-xs font-medium">Description des colonnes :</p>
                  <ul className="space-y-1 text-xs list-disc pl-4 leading-relaxed">
                    <li><strong>Nom</strong> : Nom de l'unité (obligatoire)</li>
                    <li><strong>Type</strong> : Direction, Département, Division, UGP, Agence (obligatoire)</li>
                    <li><strong>Code</strong> : Identifiant analytique (obligatoire, unique)</li>
                    <li><strong>Code Parent</strong> : Laissez vide si c'est une entité racine. Identifiant analytique du parent sinon.</li>
                    <li><strong>Site</strong> : Localisation géographique (optionnel)</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={downloadImportTemplate} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                  <Download className="h-4 w-4" /> Télécharger le modèle
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isActionLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50">
                  {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} 
                  {isActionLoading ? "Importation..." : "Choisir un fichier"}
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end bg-gray-50">
              <button onClick={() => setShowImportModal(false)} className="px-5 py-2 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-all shadow-sm">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm">
      <p className="text-[12px] font-medium text-gray-500 mb-1 flex items-center gap-1.5">{icon} {label}</p>
      <p className="text-gray-900 font-bold text-base">{value}</p>
    </div>
  );
}