"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
import {
  Shield, Users, Eye, Edit, Trash2, Plus, X, Lock,
  FileText, Database, UserCog, Building2, ClipboardList, Bot,
  Search, AlertCircle, LayoutDashboard, Package, ShoppingCart,
  History, User, Bell, MessageSquare, ClipboardCheck, BarChart3,
  Truck, Boxes, TrendingUp, DollarSign, Layers, Landmark,
  MapPin, FileCheck, AlertTriangle, Settings, Check,
  Loader2, ChevronsUpDown, ChevronDown, BadgeCheck, Hash,
  Fingerprint, Building, IdCard, ShieldCheck, ShieldAlert,
  CircleUser, KeyRound, ArrowRight, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { utilisateurService } from "@/services/utilisateur.service";
import { employeService } from "@/services/employe.service";
import type { UtilisateurDto, RoleUtilisateur } from "@/types/utilisateur";
import type { EmployeDto } from "@/types/employe";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface PageAccess {
  name: string;
  href: string;
  icon: React.ElementType;
  section: string;
}

interface Role {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  accent: {
    bg: string; text: string; soft: string;
    border: string; pill: string; ring: string;
  };
  usersCount: number;
  pages: PageAccess[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Accents prédéfinis
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT_MAP: Record<string, Role["accent"]> = {
  ADMIN_SI: {
    bg: "bg-[#1B5E20]", text: "text-[#1B5E20]", soft: "bg-[#E8F5E9]",
    border: "border-[#A5D6A7]", pill: "bg-[#1B5E20] text-white", ring: "ring-[#1B5E20]",
  },
  CHEF_SERVICE: {
    bg: "bg-[#1565C0]", text: "text-[#1565C0]", soft: "bg-[#E3F2FD]",
    border: "border-[#90CAF9]", pill: "bg-[#1565C0] text-white", ring: "ring-[#1565C0]",
  },
  EMPLOYE: {
    bg: "bg-[#6A1B9A]", text: "text-[#6A1B9A]", soft: "bg-[#F3E5F5]",
    border: "border-[#CE93D8]", pill: "bg-[#6A1B9A] text-white", ring: "ring-[#6A1B9A]",
  },
  RESPONSABLE_LOGISTIQUE: {
    bg: "bg-[#E65100]", text: "text-[#E65100]", soft: "bg-[#FFF3E0]",
    border: "border-[#FFCC80]", pill: "bg-[#E65100] text-white", ring: "ring-[#E65100]",
  },
};

const ROLE_LABEL: Record<string, string> = {
  ADMIN_SI: "Administrateur SI",
  CHEF_SERVICE: "Chef de Service",
  EMPLOYE: "Employé",
  RESPONSABLE_LOGISTIQUE: "Responsable Logistique",
};

const ROLE_DESCRIPTION: Record<string, string> = {
  ADMIN_SI: "Accès complet à toutes les interfaces et fonctionnalités du système",
  CHEF_SERVICE: "Espace personnel employé + gestion d'équipe, validation et workflow",
  EMPLOYE: "Accès aux ressources, demandes, matériel, notifications et assistant IA",
  RESPONSABLE_LOGISTIQUE: "Gestion complète du stock, approvisionnement, flux et pilotage",
};

// Icône par rôle pour le select stylé
const ROLE_ICON: Record<string, React.ElementType> = {
  ADMIN_SI: ShieldCheck,
  CHEF_SERVICE: UserCog,
  EMPLOYE: CircleUser,
  RESPONSABLE_LOGISTIQUE: Truck,
};

// Couleur hex brute pour les éléments inline (non-Tailwind)
const ROLE_HEX: Record<string, string> = {
  ADMIN_SI: "#1B5E20",
  CHEF_SERVICE: "#1565C0",
  EMPLOYE: "#6A1B9A",
  RESPONSABLE_LOGISTIQUE: "#E65100",
};

const ROLE_SOFT_HEX: Record<string, string> = {
  ADMIN_SI: "#E8F5E9",
  CHEF_SERVICE: "#E3F2FD",
  EMPLOYE: "#F3E5F5",
  RESPONSABLE_LOGISTIQUE: "#FFF3E0",
};

// ─────────────────────────────────────────────────────────────────────────────
// Pages prédéfinies par rôle
// ─────────────────────────────────────────────────────────────────────────────
const adminPages: PageAccess[] = [
  { section: "Principal",    name: "Tableau de bord",         href: "/dashboard/admin",              icon: LayoutDashboard },
  { section: "Gestion",      name: "Utilisateurs & IAM",      href: "/dashboard/admin/users",        icon: Users           },
  { section: "Gestion",      name: "Gestion Employés",        href: "/dashboard/admin/employees",    icon: UserCog         },
  { section: "Gestion",      name: "Rôles & Permissions",     href: "/dashboard/admin/roles",        icon: Shield          },
  { section: "Gestion",      name: "Structures",              href: "/dashboard/admin/organization", icon: Building2       },
  { section: "Support",      name: "Support IT",              href: "/dashboard/admin/support",      icon: MessageSquare   },
  { section: "Supervision",  name: "Audit & Logs",            href: "/dashboard/admin/audit",        icon: BarChart3       },
  { section: "Supervision",  name: "Paramétrage",             href: "/dashboard/admin/settings",     icon: Settings        },
  { section: "IA",           name: "Assistant IA",            href: "/dashboard/admin/assistant",    icon: Bot             },
];

const chefPages: PageAccess[] = [
  { section: "Espace Personnel",       name: "Tableau de bord",         href: "/dashboard/employe",              icon: LayoutDashboard },
  { section: "Espace Personnel",       name: "Catalogue",               href: "/dashboard/employe/catalogue",    icon: Package         },
  { section: "Espace Personnel",       name: "Mon Panier",              href: "/dashboard/employe/panier",       icon: ShoppingCart    },
  { section: "Espace Personnel",       name: "Mes Demandes",            href: "/dashboard/employe/demandes",     icon: FileText        },
  { section: "Espace Personnel",       name: "Suivi des Demandes",      href: "/dashboard/employe/suivi",        icon: ClipboardList   },
  { section: "Espace Personnel",       name: "Matériel en Prêt",        href: "/dashboard/employe/prets",        icon: AlertTriangle   },
  { section: "Espace Personnel",       name: "Historique",              href: "/dashboard/employe/historique",   icon: History         },
  { section: "Espace Personnel",       name: "Mon Profil",              href: "/dashboard/employe/profil",       icon: User            },
  { section: "Validation & Workflow",  name: "Tableau de bord chef",    href: "/dashboard/chef",                 icon: LayoutDashboard },
  { section: "Validation & Workflow",  name: "File de validation",      href: "/dashboard/chef/validation",      icon: ClipboardCheck  },
  { section: "Validation & Workflow",  name: "Demandes équipe",         href: "/dashboard/chef/demandes",        icon: Users           },
  { section: "Validation & Workflow",  name: "Statistiques équipe",     href: "/dashboard/chef/statistiques",    icon: BarChart3       },
  { section: "Validation & Workflow",  name: "Notifications",           href: "/dashboard/chef/notifications",   icon: Bell            },
];

const employePages: PageAccess[] = [
  { section: "Accueil",         name: "Tableau de bord",        href: "/dashboard/employe",               icon: LayoutDashboard },
  { section: "Mes Ressources",  name: "Catalogue",              href: "/dashboard/employe/catalogue",     icon: Package         },
  { section: "Mes Ressources",  name: "Mon Panier",             href: "/dashboard/employe/panier",        icon: ShoppingCart    },
  { section: "Mes Ressources",  name: "Mes Demandes",           href: "/dashboard/employe/demandes",      icon: FileText        },
  { section: "Mes Ressources",  name: "Suivi des Demandes",     href: "/dashboard/employe/suivi",         icon: ClipboardList   },
  { section: "Matériel",        name: "Matériel en Prêt",       href: "/dashboard/employe/prets",         icon: AlertTriangle   },
  { section: "Matériel",        name: "Historique",             href: "/dashboard/employe/historique",    icon: History         },
  { section: "Communication",   name: "Mes Notifications",      href: "/dashboard/employe/notifications", icon: Bell            },
  { section: "Communication",   name: "Support IT",             href: "/dashboard/employe/support",       icon: MessageSquare   },
  { section: "Communication",   name: "Assistant IA",           href: "/dashboard/employe/assistant",     icon: Bot             },
  { section: "Mon Compte",      name: "Mon Profil",             href: "/dashboard/employe/profil",        icon: User            },
];

const responsablePages: PageAccess[] = [
  { section: "Dashboard",                  name: "Tableau de bord",             href: "/dashboard/responsable",                  icon: LayoutDashboard },
  { section: "Catalogue",                  name: "Catalogue",                   href: "/dashboard/responsable/catalogue",         icon: Package         },
  { section: "Catalogue",                  name: "Catégories",                  href: "/dashboard/responsable/categories",        icon: Layers          },
  { section: "Catalogue",                  name: "Rayons & Emplacements",       href: "/dashboard/responsable/rayons",            icon: MapPin          },
  { section: "Flux physiques & documents", name: "Réceptions",                  href: "/dashboard/responsable/receptions",        icon: ClipboardList   },
  { section: "Flux physiques & documents", name: "Sorties à préparer",          href: "/dashboard/responsable/sorties",           icon: Boxes           },
  { section: "Flux physiques & documents", name: "Bons de sortie",              href: "/dashboard/responsable/bons-sortie",       icon: FileText        },
  { section: "Approvisionnement",          name: "Référentiel Fournisseurs",    href: "/dashboard/responsable/fournisseurs",      icon: Users           },
  { section: "Approvisionnement",          name: "Commandes fournisseurs",      href: "/dashboard/responsable/commandes",         icon: Truck           },
  { section: "Approvisionnement",          name: "Bons de Commande",            href: "/dashboard/responsable/commandes",         icon: FileCheck       },
  { section: "Approvisionnement",          name: "Marchés Publics",             href: "/dashboard/responsable/marche",            icon: Landmark        },
  { section: "Audit & inventaire",         name: "Inventaire",                  href: "/dashboard/responsable/inventaire",        icon: TrendingUp      },
  { section: "Finance & fiscalité",        name: "Gestion TVA",                 href: "/dashboard/responsable/tva",               icon: DollarSign      },
  { section: "Pilotage & alertes",         name: "Alertes stock",               href: "/dashboard/responsable/alertes",           icon: AlertTriangle   },
  { section: "Pilotage & alertes",         name: "Statistiques",                href: "/dashboard/responsable/statistiques",      icon: BarChart3       },
  { section: "Notifications",             name: "Notifications",               href: "/dashboard/responsable/notifications",     icon: Bell            },
];

const PAGES_BY_ROLE: Record<string, PageAccess[]> = {
  ADMIN_SI:               adminPages,
  CHEF_SERVICE:           chefPages,
  EMPLOYE:                employePages,
  RESPONSABLE_LOGISTIQUE: responsablePages,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function groupBySection(pages: PageAccess[]): Record<string, PageAccess[]> {
  return pages.reduce((acc, p) => {
    if (!acc[p.section]) acc[p.section] = [];
    acc[p.section].push(p);
    return acc;
  }, {} as Record<string, PageAccess[]>);
}

/** Retourne les initiales d'un nom complet (max 2 lettres) */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Atoms
// ─────────────────────────────────────────────────────────────────────────────
function Btn({ onClick, children, icon, variant = "outline", disabled, className }: {
  onClick?: () => void; children?: React.ReactNode; icon?: React.ReactNode;
  variant?: "outline" | "solid" | "ghost" | "danger"; disabled?: boolean; className?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "outline" && "border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
        variant === "solid"   && "bg-[#1B5E20] text-white hover:bg-[#2E7D32] shadow-sm",
        variant === "ghost"   && "text-gray-600 hover:bg-gray-100",
        variant === "danger"  && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
    >
      {icon}{children}
    </button>
  );
}

function FL({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">{children}</p>;
}

function SelF({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-800",
        "focus:outline-none focus:ring-2 focus:border-[#2E7D32] focus:ring-[#2E7D32]/20 transition-all appearance-none cursor-pointer",
        props.className
      )}
    >
      {children}
    </select>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RoleCard
// ─────────────────────────────────────────────────────────────────────────────
function RoleCard({ role, selected, onClick }: { role: Role; selected: boolean; onClick: () => void }) {
  const { accent } = role;
  const sections = Object.keys(groupBySection(role.pages));
  return (
    <button onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border-2 bg-white p-5 transition-all duration-200 hover:shadow-md",
        selected ? cn("border-transparent shadow-lg ring-2", accent.ring) : "border-gray-100 hover:border-gray-200"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shadow-sm text-white", accent.bg)}>
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", accent.soft, accent.text)}>
            {role.pages.length} pages
          </span>
        </div>
      </div>
      <h3 className="font-bold text-gray-800 text-sm mb-0.5">{role.name}</h3>
      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">{role.description}</p>
      <div className="flex flex-wrap gap-1">
        {sections.slice(0, 4).map(s => (
          <span key={s} className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", accent.soft, accent.text, accent.border)}>
            {s}
          </span>
        ))}
        {sections.length > 4 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            +{sections.length - 4}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Users className="h-3.5 w-3.5" />
          <span><strong className="text-gray-700">{role.usersCount}</strong> utilisateurs</span>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarPreview
// ─────────────────────────────────────────────────────────────────────────────
function SidebarPreview({ role, searchQuery }: { role: Role; searchQuery: string }) {
  const { accent } = role;
  const q = searchQuery.toLowerCase();
  const filtered = q
    ? role.pages.filter(p => p.name.toLowerCase().includes(q) || p.section.toLowerCase().includes(q))
    : role.pages;
  const grouped = groupBySection(filtered);

  return (
    <div className="flex gap-6 h-full">
      <div className="w-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-md border border-gray-200 flex flex-col">
        <div className="bg-[#1D6F42] px-4 py-3 flex items-center gap-2.5 flex-shrink-0">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate">AL OMRANE</p>
            <p className="text-[10px] text-white/60 truncate">{role.subtitle}</p>
          </div>
        </div>
        <div className="flex-1 bg-[#1D6F42] px-2 py-3 overflow-y-auto space-y-3 max-h-[520px]">
          {Object.entries(grouped).map(([section, pages]) => (
            <div key={section}>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40 px-2 mb-1">{section}</p>
              <div className="space-y-0.5">
                {pages.map((page, i) => {
                  const Icon = page.icon;
                  const isFirst = i === 0 && section === Object.keys(grouped)[0];
                  return (
                    <div key={page.href + page.name}
                      className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
                        isFirst ? "bg-white text-[#1D6F42]" : "text-white/70 hover:bg-white/10")}
                    >
                      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0", isFirst ? "text-[#1D6F42]" : "text-white/50")} />
                      <span className="truncate">{page.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-white/30 text-xs text-center py-4">Aucun résultat</p>
          )}
        </div>
        <div className="bg-[#1D6F42] border-t border-white/10 px-4 py-2.5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">U</div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-white truncate">Utilisateur</p>
              <p className="text-[9px] text-white/50 truncate">{role.name}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-4 overflow-y-auto max-h-[580px] pr-1">
        {Object.entries(grouped).map(([section, pages]) => (
          <div key={section}>
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg mb-2", accent.soft)}>
              <div className={cn("h-1.5 w-1.5 rounded-full", accent.bg)} />
              <p className={cn("text-xs font-bold uppercase tracking-wider", accent.text)}>{section}</p>
              <span className={cn("ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full", accent.pill)}>
                {pages.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pages.map((page) => {
                const Icon = page.icon;
                return (
                  <div key={page.href + page.name}
                    className={cn("flex items-center gap-3 p-3 rounded-xl border bg-white hover:shadow-sm transition-all", accent.border, "border-opacity-40")}
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", accent.soft)}>
                      <Icon className={cn("h-4 w-4", accent.text)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{page.name}</p>
                      <p className="text-[10px] text-gray-400 truncate font-mono">{page.href}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-400">
            <Search className="h-8 w-8 opacity-30" />
            <p className="text-sm">Aucune interface ne correspond à votre recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CompareView
// ─────────────────────────────────────────────────────────────────────────────
function CompareView({ roles }: { roles: Role[] }) {
  const allPages = useMemo(() => {
    const map = new Map<string, { name: string; icon: React.ElementType; section: string }>();
    roles.forEach(r => r.pages.forEach(p => {
      if (!map.has(p.href + p.name)) map.set(p.href + p.name, { name: p.name, icon: p.icon, section: p.section });
    }));
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [roles]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof allPages> = {};
    allPages.forEach(p => { if (!g[p.section]) g[p.section] = []; g[p.section].push(p); });
    return g;
  }, [allPages]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-56">Interface / Page</th>
            {roles.map(r => (
              <th key={r.id} className="px-3 py-3 text-center w-28">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center text-white shadow-sm", r.accent.bg)}>
                    <Shield className="h-3.5 w-3.5" />
                  </div>
                  <span className={cn("text-[10px] font-bold", r.accent.text)}>{r.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Object.entries(grouped).map(([section, pages]) => (
            <Fragment key={section}>
              <tr className="bg-gray-50/80">
                <td colSpan={roles.length + 1} className="px-4 py-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{section}</p>
                </td>
              </tr>
              {pages.map(page => {
                const Icon = page.icon;
                return (
                  <tr key={page.key} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{page.name}</p>
                        </div>
                      </div>
                    </td>
                    {roles.map(r => {
                      const has = r.pages.some(p => p.name === page.name && p.section === page.section);
                      return (
                        <td key={r.id} className="px-3 py-2.5 text-center">
                          <div className={cn("mx-auto h-6 w-6 rounded-md flex items-center justify-center",
                            has ? cn(r.accent.soft, r.accent.text) : "bg-gray-100 text-gray-300")}>
                            {has ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <X className="h-3 w-3" strokeWidth={2} />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RoleSelectOption — carte de rôle dans le popover de sélection de rôle
// ─────────────────────────────────────────────────────────────────────────────
function RoleSelectOption({
  role,
  selected,
  currentUserRole,
  onSelect,
}: {
  role: Role;
  selected: boolean;
  currentUserRole?: string;
  onSelect: () => void;
}) {
  const RoleIcon = ROLE_ICON[role.id] ?? Shield;
  const hex = ROLE_HEX[role.id] ?? "#1B5E20";
  const softHex = ROLE_SOFT_HEX[role.id] ?? "#E8F5E9";
  const isCurrent = currentUserRole === role.id;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 border",
        selected
          ? "border-[2px] shadow-sm"
          : "border-transparent hover:border-gray-100 hover:bg-gray-50/80"
      )}
      style={
        selected
          ? { borderColor: hex, backgroundColor: softHex + "55" }
          : {}
      }
    >
      {/* Icône rôle */}
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
        style={{ backgroundColor: hex }}
      >
        <RoleIcon className="h-4.5 w-4.5 text-white" size={18} />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-semibold text-gray-800 truncate">{role.name}</span>
          {isCurrent && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: softHex, color: hex }}
            >
              Actuel
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{role.description}</p>
        <div className="flex items-center gap-2.5 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Users size={10} />
            {role.usersCount} utilisateurs
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <LayoutDashboard size={10} />
            {role.pages.length} pages
          </span>
        </div>
      </div>

      {/* Check si sélectionné */}
      {selected && (
        <div
          className="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          style={{ backgroundColor: hex }}
        >
          <Check size={11} className="text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────
export default function RolesPage() {
  const [users, setUsers] = useState<UtilisateurDto[]>([]);
  const [employees, setEmployees] = useState<EmployeDto[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [view, setView] = useState<"detail" | "compare">("detail");
  const [searchQuery, setSearchQuery] = useState("");

  // ── Attribution rapide ────────────────────────────────────────────────────
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRoleId, setAssignRoleId] = useState("");
  const [isAttributing, setIsAttributing] = useState(false);

  // Popover utilisateur
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const [userSelectQuery, setUserSelectQuery] = useState("");

  // Popover rôle (nouveau — remplace le <select> natif)
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);

  // Confirmation avant attribution (sécurité)
  const [confirmStep, setConfirmStep] = useState(false);

  // Chargement initial
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [userData, empData] = await Promise.all([
          utilisateurService.getAll(),
          employeService.getAll(),
        ]);
        setUsers(userData);
        setEmployees(empData);
        const roleKeys = Object.keys(PAGES_BY_ROLE) as RoleUtilisateur[];
        const roleList: Role[] = roleKeys.map(roleKey => ({
          id: roleKey,
          name: ROLE_LABEL[roleKey],
          subtitle: `SIGR - ${ROLE_LABEL[roleKey]}`,
          description: ROLE_DESCRIPTION[roleKey],
          accent: ACCENT_MAP[roleKey],
          usersCount: userData.filter(u => u.role === roleKey).length,
          pages: PAGES_BY_ROLE[roleKey] || [],
        }));
        setRoles(roleList);
        if (roleList.length > 0) setSelectedRole(roleList[0]);
      } catch (e: any) {
        toast.error("Erreur de chargement des données");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Map des employés pour enrichissement
  const employeMap = useMemo(() => {
    const map = new Map<number, EmployeDto>();
    employees.forEach(emp => map.set(emp.id, emp));
    return map;
  }, [employees]);

  // Options enrichies pour le sélecteur d'utilisateur
  const userOptions = useMemo(() => {
    return users.map(u => {
      const emp = employeMap.get(u.employeId);
      const fullName = u.employeNom || `${emp?.prenom ?? ""} ${emp?.nom ?? ""}`.trim();
      const dept = u.department || emp?.structureNom || "";
      const matricule = emp?.matricule || "";
      const badge = emp?.badge || "";
      const grade = emp?.grade || "";
      const loginLdap = u.loginLdap || "";
      const currentRole = u.role || "";

      return {
        value: String(u.id),
        label: fullName,
        dept,
        matricule,
        badge,
        grade,
        loginLdap,
        currentRole,
        searchText: `${fullName} ${loginLdap} ${dept} ${matricule} ${badge}`.toLowerCase(),
        display: (
          <div className="flex items-center gap-3 w-full min-w-0">
            {/* Avatar initiales */}
            <div className="h-8 w-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-[#1B5E20]">
              {initials(fullName || "?")}
            </div>
            <div className="flex-1 min-w-0">
              {/* Nom complet */}
              <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">{fullName}</p>
              {/* Ligne de méta : département + matricule + LDAP */}
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {dept && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                    <Building size={9} className="flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{dept}</span>
                  </span>
                )}
                {matricule && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                    <Hash size={9} className="flex-shrink-0" />
                    {matricule}
                  </span>
                )}
                {loginLdap && (
                  <span className="flex items-center gap-0.5 text-[10px] font-mono text-[#1565C0] bg-[#E3F2FD] px-1 py-0.5 rounded">
                    <Fingerprint size={9} className="flex-shrink-0" />
                    {loginLdap}
                  </span>
                )}
                {currentRole && ROLE_LABEL[currentRole] && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: ROLE_SOFT_HEX[currentRole] ?? "#f3f4f6",
                      color: ROLE_HEX[currentRole] ?? "#374151",
                    }}
                  >
                    {ROLE_LABEL[currentRole]}
                  </span>
                )}
              </div>
            </div>
          </div>
        ),
      };
    });
  }, [users, employeMap]);

  const filteredUserOptions = useMemo(() => {
    if (!userSelectQuery.trim()) return userOptions;
    const q = userSelectQuery.toLowerCase();
    return userOptions.filter(opt => opt.searchText.includes(q));
  }, [userOptions, userSelectQuery]);

  // Reset de la confirmation si l'utilisateur ou le rôle change
  useEffect(() => {
    setConfirmStep(false);
  }, [assignUserId, assignRoleId]);

  // Attribution d'un rôle — avec étape de confirmation
  const handleAssignRole = async () => {
    // Sécurité : validation stricte côté client
    if (!assignUserId || !assignRoleId) return;
    const user = users.find(u => String(u.id) === assignUserId);
    if (!user) {
      toast.error("Utilisateur introuvable. Veuillez rafraîchir la page.");
      return;
    }
    // Sécurité : bloquer l'attribution du même rôle
    if (user.role === assignRoleId) {
      toast.warning(`Cet utilisateur a déjà le rôle « ${ROLE_LABEL[assignRoleId]} ».`);
      return;
    }
    // Sécurité : valider que le rôle existe dans notre liste
    if (!PAGES_BY_ROLE[assignRoleId]) {
      toast.error("Rôle invalide.");
      return;
    }

    setIsAttributing(true);
    try {
      await utilisateurService.update(user.id, {
        loginLdap: user.loginLdap,
        actif: user.actif,
        role: assignRoleId as RoleUtilisateur,
        employeId: user.employeId,
      });
      toast.success(
        `✓ Rôle « ${ROLE_LABEL[assignRoleId]} » attribué à ${user.employeNom}`,
      );
      const updatedUsers = await utilisateurService.getAll();
      setUsers(updatedUsers);
      setRoles(prev =>
        prev.map(r => ({
          ...r,
          usersCount: updatedUsers.filter(u => u.role === r.id).length,
        }))
      );
      // Reset complet après succès
      setAssignUserId("");
      setAssignRoleId("");
      setConfirmStep(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Erreur lors de l'attribution du rôle");
    } finally {
      setIsAttributing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const assignedRole = roles.find(r => r.id === assignRoleId);
  const selectedUser = users.find(u => String(u.id) === assignUserId);
  const selectedUserOption = userOptions.find(o => o.value === assignUserId);
  const isSameRole = selectedUser?.role === assignRoleId;
  const canSubmit = !!assignUserId && !!assignRoleId && !isSameRole && !isAttributing;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rôles & Accès</h1>
            <p className="text-muted-foreground mt-1 text-sm text-gray-500">
              Gérez les rôles et leurs interfaces accessibles dans le système
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5" role="group">
              <button
                onClick={() => setView("detail")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  view === "detail" ? "bg-[#1B5E20] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                )}
              >
                Détail
              </button>
              <button
                onClick={() => setView("compare")}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                  view === "compare" ? "bg-[#1B5E20] text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
                )}
              >
                Comparaison
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 pb-6 space-y-6">
        {roles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map(role => (
              <RoleCard key={role.id} role={role}
                selected={selectedRole?.id === role.id && view === "detail"}
                onClick={() => { setSelectedRole(role); setView("detail"); }}
              />
            ))}
          </div>
        )}

        {view === "detail" && selectedRole && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className={cn("px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3", selectedRole.accent.soft)}>
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm", selectedRole.accent.bg)}>
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-gray-800">{selectedRole.name}</h2>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", selectedRole.accent.pill)}>
                      {selectedRole.pages.length} interfaces
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedRole.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Rechercher une page…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:border-[#2E7D32] focus:ring-[#2E7D32]/20 transition-all w-44"
                  />
                </div>
              </div>
            </div>
            <div className="p-6">
              <SidebarPreview role={selectedRole} searchQuery={searchQuery} />
            </div>
          </div>
        )}

        {view === "compare" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <h2 className="font-bold text-gray-800 text-sm">Comparaison des accès par rôle</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Toutes les interfaces disponibles dans le système, avec l'accès de chaque rôle
              </p>
            </div>
            <div className="p-4">
              <CompareView roles={roles} />
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            ATTRIBUTION RAPIDE — version améliorée (style + sécurité)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* En-tête section */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#E8F5E9] to-white">
            <div className="h-9 w-9 rounded-xl bg-[#1B5E20] flex items-center justify-center shadow-sm flex-shrink-0">
              <KeyRound className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Attribution rapide de rôle</h3>
              <p className="text-xs text-gray-400">Sélectionnez un utilisateur et un rôle — une confirmation sera demandée avant l'enregistrement</p>
            </div>
            {/* Badge de sécurité */}
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] border border-[#A5D6A7]">
              <ShieldCheck className="h-3 w-3 text-[#1B5E20]" />
              <span className="text-[10px] font-bold text-[#1B5E20] uppercase tracking-wide">Opération sécurisée</span>
            </div>
          </div>

          <div className="p-6 space-y-5">

            {/* ── Ligne 1 : deux sélecteurs côte à côte ─────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* ─── Sélecteur Utilisateur ─────────────────────────────────── */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  <CircleUser size={12} />
                  Utilisateur
                </label>

                <Popover open={userSelectOpen} onOpenChange={setUserSelectOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-12 w-full items-center gap-3 rounded-xl border bg-white px-3.5 py-2 text-sm shadow-sm",
                        "transition-all duration-150 focus:outline-none",
                        userSelectOpen
                          ? "border-[#1B5E20] ring-2 ring-[#1B5E20]/15"
                          : "border-gray-200 hover:border-gray-300",
                        selectedUserOption ? "text-gray-800" : "text-gray-400"
                      )}
                    >
                      {selectedUserOption ? (
                        <>
                          {/* Avatar */}
                          <div className="h-7 w-7 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#1B5E20]">
                            {initials(selectedUserOption.label)}
                          </div>
                          {/* Nom + méta condensés */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
                              {selectedUserOption.label}
                            </p>
                            <div className="flex items-center gap-2">
                              {selectedUserOption.dept && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400 truncate">
                                  <Building size={9} />
                                  <span className="truncate max-w-[100px]">{selectedUserOption.dept}</span>
                                </span>
                              )}
                              {selectedUserOption.matricule && (
                                <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                  <Hash size={9} />
                                  {selectedUserOption.matricule}
                                </span>
                              )}
                              {selectedUserOption.loginLdap && (
                                <span className="flex items-center gap-0.5 text-[10px] font-mono text-[#1565C0]">
                                  <Fingerprint size={9} />
                                  {selectedUserOption.loginLdap}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="flex-1 text-left truncate">Sélectionner un employé…</span>
                      )}
                      <ChevronDown
                        size={15}
                        className={cn(
                          "flex-shrink-0 text-gray-400 transition-transform duration-200",
                          userSelectOpen && "rotate-180"
                        )}
                      />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-[480px] p-0 bg-white border border-gray-200 shadow-xl rounded-2xl overflow-hidden"
                    align="start"
                    sideOffset={6}
                  >
                    <div className="flex flex-col bg-white rounded-2xl overflow-hidden">
                      {/* Barre de recherche native */}
                      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5 flex-shrink-0">
                        <Search size={14} className="text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          autoFocus
                          placeholder="Nom, matricule, login LDAP, département…"
                          value={userSelectQuery}
                          onChange={e => setUserSelectQuery(e.target.value)}
                          className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none bg-transparent border-0 p-0 min-w-0"
                        />
                        {userSelectQuery && (
                          <button
                            type="button"
                            onClick={() => setUserSelectQuery("")}
                            className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Liste des options */}
                      <div className="max-h-[320px] overflow-y-auto p-1.5" role="listbox">
                        {filteredUserOptions.length === 0 ? (
                          /* État vide — affiché uniquement si vraiment aucun résultat */
                          <div className="py-8 flex flex-col items-center gap-2 text-gray-400">
                            <Search size={24} className="opacity-20" />
                            <p className="text-sm">Aucun utilisateur trouvé</p>
                          </div>
                        ) : (
                          filteredUserOptions.map(opt => (
                            <div
                              key={opt.value}
                              role="option"
                              aria-selected={assignUserId === opt.value}
                              onClick={() => {
                                setAssignUserId(opt.value);
                                setUserSelectOpen(false);
                                setUserSelectQuery("");
                              }}
                              className={cn(
                                "flex items-center rounded-xl px-2 py-1.5 cursor-pointer transition-colors select-none",
                                assignUserId === opt.value
                                  ? "bg-[#F1F8F2]"
                                  : "bg-white hover:bg-gray-100"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                {opt.display}
                              </div>
                              {assignUserId === opt.value && (
                                <Check size={13} className="ml-2 text-[#1B5E20] flex-shrink-0" strokeWidth={2.5} />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Pied : compteur de résultats */}
                      <div className="border-t border-gray-100 px-3 py-2 bg-gray-50/60 flex-shrink-0">
                        <p className="text-[10px] text-gray-400">
                          {filteredUserOptions.length} utilisateur{filteredUserOptions.length !== 1 ? "s" : ""}
                          {userSelectQuery ? ` pour « ${userSelectQuery} »` : " au total"}
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* ─── Sélecteur Rôle — popover stylisté ───────────────────────── */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  <Shield size={12} />
                  Rôle à attribuer
                </label>

                <Popover open={roleSelectOpen} onOpenChange={setRoleSelectOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-12 w-full items-center gap-3 rounded-xl border bg-white px-3.5 py-2 text-sm shadow-sm",
                        "transition-all duration-150 focus:outline-none",
                        roleSelectOpen
                          ? "border-[#1B5E20] ring-2 ring-[#1B5E20]/15"
                          : "border-gray-200 hover:border-gray-300",
                        assignedRole ? "text-gray-800" : "text-gray-400"
                      )}
                    >
                      {assignedRole ? (() => {
                        const RoleIcon = ROLE_ICON[assignedRole.id] ?? Shield;
                        const hex = ROLE_HEX[assignedRole.id];
                        const softHex = ROLE_SOFT_HEX[assignedRole.id];
                        return (
                          <>
                            <div
                              className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: softHex }}
                            >
                              <RoleIcon size={16} style={{ color: hex }} />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
                                {assignedRole.name}
                              </p>
                              <p className="text-[10px] text-gray-400 truncate">{assignedRole.pages.length} interfaces accessibles</p>
                            </div>
                          </>
                        );
                      })() : (
                        <span className="flex-1 text-left truncate">Sélectionner un rôle…</span>
                      )}
                      <ChevronDown
                        size={15}
                        className={cn(
                          "flex-shrink-0 text-gray-400 transition-transform duration-200",
                          roleSelectOpen && "rotate-180"
                        )}
                      />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-[420px] p-2 bg-white border border-gray-200 shadow-xl rounded-2xl"
                    align="start"
                    sideOffset={6}
                  >
                    <div className="space-y-1">
                      {roles.map(role => (
                        <RoleSelectOption
                          key={role.id}
                          role={role}
                          selected={assignRoleId === role.id}
                          currentUserRole={selectedUser?.role}
                          onSelect={() => {
                            setAssignRoleId(role.id);
                            setRoleSelectOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* ── Ligne 2 : carte de prévisualisation + sécurité ──────────── */}
            {assignedRole && selectedUser && selectedUserOption && (
              <div
                className={cn(
                  "rounded-2xl border p-4 transition-all duration-200",
                  isSameRole
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-100 bg-gray-50/50"
                )}
              >
                {isSameRole ? (
                  /* Avertissement : même rôle déjà attribué */
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Rôle déjà attribué</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        <strong>{selectedUserOption.label}</strong> possède déjà le rôle
                        {" "}<strong>{ROLE_LABEL[assignRoleId]}</strong>. Choisissez un rôle différent.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Prévisualisation de l'opération */
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Aperçu de l'opération</p>

                    <div className="flex items-center gap-3">
                      {/* Utilisateur */}
                      <div className="flex-1 flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 px-3 py-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#1B5E20]">
                          {initials(selectedUserOption.label)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{selectedUserOption.label}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {selectedUserOption.dept && (
                              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                <Building size={9} />
                                <span className="truncate max-w-[80px]">{selectedUserOption.dept}</span>
                              </span>
                            )}
                            {selectedUserOption.matricule && (
                              <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                                <Hash size={9} />
                                {selectedUserOption.matricule}
                              </span>
                            )}
                            {selectedUserOption.loginLdap && (
                              <span className="flex items-center gap-0.5 text-[10px] font-mono text-[#1565C0]">
                                <Fingerprint size={9} />
                                {selectedUserOption.loginLdap}
                              </span>
                            )}
                          </div>
                          {/* Rôle actuel */}
                          {selectedUser.role && ROLE_LABEL[selectedUser.role] && (
                            <span
                              className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: ROLE_SOFT_HEX[selectedUser.role] ?? "#f3f4f6",
                                color: ROLE_HEX[selectedUser.role] ?? "#374151",
                              }}
                            >
                              Actuel : {ROLE_LABEL[selectedUser.role]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Flèche */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <ArrowRight size={18} className="text-[#1B5E20]" />
                        <span className="text-[9px] font-bold text-[#1B5E20] uppercase tracking-wide">Nouveau</span>
                      </div>

                      {/* Nouveau rôle */}
                      {(() => {
                        const RoleIcon = ROLE_ICON[assignedRole.id] ?? Shield;
                        const hex = ROLE_HEX[assignedRole.id];
                        const softHex = ROLE_SOFT_HEX[assignedRole.id];
                        return (
                          <div
                            className="flex-1 flex items-center gap-2.5 rounded-xl border px-3 py-2.5 min-w-0"
                            style={{ backgroundColor: softHex + "66", borderColor: hex + "44" }}
                          >
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                              style={{ backgroundColor: hex }}
                            >
                              <RoleIcon size={16} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate" style={{ color: hex }}>{assignedRole.name}</p>
                              <p className="text-[10px] text-gray-400">{assignedRole.pages.length} interfaces</p>
                              <p className="text-[9px] text-gray-400 truncate">{assignedRole.description}</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Étape de confirmation */}
                    {!confirmStep ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmStep(true)}
                          disabled={!canSubmit}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-all shadow-sm",
                            canSubmit
                              ? "bg-[#1B5E20] text-white hover:bg-[#2E7D32] active:scale-[0.98]"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          )}
                        >
                          <ShieldCheck size={15} />
                          Confirmer l'attribution
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAssignUserId(""); setAssignRoleId(""); }}
                          className="h-10 px-3.5 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      /* Double confirmation — sécurité renforcée */
                      <div className="rounded-xl border border-[#1B5E20]/25 bg-[#E8F5E9]/60 p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={14} className="text-[#1B5E20] mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-[#1B5E20]">
                            Vous êtes sur le point d'attribuer le rôle <strong>{assignedRole.name}</strong>{" "}
                            à <strong>{selectedUserOption.label}</strong>. Cette action modifiera ses accès immédiatement.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAssignRole}
                            disabled={isAttributing}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-bold transition-all",
                              "bg-[#1B5E20] text-white hover:bg-[#2E7D32] active:scale-[0.98]",
                              isAttributing && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            {isAttributing ? (
                              <><Loader2 size={14} className="animate-spin" /> Attribution…</>
                            ) : (
                              <><BadgeCheck size={14} /> Oui, attribuer</>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmStep(false)}
                            disabled={isAttributing}
                            className="h-9 px-3 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
                          >
                            Retour
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Placeholder si rien n'est sélectionné */}
            {(!assignUserId || !assignRoleId) && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                <Lock size={14} className="text-gray-300 flex-shrink-0" />
                <p className="text-xs text-gray-400">
                  Sélectionnez un utilisateur <strong>et</strong> un rôle pour prévisualiser l'opération avant de confirmer.
                </p>
              </div>
            )}

          </div>
        </div>
        {/* ══ FIN Attribution rapide ══════════════════════════════════════════ */}

      </div>
    </div>
  );
}