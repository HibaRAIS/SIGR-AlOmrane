'use client';

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  CATALOGUE ARTICLES — AL OMRANE SOUSS MASSA                     ║
 * ║  Version Expert v7.3 — Corrections complètes                    ║
 * ║  Clean Code · High Engineering · Security best-practices        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Corrections v7.3 :
 *  1.  Fix Absolu: Barre de recherche (Input) dans les Selects du Formulaire
 *      débloquée. Contournement du "Focus Trap" de Radix via onFocusOutside
 *      et onKeyDown propagation stop. On peut désormais taper du texte.
 *  2.  Export PDF : refonte complète avec le style exact ERP Al Omrane (A4, vert #1D6F42).
 *  3.  Nettoyage UI : Suppression totale des interfaces d'historique (onglets, liens, blocs).
 *  4.  Toutes les fonctionnalités expertes conservées.
 */

import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Package, Search, ChevronLeft, ChevronRight,
  Loader2, Eye, Edit, Trash2, TrendingUp, TrendingDown,
  Plus, RefreshCw, List, Grid3X3, X, MapPin, AlertTriangle,
  Download, ChevronDown, ChevronUp, FileSpreadsheet, FileText,
  UploadCloud, CheckCircle2, Info, Tag, ShoppingCart, ClipboardList,
  Activity, BarChart2, ArrowUpRight, ArrowDownRight, Minus, History,
  Boxes, Check, ChevronsUpDown, Bell, SlidersHorizontal,
  Building2, FileDown, Calendar, ExternalLink, Shield,
  ArrowUp, ArrowDown, Percent, Calculator,
  ChevronRight as ChevronRightIcon, Layers,
} from 'lucide-react';

// ══════════════════════════════════════ TYPES ══════════════════════════════════════

export type StockStatus   = 'ok' | 'faible' | 'critique';
export type SortColumn    = 'designation' | 'category' | 'location' | 'stock' | 'pmp' | 'status' | 'supplier';
export type SortDirection = 'asc' | 'desc';
export type ViewMode      = 'table' | 'grid';
export type StockFilter   = 'all' | StockStatus;
export type ActivePanel   = 'catalogue' | 'analyse';
export type MovementType  = 'entree' | 'sortie' | 'ajustement' | 'inventaire';
export type RotationScore = 'rapide' | 'normale' | 'lente';

export interface StockMovement {
  id: number;
  date: string;
  type: MovementType;
  quantity: number;
  reason: string;
  user: string;
  beforeStock: number;
  afterStock: number;
  unitPrice: number;
  supplierName?: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  location: string;
  currentStock: number;
  minThreshold: number;
  avgPrice: number;
  imageUrl: string;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  consignable: boolean;
  lastUpdated: string;
  supplier?: string;
  warrantyMonths?: number;
  createdAt?: string;
  movements?: StockMovement[];
}

// ══════════════════════════════════════ TYPES HIÉRARCHIE CATÉGORIE ════════════════

export interface CategoryNode {
  label: string;
  children?: CategoryNode[];
}

// ══════════════════════════════════════ CONSTANTES ════════════════════════════════

const CATEGORY_TREE: CategoryNode[] = [
  {
    label: 'Fournitures bureau',
    children: [
      {
        label: 'Papeterie',
        children: [
          { label: 'Papier & supports' },
          { label: 'Reliure & classement' },
          { label: 'Enveloppes & courrier' },
        ],
      },
      {
        label: 'Écriture',
        children: [
          { label: 'Stylos & feutres' },
          { label: 'Crayons & mines' },
          { label: 'Correcteurs' },
        ],
      },
      {
        label: 'Classement',
        children: [
          { label: 'Classeurs' },
          { label: 'Chemises & pochettes' },
          { label: 'Boîtes archives' },
        ],
      },
    ],
  },
  {
    label: 'Informatique',
    children: [
      {
        label: 'Périphériques',
        children: [
          { label: 'Souris & claviers' },
          { label: 'Écrans & moniteurs' },
          { label: 'Imprimantes & scanners' },
        ],
      },
      {
        label: 'Composants',
        children: [
          { label: 'Mémoire RAM' },
          { label: 'Stockage SSD/HDD' },
          { label: 'Processeurs' },
        ],
      },
      {
        label: 'Réseau',
        children: [
          { label: 'Switches & hubs' },
          { label: 'Câbles & connectique' },
          { label: 'Routeurs & WiFi' },
        ],
      },
    ],
  },
  {
    label: 'Mobilier',
    children: [
      {
        label: 'Chaises',
        children: [
          { label: 'Chaises ergonomiques' },
          { label: 'Chaises visiteurs' },
          { label: 'Tabourets' },
        ],
      },
      {
        label: 'Tables',
        children: [
          { label: 'Bureaux individuels' },
          { label: 'Tables de réunion' },
          { label: 'Plans de travail' },
        ],
      },
      {
        label: 'Rangements',
        children: [
          { label: 'Armoires' },
          { label: 'Étagères' },
          { label: 'Caissons' },
        ],
      },
    ],
  },
  {
    label: 'Outillage',
    children: [
      {
        label: 'Manuel',
        children: [
          { label: 'Tournevis & clés' },
          { label: 'Pinces & tenailles' },
          { label: 'Marteaux & massettes' },
        ],
      },
      {
        label: 'Électrique',
        children: [
          { label: 'Perceuses & visseuses' },
          { label: 'Meuleuses' },
          { label: 'Ponceuses' },
        ],
      },
      {
        label: 'Mesure',
        children: [
          { label: 'Mètres & rubans' },
          { label: 'Niveaux' },
          { label: 'Multimètres' },
        ],
      },
    ],
  },
  {
    label: 'Consommables',
    children: [
      {
        label: 'Impression',
        children: [
          { label: "Cartouches jet d'encre" },
          { label: 'Toners laser' },
          { label: 'Rubans thermiques' },
        ],
      },
      {
        label: 'Nettoyant',
        children: [
          { label: 'Nettoyants écrans' },
          { label: 'Air comprimé' },
          { label: 'Chiffons microfibre' },
        ],
      },
    ],
  },
  {
    label: 'Nettoyage',
    children: [
      {
        label: 'Désinfectant',
        children: [
          { label: 'Gels hydroalcooliques' },
          { label: 'Sprays désinfectants' },
          { label: 'Lingettes désinfectantes' },
        ],
      },
      {
        label: 'Balayage',
        children: [
          { label: 'Balais & pelles' },
          { label: 'Aspirateurs' },
          { label: 'Raclettes sols' },
        ],
      },
      {
        label: 'Hygiène',
        children: [
          { label: 'Savons & distributeurs' },
          { label: 'Essuie-mains' },
          { label: 'Sacs poubelle' },
        ],
      },
    ],
  },
];

function flattenCategoryTree(
  nodes: CategoryNode[],
  prefix = '',
): Array<{ path: string; label: string; depth: number; isLeaf: boolean }> {
  const result: Array<{ path: string; label: string; depth: number; isLeaf: boolean }> = [];
  for (const node of nodes) {
    const path  = prefix ? `${prefix} > ${node.label}` : node.label;
    const depth = prefix ? prefix.split(' > ').length : 0;
    result.push({ path, label: node.label, depth, isLeaf: !node.children || node.children.length === 0 });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategoryTree(node.children, path));
    }
  }
  return result;
}

const FLAT_CATEGORIES = flattenCategoryTree(CATEGORY_TREE);

const MOCK_LOCATIONS: string[] = [
  'Rayon A – A1', 'Rayon A – A2', 'Rayon A – A3',
  'Rayon B – B1', 'Rayon B – B2', 'Rayon B – B3',
  'Rayon C – C1', 'Rayon C – C2', 'Rayon C – C3',
  'Zone D – D1', 'Zone D – D2', 'Zone E – E1',
  'Zone E – E2', 'Entrepôt Principal', 'Entrepôt Secondaire',
];

const MOCK_SUPPLIERS: string[] = [
  'Acme Fournitures', 'Bureau Direct', 'Tech Solutions Maroc',
  'Mobilier Pro', 'Office Plus', 'DataPrint', 'CleanPro Maroc',
  'Outillage Expert', 'Inforex', 'Hygiène & Co',
  'Fournitures Agadir', 'Atlas Équipement', 'Souss Tech',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Fournitures bureau': '#1a4731',
  Informatique:        '#2563eb',
  Mobilier:            '#7c3aed',
  Outillage:           '#d97706',
  Consommables:        '#0891b2',
  Nettoyage:           '#16a34a',
};

const MOVEMENT_CONFIG: Record<MovementType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  entree:     { label: 'Entrée',     color: 'text-emerald-600', bg: 'bg-emerald-50', Icon: ArrowUpRight   },
  sortie:     { label: 'Sortie',     color: 'text-red-500',     bg: 'bg-red-50',     Icon: ArrowDownRight },
  ajustement: { label: 'Ajust.',     color: 'text-blue-600',    bg: 'bg-blue-50',    Icon: SlidersHorizontal },
  inventaire: { label: 'Inventaire', color: 'text-violet-600',  bg: 'bg-violet-50',  Icon: ClipboardList  },
};

// ══════════════════════════════════════ DONNÉES MOCK ══════════════════════════════

const getRandomImage = (id: number): string =>
  `https://picsum.photos/id/${(id % 100) + 10}/200/200`;

const generateProductCode = (): string =>
  `PRD-${Math.floor(100000 + Math.random() * 900000)}`;

const generateMockMovements = (
  productId: number,
  currentStock: number,
  unitPrice: number,
  supplierName?: string,
): StockMovement[] => {
  const types: MovementType[] = ['entree', 'sortie', 'ajustement', 'inventaire'];
  const reasons: Record<MovementType, string[]> = {
    entree:     ['Réception commande fournisseur', 'Retour matériel', 'Transfert entrepôt'],
    sortie:     ['Consommation service', 'Dotation utilisateur', 'Transfert site'],
    ajustement: ['Correction inventaire', 'Casse/perte', 'Erreur saisie'],
    inventaire: ['Inventaire mensuel', 'Inventaire tournant', 'Inventaire annuel'],
  };
  const users = ['K. Alami', 'S. Benali', 'M. Rachidi', 'F. Tazi', 'Y. Moussaoui'];
  const movements: StockMovement[] = [];
  let stock = currentStock;

  for (let i = 0; i < 8; i++) {
    const daysAgo = i * 7 + Math.floor(Math.random() * 5);
    const date    = new Date();
    date.setDate(date.getDate() - daysAgo);
    const type = types[Math.floor(Math.random() * types.length)];
    const qty  = Math.floor(Math.random() * 20) + 1;
    const delta =
      type === 'entree'  ? qty  :
      type === 'sortie'  ? -qty :
      Math.random() > 0.5 ? qty : -qty;
    const before = stock;
    stock = Math.max(0, stock - delta);
    const priceVariation = unitPrice * (1 + (Math.random() - 0.5) * 0.1);
    movements.unshift({
      id: productId * 100 + i,
      date: date.toISOString().slice(0, 10),
      type,
      quantity: Math.abs(delta),
      reason: reasons[type][Math.floor(Math.random() * reasons[type].length)],
      user: users[Math.floor(Math.random() * users.length)],
      beforeStock: Math.max(0, before),
      afterStock:  Math.max(0, stock),
      unitPrice:   Math.round(priceVariation * 100) / 100,
      supplierName: type === 'entree' ? supplierName : undefined,
    });
  }
  return movements.reverse();
};

const generateMockProducts = (): Product[] => {
  const base: Omit<Product, 'id' | 'movements'>[] = [
    {
      code: 'PRD-100234', name: 'Ramette papier A4 80g',
      category: 'Fournitures bureau', subcategory: 'Papeterie > Papier & supports',
      location: 'Rayon A – A1', currentStock: 210, minThreshold: 50,
      avgPrice: 18.5,
      imageUrl: getRandomImage(1),
      description: 'Papier blanc A4, 80g/m², 500 feuilles. Qualité supérieure.',
      weight: '2,5 kg', dimensions: '21×29,7 cm', material: 'Cellulose',
      safetyInstructions: "Conserver à l'abri de l'humidité",
      consignable: false, lastUpdated: '2025-04-01',
      supplier: 'Acme Fournitures', warrantyMonths: 0,
    },
    {
      code: 'PRD-100235', name: 'Stylo bille bleu BIC',
      category: 'Fournitures bureau', subcategory: 'Écriture > Stylos & feutres',
      location: 'Rayon A – A2', currentStock: 6, minThreshold: 20,
      avgPrice: 2.1,
      imageUrl: getRandomImage(2),
      description: 'Stylo bille rétractable encre bleue classique.',
      weight: '5 g', dimensions: '14 cm', material: 'Plastique',
      safetyInstructions: 'Néant', consignable: false,
      lastUpdated: '2025-04-02', supplier: 'Bureau Direct',
    },
    {
      code: 'PRD-200451', name: 'Cartouche HP 302 Noir',
      category: 'Consommables', subcategory: "Impression > Cartouches jet d'encre",
      location: 'Rayon B – B3', currentStock: 3, minThreshold: 5,
      avgPrice: 189,
      imageUrl: getRandomImage(3),
      description: 'Cartouche originale HP 302 XL, noir. Haute capacité.',
      weight: '50 g', dimensions: '10×4 cm', material: 'Plastique',
      safetyInstructions: "Conserver à l'abri de la lumière et de la chaleur",
      consignable: false, lastUpdated: '2025-03-28',
      supplier: 'DataPrint',
    },
    {
      code: 'PRD-200452', name: 'Souris optique USB Logitech',
      category: 'Informatique', subcategory: 'Périphériques > Souris & claviers',
      location: 'Rayon B – B1', currentStock: 12, minThreshold: 5,
      avgPrice: 95,
      imageUrl: getRandomImage(4),
      description: 'Souris filaire 1000 DPI. Design ergonomique.',
      weight: '90 g', dimensions: '11×6 cm', material: 'Plastique ABS',
      safetyInstructions: 'Néant', consignable: true,
      lastUpdated: '2025-04-05', supplier: 'Tech Solutions Maroc',
      warrantyMonths: 12,
    },
    {
      code: 'PRD-300101', name: 'Chaise de bureau ergonomique',
      category: 'Mobilier', subcategory: 'Chaises > Chaises ergonomiques',
      location: 'Zone D – D2', currentStock: 1, minThreshold: 2,
      avgPrice: 1250,
      imageUrl: getRandomImage(5),
      description: 'Chaise réglable avec accoudoirs et support lombaire.',
      weight: '12 kg', dimensions: '60×70 cm', material: 'Métal/Tissu',
      safetyInstructions: 'Charge maximale 120 kg', consignable: true,
      lastUpdated: '2025-04-10', supplier: 'Mobilier Pro', warrantyMonths: 24,
    },
    {
      code: 'PRD-600012', name: 'Gel hydroalcoolique 500ml',
      category: 'Nettoyage', subcategory: 'Désinfectant > Gels hydroalcooliques',
      location: 'Rayon C – C1', currentStock: 40, minThreshold: 10,
      avgPrice: 28,
      imageUrl: getRandomImage(6),
      description: 'Gel désinfectant pour les mains, 500 ml avec pompe.',
      weight: '600 g', dimensions: '7×20 cm', material: 'Flacon plastique',
      safetyInstructions: "Inflammable – tenir à l'écart des flammes",
      consignable: false, lastUpdated: '2025-04-08',
      supplier: 'CleanPro Maroc',
    },
    {
      code: 'PRD-400201', name: 'Scotch 19mm x 33m',
      category: 'Fournitures bureau', subcategory: 'Papeterie > Papier & supports',
      location: 'Rayon A – A3', currentStock: 0, minThreshold: 10,
      avgPrice: 8.5,
      imageUrl: getRandomImage(7),
      description: 'Ruban adhésif transparent haute résistance.',
      weight: '120 g', dimensions: '19mm×33m', material: 'PVC/Acrylique',
      safetyInstructions: 'Néant', consignable: false,
      lastUpdated: '2025-03-15', supplier: 'Bureau Direct',
    },
    {
      code: 'PRD-500033', name: 'Toner Samsung MLT-D111S',
      category: 'Consommables', subcategory: 'Impression > Toners laser',
      location: 'Rayon B – B2', currentStock: 1, minThreshold: 3,
      avgPrice: 290,
      imageUrl: getRandomImage(8),
      description: 'Toner Samsung SL-M2022/SL-M2070. Rendement 1000 pages.',
      weight: '300 g', dimensions: '20×8 cm', material: 'Plastique',
      safetyInstructions: 'Ne pas inhaler la poudre', consignable: false,
      lastUpdated: '2025-04-03', supplier: 'DataPrint',
    },
  ];

  return base.map((p, idx) => ({
    ...p,
    id: idx + 1,
    movements: generateMockMovements(idx + 1, p.currentStock, p.avgPrice, p.supplier),
  }));
};

const INITIAL_PRODUCTS: Product[] = generateMockProducts();

// ══════════════════════════════════════ HELPERS PURS ══════════════════════════════

const getStockStatus = (p: Product): StockStatus => {
  if (p.currentStock <= 0) return 'critique';
  if (p.currentStock <= p.minThreshold) return 'faible';
  return 'ok';
};

const hasRealMovements = (p: Product): boolean => {
  if (!p.movements || p.movements.length === 0) return false;
  return p.movements.some(m => m.type === 'entree' || m.type === 'sortie');
};

const computePMP = (movements: StockMovement[], fallbackPrice: number): number => {
  const entries = movements.filter(m => m.type === 'entree');
  if (entries.length === 0) return fallbackPrice;
  const totalQty = entries.reduce((s, m) => s + m.quantity, 0);
  if (totalQty === 0) return fallbackPrice;
  const totalVal = entries.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  return Math.round((totalVal / totalQty) * 100) / 100;
};

const getLastPurchase = (movements: StockMovement[]): StockMovement | null => {
  const entries = movements.filter(m => m.type === 'entree');
  if (entries.length === 0) return null;
  return entries.reduce((latest, m) =>
    new Date(m.date) > new Date(latest.date) ? m : latest,
  );
};

const computeStockStats = (movements: StockMovement[]) => {
  let cumulQteEntree = 0;
  let cumulQteSortie = 0;
  let cumulValEntree = 0;
  let cumulValSortie = 0;

  for (const m of movements) {
    const val = m.quantity * (m.unitPrice ?? 0);
    if (m.type === 'entree') {
      cumulQteEntree += m.quantity;
      cumulValEntree += val;
    } else if (m.type === 'sortie') {
      cumulQteSortie += m.quantity;
      cumulValSortie += val;
    }
  }

  return { cumulQteEntree, cumulQteSortie, cumulValEntree, cumulValSortie };
};

const fmtNumber = (n: number): string =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const fmtInt = (n: number): string =>
  new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtDate = (s?: string): string =>
  s ? new Date(s).toLocaleDateString('fr-FR') : '—';

const toYMD = (d: Date): string => d.toISOString().split('T')[0];

// ══════════════════════════════════════ PORTAL HELPERS ════════════════════════════

function computeFixedPosition(
  triggerEl: HTMLElement,
  dropdownWidth: number,
): React.CSSProperties {
  const rect = triggerEl.getBoundingClientRect();
  let left = rect.left;
  if (rect.left + dropdownWidth > window.innerWidth) {
    left = Math.max(8, rect.right - dropdownWidth);
  }
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropdownMaxHeight = 320;
  const openUpward = spaceBelow < dropdownMaxHeight && rect.top > dropdownMaxHeight;
  
  return {
    position: 'fixed',
    ...(openUpward
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }),
    left,
    width: Math.max(rect.width, dropdownWidth),
    zIndex: 99999,
    pointerEvents: 'auto',
  };
}

function usePortalPosition(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement>,
  dropdownWidth: number,
): React.CSSProperties | null {
  const [style, setStyle] = useState<React.CSSProperties | null>(null);

  const update = useCallback(() => {
    if (triggerRef.current) {
      setStyle(computeFixedPosition(triggerRef.current, dropdownWidth));
    }
  }, [triggerRef, dropdownWidth]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    update();
  }, [open, update]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener('scroll', update, { capture: true, passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update, { capture: true });
      window.removeEventListener('resize', update);
    };
  }, [open, update]);

  return style;
}

// ══════════════════════════════════════ TREE HELPERS ══════════════════════════════

interface CategoryFilterNode {
  path: string;
  label: string;
  depth: number;
  isLeaf: boolean;
  count: number;
  children: CategoryFilterNode[];
}

function buildCategoryFilterTree(
  nodes: CategoryNode[],
  productCounts: Record<string, number>,
  prefix = '',
  depth = 0,
): CategoryFilterNode[] {
  return nodes.map(node => {
    const path     = prefix ? `${prefix} > ${node.label}` : node.label;
    const children = node.children
      ? buildCategoryFilterTree(node.children, productCounts, path, depth + 1)
      : [];
    const selfCount   = productCounts[path] ?? 0;
    const childCount  = children.reduce((s, c) => s + c.count, 0);
    const count       = selfCount + childCount;
    return { path, label: node.label, depth, isLeaf: !node.children || node.children.length === 0, count, children };
  });
}

// ══════════════════════════════════════ CATEGORY FORM SELECT (Arbre) ══════════════

function CategoryFormSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}) {
  const [open, setOpen]             = useState(false);
  const [query, setQuery]           = useState('');
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const triggerRef                  = useRef<HTMLButtonElement>(null);
  const dropdownRef                 = useRef<HTMLDivElement>(null);
  const portalStyle                 = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 340);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        triggerRef.current?.contains(e.target as Node) === false
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filterTree = useMemo(
    () => buildCategoryFilterTree(CATEGORY_TREE, {}),
    [],
  );

  const flatFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return FLAT_CATEGORIES.filter(item =>
      item.path.toLowerCase().includes(q) || item.label.toLowerCase().includes(q),
    );
  }, [query]);

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(path)) s.delete(path); else s.add(path);
      return s;
    });
  };

  const selectedLabel = value ? value.split(' > ').pop() ?? value : 'Sélectionner une catégorie…';

  const renderTreeNode = (node: CategoryFilterNode): React.ReactNode => {
    const isExpanded = expanded.has(node.path);
    const isSelected = value === node.path;
    const hasChildren = node.children.length > 0;
    const indent = node.depth * 14;

    return (
      <div key={node.path}>
        <div
          style={{ paddingLeft: `${8 + indent}px` }}
          className={cn(
            'flex items-center gap-1 pr-2 py-1.5 hover:bg-[#E8F5E9] transition-colors group',
            isSelected && '!bg-[#F1F8E9]',
          )}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleExpand(node.path); }}
              className="w-4 h-4 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 flex-shrink-0"
            >
              {isExpanded
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRightIcon className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
              <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-[#1a4731]' : 'bg-zinc-300')} />
            </span>
          )}

          <button
            type="button"
            onClick={() => { onChange(node.path); setOpen(false); setQuery(''); }}
            className={cn(
              'flex-1 text-left text-xs flex items-center gap-1.5 min-w-0',
              node.depth === 0 ? 'font-bold text-zinc-900' : node.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500',
              isSelected && '!text-[#1a4731]',
            )}
          >
            {node.depth === 0 && (
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[node.label] ?? '#888' }}
              />
            )}
            <span className="truncate">{node.label}</span>
          </button>

          {isSelected && !hasChildren && (
            <Check className="w-3 h-3 text-[#1a4731] flex-shrink-0" />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) setExpanded(new Set()); }}
        className={cn(
          'w-full flex items-center justify-between h-9 px-3 rounded-xl border text-sm font-medium bg-white transition-all outline-none',
          error ? 'border-red-500 focus:ring-1 focus:ring-red-300' : 'border-zinc-200 hover:border-[#1a4731] focus:border-[#1a4731]',
          value ? 'text-zinc-900' : 'text-zinc-400',
        )}
      >
        <span className="truncate flex-1 text-left">{selectedLabel}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 ml-2" />
      </button>

      {open && portalStyle && createPortal(
        <div
          ref={dropdownRef}
          style={portalStyle}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown"
        >
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                autoFocus
                placeholder="Rechercher catégorie ou sous-catégorie…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                className="w-full h-8 pl-7 pr-2 text-xs border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className="w-full px-3 py-2 text-left text-xs text-zinc-400 italic hover:bg-zinc-50 transition-colors border-b border-zinc-50"
            >
              Aucune catégorie
            </button>
            {query.trim() ? (
              flatFiltered.length === 0 ? (
                <p className="px-3 py-3 text-xs text-zinc-400 italic text-center">Aucun résultat</p>
              ) : (
                flatFiltered.map((item, idx) => {
                  const isSelected = value === item.path;
                  const indent     = item.depth * 14;
                  return (
                    <button
                      key={`flat-${item.path}-${idx}`}
                      type="button"
                      onClick={() => { onChange(item.path); setOpen(false); setQuery(''); }}
                      style={{ paddingLeft: `${10 + indent}px` }}
                      className={cn(
                        'w-full pr-3 py-1.5 text-left text-xs flex items-center gap-1.5 hover:bg-[#E8F5E9] transition-colors',
                        isSelected && '!bg-[#F1F8E9] text-[#1a4731]',
                        item.depth === 0 ? 'font-bold text-zinc-900' : item.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500',
                      )}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#1a4731] flex-shrink-0" />}
                    </button>
                  );
                })
              )
            ) : (
              filterTree.map(node => renderTreeNode(node))
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ══════════════════════════════════════ FILTER CATEGORY HIERARCHIQUE ══════════════

function CategoryHierarchyFilterSelect({
  value,
  onChange,
  products,
}: {
  value: string;
  onChange: (val: string) => void;
  products: Product[];
}) {
  const [open, setOpen]             = useState(false);
  const [query, setQuery]           = useState('');
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());
  const triggerRef                  = useRef<HTMLButtonElement>(null);
  const dropdownRef                 = useRef<HTMLDivElement>(null);
  const portalStyle                 = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 280);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        triggerRef.current?.contains(e.target as Node) === false
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const productCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] ?? 0) + 1;
      if (p.subcategory) {
        const full = `${p.category} > ${p.subcategory}`;
        counts[full] = (counts[full] ?? 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const filterTree = useMemo(
    () => buildCategoryFilterTree(CATEGORY_TREE, productCounts),
    [productCounts],
  );

  const flatFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return FLAT_CATEGORIES.filter(item =>
      item.path.toLowerCase().includes(q) || item.label.toLowerCase().includes(q),
    );
  }, [query]);

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const s = new Set(prev);
      if (s.has(path)) s.delete(path); else s.add(path);
      return s;
    });
  };

  const totalCount = products.length;
  const selectedLabel = value === 'all'
    ? 'Catégories'
    : value
    ? value.split(' > ').pop() ?? value
    : 'Catégories';
  const isFiltered = value !== 'all' && value !== '';

  const renderTreeNode = (node: CategoryFilterNode): React.ReactNode => {
    if (node.count === 0) return null;
    const isExpanded = expanded.has(node.path);
    const isSelected = value === node.path;
    const hasChildren = node.children.length > 0;
    const indent = node.depth * 14;

    return (
      <div key={node.path}>
        <div
          style={{ paddingLeft: `${8 + indent}px` }}
          className={cn(
            'flex items-center gap-1 pr-2 py-1.5 hover:bg-[#E8F5E9] transition-colors group',
            isSelected && '!bg-[#F1F8E9]',
          )}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); toggleExpand(node.path); }}
              className="w-4 h-4 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-700 flex-shrink-0"
            >
              {isExpanded
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRightIcon className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
              <span className={cn('w-1.5 h-1.5 rounded-full', isSelected ? 'bg-[#1a4731]' : 'bg-zinc-300')} />
            </span>
          )}

          <button
            type="button"
            onClick={() => { onChange(node.path); setOpen(false); setQuery(''); }}
            className={cn(
              'flex-1 text-left text-xs flex items-center gap-1.5 min-w-0',
              node.depth === 0 ? 'font-bold text-zinc-900' : node.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500',
              isSelected && '!text-[#1a4731]',
            )}
          >
            {node.depth === 0 && (
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS[node.label] ?? '#888' }}
              />
            )}
            <span className="truncate">{node.label}</span>
          </button>

          <span className={cn(
            'text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0',
            isSelected ? 'bg-[#1a4731] text-white' : 'bg-zinc-100 text-zinc-500',
          )}>
            {node.count}
          </span>

          {isSelected && !hasChildren && (
            <Check className="w-3 h-3 text-[#1a4731] flex-shrink-0" />
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) setExpanded(new Set()); }}
        className={cn(
          'flex items-center justify-between rounded-lg border font-medium bg-white transition-all outline-none whitespace-nowrap h-8 px-3 text-xs gap-1.5',
          isFiltered
            ? 'border-[#1a4731] bg-[#E8F5E9] text-[#1a4731]'
            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50',
        )}
      >
        <span className="truncate max-w-[120px]">{selectedLabel}</span>
        <ChevronsUpDown className="w-3 h-3 flex-shrink-0 text-zinc-400" />
      </button>

      {open && portalStyle && createPortal(
        <div
          ref={dropdownRef}
          style={portalStyle}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown"
        >
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                autoFocus
                placeholder="Rechercher catégorie…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                className="w-full h-8 pl-7 pr-2 text-xs border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange('all'); setOpen(false); setQuery(''); }}
              className={cn(
                'w-full px-3 py-2 text-left text-xs flex items-center justify-between border-b border-zinc-50 hover:bg-[#E8F5E9] transition-colors',
                value === 'all' && 'bg-[#F1F8E9] text-[#1a4731] font-bold',
              )}
            >
              <span className={cn('font-semibold', value === 'all' ? 'text-[#1a4731]' : 'text-zinc-700')}>Toutes catégories</span>
              <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', value === 'all' ? 'bg-[#1a4731] text-white' : 'bg-zinc-100 text-zinc-500')}>{totalCount}</span>
            </button>

            {query.trim() ? (
              flatFiltered.length === 0 ? (
                <p className="px-3 py-3 text-xs text-zinc-400 italic text-center">Aucun résultat</p>
              ) : (
                flatFiltered.map((item, idx) => {
                  const isSelected = value === item.path;
                  const indent     = item.depth * 14;
                  return (
                    <button
                      key={`flat-${item.path}-${idx}`}
                      type="button"
                      onClick={() => { onChange(item.path); setOpen(false); setQuery(''); }}
                      style={{ paddingLeft: `${10 + indent}px` }}
                      className={cn(
                        'w-full pr-3 py-1.5 text-left text-xs flex items-center gap-1.5 hover:bg-[#E8F5E9] transition-colors',
                        isSelected && '!bg-[#F1F8E9] text-[#1a4731]',
                        item.depth === 0 ? 'font-bold text-zinc-900' : item.depth === 1 ? 'font-semibold text-zinc-700' : 'font-medium text-zinc-500',
                      )}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-[#1a4731] flex-shrink-0" />}
                    </button>
                  );
                })
              )
            ) : (
              filterTree.map(node => renderTreeNode(node))
            )}
          </div>

          {isFiltered && (
            <div className="border-t border-zinc-100 p-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => { onChange('all'); setOpen(false); }}
                className="w-full flex items-center justify-center gap-1 h-7 text-[10px] font-medium text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" /> Effacer la sélection
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ══════════════════════════════════════ FILTER SELECT GÉNÉRIQUE ═══════════════════

interface FilterOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  depth?: number;
  isRoot?: boolean;
  isMid?: boolean;
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…',
  dropdownWidth = 240,
  compact = false,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  dropdownWidth?: number;
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef        = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const portalStyle       = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, dropdownWidth);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        triggerRef.current?.contains(e.target as Node) === false
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(
    () => options.filter(o => o.label.toLowerCase().includes(query.toLowerCase())),
    [options, query],
  );

  const selectedLabel = options.find(o => o.value === value)?.label ?? placeholder;
  const isFiltered    = value !== '' && value !== 'all';

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center justify-between rounded-lg border font-medium bg-white transition-all outline-none whitespace-nowrap',
          compact ? 'h-8 px-3 text-xs gap-1.5' : 'h-9 px-3 text-sm gap-2',
          isFiltered
            ? 'border-[#1a4731] bg-[#E8F5E9] text-[#1a4731]'
            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50',
        )}
      >
        <span className="truncate max-w-[130px]">{selectedLabel}</span>
        <ChevronsUpDown className={cn('flex-shrink-0 text-zinc-400', compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      </button>

      {open && portalStyle && createPortal(
        <div
          ref={dropdownRef}
          style={portalStyle}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown"
        >
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                autoFocus
                placeholder={searchPlaceholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                className="w-full h-8 pl-7 pr-2 text-xs border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-zinc-400 italic text-center">Aucun résultat</p>
            )}
            {filtered.map(opt => {
              const isSelected = value === opt.value;
              const isRoot     = opt.isRoot;
              const isMid      = opt.isMid;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                  className={cn(
                    'w-full text-left text-xs flex items-center gap-2 hover:bg-[#E8F5E9] transition-colors',
                    isRoot
                      ? 'px-3 py-2.5 font-bold text-zinc-900 border-b border-zinc-50 bg-zinc-50/50'
                      : isMid
                        ? 'pl-6 pr-3 py-2 font-semibold text-zinc-700'
                        : 'px-3 py-2 font-medium text-zinc-700',
                    isSelected && 'text-[#1a4731] !bg-[#F1F8E9] font-bold',
                  )}
                >
                  <span className="flex-1 truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0', opt.badgeColor ?? 'bg-zinc-100 text-zinc-500')}>
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#1a4731] flex-shrink-0 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ══════════════════════════════════════ LOCATION SELECT ═══════════════════════════

function LocationSelect({
  value, onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef        = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const portalStyle       = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 260);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        triggerRef.current?.contains(e.target as Node) === false
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(
    () => MOCK_LOCATIONS.filter(l => l.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between h-9 px-3 rounded-xl border text-sm font-medium bg-white transition-all outline-none',
          'border-zinc-200 hover:border-[#1a4731] focus:border-[#1a4731]',
          value ? 'text-zinc-900' : 'text-zinc-400',
        )}
      >
        <span className="truncate flex-1 text-left">{value || 'Sélectionner un emplacement…'}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 ml-2" />
      </button>

      {open && portalStyle && createPortal(
        <div
          ref={dropdownRef}
          style={portalStyle}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown"
        >
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                autoFocus
                placeholder="Rechercher un emplacement…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                className="w-full h-8 pl-7 pr-2 text-xs border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className="w-full px-3 py-2 text-left text-xs text-zinc-400 italic hover:bg-zinc-50 transition-colors"
            >
              Non défini
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-zinc-400 italic text-center">Aucun résultat</p>
            )}
            {filtered.map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => { onChange(loc); setOpen(false); setQuery(''); }}
                className={cn(
                  'w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#E8F5E9] transition-colors',
                  value === loc ? 'font-bold text-[#1a4731] bg-[#F1F8E9]' : 'text-zinc-700',
                )}
              >
                <MapPin className="w-3 h-3 flex-shrink-0 text-zinc-400" />
                <span className="flex-1 truncate">{loc}</span>
                {value === loc && <Check className="w-3.5 h-3.5 text-[#1a4731] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ══════════════════════════════════════ SUPPLIER SELECT ═══════════════════════════

function SupplierSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef        = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const portalStyle       = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 300);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        triggerRef.current?.contains(e.target as Node) === false
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = useMemo(
    () => MOCK_SUPPLIERS.filter(s => s.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full flex items-center justify-between h-9 px-3 rounded-xl border text-sm font-medium bg-white transition-all outline-none',
          'border-zinc-200 hover:border-[#1a4731] focus:border-[#1a4731]',
          value ? 'text-zinc-900' : 'text-zinc-400',
        )}
      >
        <span className="truncate flex-1 text-left">{value || 'Sélectionner un fournisseur…'}</span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 ml-2" />
      </button>

      {open && portalStyle && createPortal(
        <div
          ref={dropdownRef}
          style={portalStyle}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden flex flex-col my-portal-dropdown"
        >
          <div className="p-2 border-b border-zinc-100 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                autoFocus
                placeholder="Rechercher un fournisseur…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.stopPropagation()}
                className="w-full h-8 pl-7 pr-2 text-xs border border-zinc-200 rounded-lg bg-zinc-50 outline-none focus:border-[#1a4731]"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setQuery(''); }}
              className="w-full px-3 py-2 text-left text-xs text-zinc-400 italic hover:bg-zinc-50 transition-colors"
            >
              Non défini
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-zinc-400 italic text-center">Aucun résultat</p>
            )}
            {filtered.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false); setQuery(''); }}
                className={cn(
                  'w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#E8F5E9] transition-colors',
                  value === s ? 'font-bold text-[#1a4731] bg-[#F1F8E9]' : 'font-medium text-zinc-700',
                )}
              >
                <span className="flex-1 truncate">{s}</span>
                {value === s && <Check className="w-3.5 h-3.5 text-[#1a4731] flex-shrink-0 ml-auto" />}
              </button>
            ))}
            {query && !MOCK_SUPPLIERS.some(s => s.toLowerCase() === query.toLowerCase()) && (
              <button
                type="button"
                onClick={() => { onChange(query); setOpen(false); setQuery(''); }}
                className="w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#1a4731]/10 text-[#1a4731] font-medium border-t border-zinc-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter «&nbsp;{query}&nbsp;»
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

// ══════════════════════════════════════ DATE RANGE PICKER ═════════════════════════

function DateRangePicker({
  dateDebut, dateFin, onDebutChange, onFinChange,
}: {
  dateDebut: string; dateFin: string;
  onDebutChange: (v: string) => void; onFinChange: (v: string) => void;
}) {
  const [open, setOpen]   = useState(false);
  const triggerRef        = useRef<HTMLButtonElement>(null);
  const dropdownRef       = useRef<HTMLDivElement>(null);
  const portalStyle       = usePortalPosition(open, triggerRef as React.RefObject<HTMLElement>, 300);
  const hasFilter         = !!(dateDebut || dateFin);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current?.contains(e.target as Node) === false &&
        triggerRef.current?.contains(e.target as Node) === false
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const applyPreset = (preset: string) => {
    const now = new Date();
    let start = '', end = '';
    switch (preset) {
      case 'thisMonth':
        start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        end   = toYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
        break;
      case 'thisYear':
        start = `${now.getFullYear()}-01-01`;
        end   = toYMD(now);
        break;
      case 'lastYear':
        start = `${now.getFullYear() - 1}-01-01`;
        end   = `${now.getFullYear() - 1}-12-31`;
        break;
    }
    onDebutChange(start); onFinChange(end);
  };

  const label = useMemo(() => {
    if (!dateDebut && !dateFin) return 'Période';
    if (dateDebut && dateFin) return `${dateDebut} → ${dateFin}`;
    if (dateDebut) return `Depuis ${dateDebut}`;
    return `Jusqu'au ${dateFin}`;
  }, [dateDebut, dateFin]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-all whitespace-nowrap outline-none',
          hasFilter ? 'border-[#1a4731] bg-[#E8F5E9] text-[#1a4731]' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300',
        )}
      >
        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronsUpDown className="w-3 h-3 text-zinc-400 flex-shrink-0" />
      </button>

      {open && portalStyle && createPortal(
        <div
          ref={dropdownRef}
          style={{ ...portalStyle, width: 300 }}
          className="bg-white border border-zinc-200 rounded-xl shadow-2xl p-3 space-y-3 my-portal-dropdown"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Filtrer par date</p>
          <div className="flex flex-wrap gap-1.5">
            {[['Ce mois', 'thisMonth'], ['Cette année', 'thisYear'], ['Année dernière', 'lastYear']].map(([lbl, key]) => (
              <button key={key} type="button" onClick={() => applyPreset(key)}
                className="px-2.5 py-1 rounded-lg border border-zinc-200 bg-zinc-50 text-[10px] font-medium text-zinc-600 hover:bg-[#E8F5E9] hover:border-[#1a4731]/40 hover:text-[#1a4731] transition-colors">
                {lbl}
              </button>
            ))}
          </div>
          <div className="space-y-2 border-t border-zinc-100 pt-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500">Date début</label>
              <input type="date" value={dateDebut} onChange={e => onDebutChange(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-[#1a4731]" />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-500">Date fin</label>
              <input type="date" value={dateFin} min={dateDebut} onChange={e => onFinChange(e.target.value)}
                className="w-full h-8 px-2 text-xs border border-zinc-200 rounded-lg outline-none focus:border-[#1a4731]" />
            </div>
          </div>
          {hasFilter && (
            <button type="button"
              onClick={() => { onDebutChange(''); onFinChange(''); setOpen(false); }}
              className="w-full flex items-center justify-center gap-1.5 h-7 text-[10px] font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-100 transition-colors">
              <X className="w-3 h-3" /> Effacer la période
            </button>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ══════════════════════════════════════ EXPORT MENU ════════════════════════════════

function ExportMenu({ onExcel, onPDF, onCSV, disabled }: {
  onExcel: () => void; onPDF: () => Promise<void>; onCSV: () => void; disabled: boolean;
}) {
  const [open, setOpen]             = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handlePDF = async () => {
    setPdfLoading(true);
    try { await onPDF(); } finally { setPdfLoading(false); setOpen(false); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'h-8 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-600 text-xs font-medium flex items-center gap-1.5 transition-all hover:bg-zinc-50 hover:border-zinc-300',
          disabled && 'opacity-40 cursor-not-allowed',
        )}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Exporter</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && !disabled && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden">
          <button onClick={() => { onCSV(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-zinc-50 transition-colors text-zinc-700 font-medium">
            <FileDown className="w-4 h-4 text-emerald-600" /> CSV (UTF-8)
          </button>
          <button onClick={() => { onExcel(); setOpen(false); }}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-zinc-50 transition-colors text-zinc-700 font-medium">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" /> Excel (.xlsx)
          </button>
          <button disabled={pdfLoading} onClick={handlePDF}
            className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 hover:bg-zinc-50 transition-colors text-zinc-700 font-medium disabled:opacity-50">
            {pdfLoading ? <RefreshCw className="w-4 h-4 text-red-600 animate-spin" /> : <FileText className="w-4 h-4 text-red-600" />}
            {pdfLoading ? 'Génération…' : 'Rapport PDF'}
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════ STATUS PILL ════════════════════════════════

function StatusPill({ status, size = 'default' }: { status: StockStatus; size?: 'sm' | 'default' }) {
  const isSm = size === 'sm';
  const base = cn('inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide', isSm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs');
  if (status === 'critique') return (
    <span className={cn(base, 'bg-red-50 text-red-600 border border-red-100')}>
      <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />Rupture
    </span>
  );
  if (status === 'faible') return (
    <span className={cn(base, 'bg-amber-50 text-amber-600 border border-amber-100')}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Faible
    </span>
  );
  return (
    <span className={cn(base, 'bg-emerald-50 text-emerald-600 border border-emerald-100')}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Normal
    </span>
  );
}

// ══════════════════════════════════════ STOCK BAR ═════════════════════════════════

function StockBar({ current, min }: { current: number; min: number }) {
  const max   = Math.max(min * 5, current * 1.2, 1);
  const pct   = Math.max(0, Math.min(100, (current / max) * 100));
  const color = current <= 0 ? '#ef4444' : current <= min ? '#f59e0b' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={cn('text-xs font-semibold tabular-nums min-w-[24px] text-right',
        current <= 0 ? 'text-red-500' : current <= min ? 'text-amber-500' : 'text-zinc-600')}>
        {current < 0 ? `(${current})` : current}
      </span>
    </div>
  );
}

// ══════════════════════════════════════ KPI CARD ══════════════════════════════════

function KpiCard({ icon: Icon, label, value, sub, colorBg, colorText, isActive, onClick, badge }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string;
  colorBg: string; colorText: string; isActive: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        'group bg-white rounded-2xl border-2 p-4 hover:shadow-lg transition-all duration-200 text-left w-full relative',
        isActive ? 'border-[#1a4731] ring-2 ring-[#1a4731]/20 shadow-md' : 'border-zinc-100 hover:border-zinc-200',
      )}>
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105', colorBg)}>
          <Icon className={cn('w-5 h-5', colorText)} />
        </div>
        {isActive && (
          <div className="w-4 h-4 rounded-full bg-[#1a4731] flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-zinc-900 mb-0.5">{value}</div>
      <div className="text-[11px] font-medium text-zinc-500">{label}</div>
      {sub && <div className="text-[9px] text-zinc-400 mt-0.5 font-mono">{sub}</div>}
    </button>
  );
}

// ══════════════════════════════════════ PANNEAU ANALYSE ═══════════════════════════

function AnalysePanel({ products }: { products: Product[] }) {
  const byCategory = useMemo(() => {
    const map: Record<string, { count: number; value: number; critique: number; faible: number }> = {};
    products.forEach(p => {
      const rootCat = p.category;
      if (!map[rootCat]) map[rootCat] = { count: 0, value: 0, critique: 0, faible: 0 };
      map[rootCat].count++;
      map[rootCat].value += Math.max(0, p.currentStock) * computePMP(p.movements ?? [], p.avgPrice);
      const s = getStockStatus(p);
      if (s === 'critique') map[rootCat].critique++;
      if (s === 'faible')   map[rootCat].faible++;
    });
    return Object.entries(map).map(([cat, data]) => ({ category: cat, ...data })).sort((a, b) => b.value - a.value);
  }, [products]);

  const totalValue = byCategory.reduce((s, c) => s + c.value, 0);

  const rotation = useMemo(() => {
    return products.map(p => {
      const totalIn  = (p.movements ?? []).filter(m => m.type === 'entree').reduce((s, m) => s + m.quantity, 0);
      const totalOut = (p.movements ?? []).filter(m => m.type === 'sortie').reduce((s, m) => s + m.quantity, 0);
      const score: RotationScore = totalOut === 0 ? 'lente' : totalOut > totalIn * 0.5 ? 'rapide' : 'normale';
      return { ...p, totalIn, totalOut, score };
    }).sort((a, b) => b.totalOut - a.totalOut);
  }, [products]);

  const abcAnalysis = useMemo(() => {
    const sorted = [...products]
      .map(p => ({
        ...p,
        pmp: computePMP(p.movements ?? [], p.avgPrice),
        stockValue: Math.max(0, p.currentStock) * computePMP(p.movements ?? [], p.avgPrice),
      }))
      .sort((a, b) => b.stockValue - a.stockValue);
    const total = sorted.reduce((s, p) => s + p.stockValue, 0);
    let cumul   = 0;
    return sorted.map(p => {
      cumul += p.stockValue;
      const pct = total > 0 ? (cumul / total) * 100 : 0;
      return { ...p, class: pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C' };
    });
  }, [products]);

  const abcCounts = useMemo(() => ({
    A: abcAnalysis.filter(p => p.class === 'A').length,
    B: abcAnalysis.filter(p => p.class === 'B').length,
    C: abcAnalysis.filter(p => p.class === 'C').length,
  }), [abcAnalysis]);

  const ROTATION_CFG: Record<RotationScore, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
    rapide:  { label: 'Rotation rapide',  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', Icon: TrendingUp   },
    normale: { label: 'Rotation normale', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100',       Icon: Minus        },
    lente:   { label: 'Rotation lente',   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100',     Icon: TrendingDown },
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-800">Valorisation par catégorie (PMP)</span>
          <span className="ml-auto text-xs font-semibold text-[#1a4731]">{fmtNumber(totalValue)} MAD</span>
        </div>
        <div className="p-5 space-y-3">
          {byCategory.map(({ category, value, count, critique, faible }) => {
            const pct   = totalValue > 0 ? (value / totalValue) * 100 : 0;
            const color = CATEGORY_COLORS[category] ?? '#888';
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-zinc-800">{category}</span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">{count} art.</span>
                    {critique > 0 && <span className="text-[10px] bg-red-50 text-red-600 rounded-full px-2 py-0.5 border border-red-100">{critique} rupture</span>}
                    {faible   > 0 && <span className="text-[10px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 border border-amber-100">{faible} faible</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-zinc-700">{fmtNumber(value)} MAD</span>
                    <span className="text-[10px] text-zinc-400 ml-1.5">{pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <Tag className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-800">Analyse ABC des stocks (valeur PMP)</span>
          <div className="ml-auto flex gap-2">
            {(['A', 'B', 'C'] as const).map(cls => (
              <span key={cls} className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full border',
                cls === 'A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : cls === 'B' ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-zinc-100 text-zinc-600 border-zinc-200')}>
                {cls}: {abcCounts[cls]}
              </span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-zinc-50">
          {abcAnalysis.slice(0, 8).map(p => (
            <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 transition-colors">
              <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                p.class === 'A' ? 'bg-emerald-100 text-emerald-700'
                : p.class === 'B' ? 'bg-amber-100 text-amber-700'
                : 'bg-zinc-100 text-zinc-500')}>
                {p.class}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-800 truncate">{p.name}</p>
                <p className="text-[10px] text-zinc-400">PMP : {fmtNumber(p.pmp)} MAD</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-zinc-700">{fmtNumber(p.stockValue)} MAD</p>
                <p className="text-[10px] text-zinc-400">{p.currentStock} unités</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-800">Analyse de rotation</span>
        </div>
        <div className="divide-y divide-zinc-50">
          {rotation.map(p => {
            const cfg = ROTATION_CFG[p.score];
            const Ico = cfg.Icon;
            return (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-50 transition-colors">
                <div className={cn('flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium border', cfg.bg, cfg.color)}>
                  <Ico className="w-3 h-3" />{cfg.label}
                </div>
                <p className="flex-1 text-sm font-medium text-zinc-800 truncate">{p.name}</p>
                <div className="text-right flex-shrink-0 text-xs text-zinc-500">
                  <span className="text-emerald-600 font-bold">+{p.totalIn}</span>
                  {' / '}
                  <span className="text-red-500 font-bold">-{p.totalOut}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════ DELETE CONFIRM MODAL ══════════════════════

function DeleteConfirmModal({ open, onOpenChange, productName, canDelete, blockedReason, onConfirm }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  productName: string; canDelete: boolean; blockedReason?: string; onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        className="sm:max-w-sm rounded-xl border border-zinc-200 shadow-xl bg-white p-6 [&>button.absolute]:hidden [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Confirmer la suppression</DialogTitle>
        <DialogHeader className="space-y-2 mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', canDelete ? 'bg-red-50' : 'bg-amber-50')}>
            <Trash2 className={cn('w-5 h-5', canDelete ? 'text-red-500' : 'text-amber-500')} />
          </div>
          <DialogTitle className="text-base font-semibold text-zinc-900">
            {canDelete ? 'Confirmer la suppression' : 'Suppression impossible'}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-zinc-500 space-y-2">
              {canDelete ? (
                <p>
                  Supprimer définitivement{' '}
                  <span className="font-medium text-zinc-800">«&nbsp;{productName}&nbsp;»</span> ?{' '}
                  Cette action est irréversible.
                </p>
              ) : (
                <>
                  <p className="font-semibold text-amber-700">Vous ne pouvez pas supprimer cet article.</p>
                  <p>{blockedReason}</p>
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:flex-row flex-col">
          <Button
            variant="outline"
            className="flex-1 rounded-lg h-9 text-sm font-medium border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            onClick={() => onOpenChange(false)}
          >
            {canDelete ? 'Annuler' : 'Fermer'}
          </Button>
          {canDelete && (
            <Button
              className="flex-1 rounded-lg h-9 bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
              onClick={onConfirm}
            >
              Supprimer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════ FORMULAIRE PRODUIT ════════════════════════

interface ProductFormState {
  code: string;
  name: string;
  categoryPath: string;
  location: string;
  currentStock: number;
  minThreshold: number;
  prixUnitaireHT: number;
  tvaPercent: number;
  pmp: number;
  imageUrl: string;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  consignable: boolean;
  supplier: string;
  warrantyMonths: number;
}

const DEFAULT_FORM: ProductFormState = {
  code: '', name: '',
  categoryPath: '',
  location: '',
  currentStock: 0,
  minThreshold: 20,
  prixUnitaireHT: 0,
  tvaPercent: 20,
  pmp: 0,
  imageUrl: '', description: '',
  weight: '', dimensions: '', material: '',
  safetyInstructions: '',
  consignable: false,
  supplier: '',
  warrantyMonths: 0,
};

function parseCategoryPath(path: string): { category: string; subcategory: string } {
  const parts = path.split(' > ').map(s => s.trim());
  if (parts.length === 0 || !parts[0]) return { category: 'Général', subcategory: '' };
  const category    = parts[0];
  const subcategory = parts.slice(1).join(' > ');
  return { category, subcategory };
}

function ProductFormModal({ open, onOpenChange, initialProduct, onSave, existingProducts }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  initialProduct?: Product | null;
  onSave: (p: ProductFormState) => void;
  existingProducts: Product[];
}) {
  const [form, setForm]               = useState<ProductFormState>(DEFAULT_FORM);
  const [imageMethod, setImageMethod] = useState<'url' | 'file'>('url');
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const showPriceFields = form.currentStock > 0;

  useEffect(() => {
    if (!showPriceFields) return;
    const computed = Math.round(form.prixUnitaireHT * (1 + form.tvaPercent / 100) * 100) / 100;
    setForm(prev => ({ ...prev, pmp: computed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.prixUnitaireHT, form.tvaPercent, showPriceFields]);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!form.name.trim())         errs.name         = 'Nom obligatoire';
    if (form.currentStock < 0)     errs.currentStock = 'Quantité ne peut pas être négative';
    if (form.minThreshold < 0)     errs.minThreshold = 'Seuil ne peut pas être négatif';
    if (showPriceFields && form.prixUnitaireHT < 0) errs.prixUnitaireHT = 'Prix ne peut pas être négatif';
    if (showPriceFields && (form.tvaPercent < 0 || form.tvaPercent > 100)) errs.tvaPercent = 'TVA doit être entre 0 et 100';
    if (!initialProduct) {
      if (existingProducts.some(p => p.code === form.code)) errs.code = 'Code déjà existant';
    }
    return errs;
  }, [form, initialProduct, existingProducts, showPriceFields]);

  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    if (!open) return;
    if (initialProduct) {
      const categoryPath = initialProduct.subcategory
        ? `${initialProduct.category} > ${initialProduct.subcategory}`
        : initialProduct.category;
      const avgP   = initialProduct.avgPrice ?? 0;
      const tva    = 20;
      const prixHT = avgP > 0 ? Math.round((avgP / (1 + tva / 100)) * 100) / 100 : 0;
      setForm({
        code: initialProduct.code,
        name: initialProduct.name,
        categoryPath,
        location: initialProduct.location ?? '',
        currentStock: initialProduct.currentStock,
        minThreshold: initialProduct.minThreshold,
        prixUnitaireHT: prixHT,
        tvaPercent: tva,
        pmp: avgP,
        imageUrl: initialProduct.imageUrl ?? '',
        description: initialProduct.description ?? '',
        weight: initialProduct.weight ?? '',
        dimensions: initialProduct.dimensions ?? '',
        material: initialProduct.material ?? '',
        safetyInstructions: initialProduct.safetyInstructions ?? '',
        consignable: initialProduct.consignable ?? false,
        supplier: initialProduct.supplier ?? '',
        warrantyMonths: initialProduct.warrantyMonths ?? 0,
      });
    } else {
      setForm({ ...DEFAULT_FORM, code: generateProductCode() });
    }
  }, [initialProduct, open]);

  const f  = (field: keyof ProductFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const fn = (field: keyof ProductFormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: Number(e.target.value) }));

  const handleSubmit = () => {
    if (hasErrors) { toast.error("Veuillez corriger les erreurs avant d'enregistrer."); return; }
    onSave(form);
    onOpenChange(false);
  };

  const inputCls = 'w-full border border-zinc-200 rounded-lg h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-zinc-900';
  const lbl      = 'text-xs font-medium text-zinc-500 mb-1.5 block';

  const SectionTitle = ({ title, icon: Icon }: { title: string; icon?: React.ElementType }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100">
      {Icon && <Icon className="w-3.5 h-3.5 text-zinc-400" />}
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{title}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-xl border border-zinc-200 shadow-2xl bg-white [&>button.absolute]:hidden [&>button]:hidden"
      >
        <DialogTitle className="sr-only">{initialProduct ? "Modifier l'article" : 'Nouvel article'}</DialogTitle>

        <div className="px-6 py-5 border-b border-zinc-100 sticky top-0 z-10 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#1a4731] flex items-center justify-center">
              {initialProduct ? <Edit className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {initialProduct ? "Modifier l'article" : 'Nouvel article'}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {initialProduct ? 'Mettez à jour les informations.' : 'Remplissez les champs pour créer cet article.'}
              </p>
            </div>
          </div>
          <button onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          <div>
            <SectionTitle title="Informations principales" icon={Info} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
              <div>
                <label className={lbl}>Code article</label>
                <input value={form.code} disabled
                  className={cn(inputCls, 'bg-zinc-50 text-zinc-400 font-mono cursor-not-allowed')} />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className={lbl}>Nom de l'article <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={f('name')} placeholder="Ex: Ramette papier A4…"
                  className={cn(inputCls, errors.name && 'border-red-400 focus:ring-red-300/30')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className={lbl}>
                  Catégorie
                  <span className="ml-2 text-[10px] text-zinc-400 normal-case font-normal">(optionnel, sélection multiniveau)</span>
                </label>
                <CategoryFormSelect
                  value={form.categoryPath}
                  onChange={path => setForm(prev => ({ ...prev, categoryPath: path }))}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={lbl}>Emplacement</label>
                <LocationSelect value={form.location} onChange={v => setForm(prev => ({ ...prev, location: v }))} />
              </div>

              <div className="sm:col-span-2">
                <label className={lbl}>Description</label>
                <Textarea value={form.description} onChange={f('description')} rows={2}
                  placeholder="Description détaillée de l'article…"
                  className="rounded-lg border-zinc-200 bg-white resize-none text-sm focus-visible:ring-[#1a4731]/20" />
              </div>
            </div>
          </div>

          <div>
            <SectionTitle title="Image" />
            <div className="flex gap-2 mb-3">
              {(['url', 'file'] as const).map(m => (
                <button key={m} type="button" onClick={() => setImageMethod(m)}
                  className={cn('text-xs font-medium px-3 py-1.5 rounded-lg border transition-all',
                    imageMethod === m ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300')}>
                  {m === 'url' ? 'URL externe' : 'Fichier local'}
                </button>
              ))}
            </div>
            {imageMethod === 'url' ? (
              <input value={form.imageUrl} onChange={f('imageUrl')} placeholder="https://…" className={inputCls} />
            ) : (
              <div onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-zinc-300 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all">
                <UploadCloud className="mx-auto w-6 h-6 text-zinc-300 mb-2" />
                <p className="text-sm font-medium text-zinc-600">Cliquez pour parcourir</p>
                <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG, WebP</p>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setForm(prev => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
                  }} />
              </div>
            )}
            {form.imageUrl && (
              <div className="mt-3 flex items-center gap-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <img src={form.imageUrl} alt="Aperçu" className="w-10 h-10 object-cover rounded-md border border-zinc-200"
                  onError={e => ((e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/40')} />
                <p className="text-xs font-medium text-zinc-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Image chargée
                </p>
              </div>
            )}
          </div>

          <div>
            <SectionTitle title="Stock" icon={Boxes} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Quantité en stock <span className="text-red-400">*</span></label>
                <input
                  type="number" min={0} value={form.currentStock} onChange={fn('currentStock')}
                  className={cn(
                    'w-full border border-zinc-200 rounded-lg h-9 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-center text-zinc-900',
                    errors.currentStock && 'border-red-400',
                  )}
                />
                {errors.currentStock && <p className="text-[10px] text-red-500 mt-0.5">{errors.currentStock}</p>}
              </div>

              <div>
                <label className={lbl}>Seuil d'alerte</label>
                <input
                  type="number" min={0} value={form.minThreshold} onChange={fn('minThreshold')}
                  className={cn(
                    'w-full border border-amber-200 rounded-lg h-9 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400/20 bg-white text-center text-amber-600',
                    errors.minThreshold && 'border-red-400',
                  )}
                />
                <p className="text-[10px] text-zinc-400 mt-0.5">Défaut : 20</p>
              </div>
            </div>

            {showPriceFields && (
              <div className="mt-5 p-4 rounded-xl bg-[#E8F5E9] border border-[#1a4731]/20 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calculator className="w-3.5 h-3.5 text-[#1a4731]" />
                  <p className="text-xs font-semibold text-[#1a4731] uppercase tracking-wider">Valorisation du stock</p>
                  <span className="text-[10px] text-zinc-400 ml-auto">Le PMP est recalculé automatiquement</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={cn(lbl, 'text-[#1a4731]')}>
                      Prix unitaire HT <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number" min={0} step={0.01}
                        value={form.prixUnitaireHT}
                        onChange={fn('prixUnitaireHT')}
                        className={cn(
                          'w-full border border-[#1a4731]/30 rounded-lg h-9 pl-3 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-zinc-900',
                          errors.prixUnitaireHT && 'border-red-400',
                        )}
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-zinc-400 font-medium pointer-events-none">MAD</span>
                    </div>
                    {errors.prixUnitaireHT && <p className="text-[10px] text-red-500 mt-0.5">{errors.prixUnitaireHT}</p>}
                  </div>

                  <div>
                    <label className={cn(lbl, 'text-[#1a4731]')}>TVA (%)</label>
                    <div className="relative">
                      <input
                        type="number" min={0} max={100} step={1}
                        value={form.tvaPercent}
                        onChange={fn('tvaPercent')}
                        className={cn(
                          'w-full border border-[#1a4731]/30 rounded-lg h-9 pl-3 pr-8 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-zinc-900 text-center',
                          errors.tvaPercent && 'border-red-400',
                        )}
                      />
                      <Percent className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                    </div>
                    {errors.tvaPercent && <p className="text-[10px] text-red-500 mt-0.5">{errors.tvaPercent}</p>}
                  </div>

                  <div>
                    <label className={cn(lbl, 'text-[#1a4731] font-bold')}>
                      PMP calculé
                      <span className="ml-1 text-[10px] text-zinc-400 font-normal normal-case">(modifiable)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number" min={0} step={0.01}
                        value={form.pmp}
                        onChange={fn('pmp')}
                        className="w-full border-2 border-[#1a4731] rounded-lg h-9 pl-3 pr-10 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white text-[#1a4731] text-center"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-[#1a4731] font-medium pointer-events-none">MAD</span>
                    </div>
                    <p className="text-[10px] text-[#1a4731]/70 mt-0.5 text-center">
                      = {fmtNumber(form.prixUnitaireHT)} × (1 + {form.tvaPercent}%)
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1a4731]/20">
                  <span className="text-xs text-[#1a4731] font-medium">Valeur stock estimée</span>
                  <span className="text-sm font-black text-[#1a4731]">
                    {fmtNumber(form.currentStock * form.pmp)} MAD
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100 mt-4">
              <Checkbox
                checked={form.consignable}
                onCheckedChange={checked => setForm(prev => ({ ...prev, consignable: !!checked }))}
                className="border-zinc-300 data-[state=checked]:bg-[#1a4731] data-[state=checked]:border-[#1a4731]"
              />
              <div>
                <p className="text-sm font-medium text-zinc-800">Article consignable</p>
                <p className="text-xs text-zinc-500">Restitution obligatoire après usage.</p>
              </div>
            </div>
          </div>

          <div>
            <SectionTitle title="Fournisseur" icon={Building2} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Fournisseur</label>
                <SupplierSelect value={form.supplier} onChange={v => setForm(prev => ({ ...prev, supplier: v }))} />
              </div>
              <div>
                <label className={lbl}>Garantie (mois)</label>
                <input type="number" min={0} value={form.warrantyMonths} onChange={fn('warrantyMonths')} className={inputCls} />
              </div>
            </div>
          </div>

          <div>
            <SectionTitle title="Informations complémentaires" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Poids</label>
                <input value={form.weight} onChange={f('weight')} placeholder="Ex: 1,5 kg" className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Dimensions</label>
                <input value={form.dimensions} onChange={f('dimensions')} placeholder="Ex: 20×10×5 cm" className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Matière / Composition</label>
                <input value={form.material} onChange={f('material')} placeholder="Ex: Plastique ABS" className={inputCls} />
              </div>
              <div>
                <label className={lbl}>Consignes de sécurité</label>
                <Textarea
                  value={form.safetyInstructions}
                  onChange={f('safetyInstructions')}
                  rows={2}
                  placeholder="Ex: Inflammable – tenir à l'écart des flammes…"
                  className="rounded-lg border-zinc-200 bg-white resize-none text-sm focus-visible:ring-[#1a4731]/20"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between sticky bottom-0 z-10">
          <p className="text-xs text-zinc-400">Les champs <span className="text-red-400">*</span> sont obligatoires.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}
              className="rounded-lg h-9 px-4 text-sm font-medium border-zinc-200 text-zinc-600 hover:bg-white">
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={hasErrors}
              className="rounded-lg h-9 px-5 bg-[#1a4731] hover:bg-[#153d28] text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {initialProduct ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════ DÉTAIL PRODUIT ════════════════════════════

function ProductDetailModal({ product, onAdjustStock, onClose, onEdit }: {
  product: Product;
  onAdjustStock: (id: number, qty: number, motif: string) => void;
  onClose: () => void;
  onEdit: () => void;
}) {
  const status    = getStockStatus(product);
  const movements = product.movements ?? [];

  const pmp          = useMemo(() => computePMP(movements, product.avgPrice), [movements, product.avgPrice]);
  const lastPurchase = useMemo(() => getLastPurchase(movements), [movements]);

  const lastPurchasePrice    = lastPurchase?.unitPrice ?? null;
  const lastPurchaseDate     = lastPurchase?.date ?? null;
  const lastPurchaseSupplier = lastPurchase?.supplierName ?? product.supplier ?? null;

  const { cumulQteEntree, cumulQteSortie, cumulValEntree, cumulValSortie } = useMemo(
    () => computeStockStats(movements),
    [movements],
  );

  const stockInitial = useMemo(() => {
    if (movements.length === 0) return product.currentStock;
    return movements[0].beforeStock;
  }, [movements, product.currentStock]);

  const valeurActuelle = useMemo(
    () => Math.max(0, product.currentStock) * pmp,
    [product.currentStock, pmp],
  );

  const [adjustValue, setAdjustValue] = useState<number>(product.currentStock);
  const [adjustMotif, setAdjustMotif] = useState<string>('');

  const canAdjust = adjustMotif.trim().length >= 3;

  const statusBg   = status === 'critique' ? 'bg-red-50 border-red-200' : status === 'faible' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';
  const statusText = status === 'critique' ? 'text-red-700' : status === 'faible' ? 'text-amber-700' : 'text-emerald-700';

  return (
    <>
      <div className="flex items-start justify-between px-6 py-5 border-b border-zinc-100 bg-white sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="font-semibold text-zinc-900 text-base leading-tight">{product.name}</h2>
            <StatusPill status={status} size="sm" />
            {product.consignable && (
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 font-medium">Consignable</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
            <span className="font-mono">{product.code}</span>
            <span>·</span>
            <span>{product.category}{product.subcategory ? ` / ${product.subcategory}` : ''}</span>
            {product.supplier && <><span>·</span><span>{product.supplier}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={onEdit}
            className="h-8 px-3 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-600 hover:bg-zinc-50 flex items-center gap-1.5 transition-colors">
            <Edit className="w-3.5 h-3.5" /> Modifier
          </button>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 bg-zinc-50/50 overflow-y-auto">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Cumuls depuis la création</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Stock initial',      value: fmtInt(stockInitial),        sub: 'unités', color: 'text-zinc-700',    bg: 'bg-zinc-50',     border: 'border-zinc-200'      },
                { label: 'Cumul qté entrées',  value: `+${fmtInt(cumulQteEntree)}`, sub: 'unités', color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200'   },
                { label: 'Cumul qté sorties',  value: `-${fmtInt(cumulQteSortie)}`, sub: 'unités', color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200'       },
                { label: 'Stock actuel',       value: fmtInt(product.currentStock), sub: 'unités', color: 'text-zinc-900',    bg: 'bg-white',       border: 'border-zinc-200'      },
                { label: 'Cumul val. entrées', value: fmtNumber(cumulValEntree),    sub: 'MAD',    color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200'   },
                { label: 'Cumul val. sorties', value: fmtNumber(cumulValSortie),    sub: 'MAD',    color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200'       },
                { label: 'Valeur stock (PMP)', value: fmtNumber(valeurActuelle),    sub: 'MAD',    color: 'text-[#1a4731]',  bg: 'bg-[#E8F5E9]',  border: 'border-[#1a4731]/30'  },
                { label: 'PMP calculé',        value: fmtNumber(pmp),              sub: 'MAD',    color: 'text-[#1a4731]',  bg: 'bg-[#E8F5E9]',  border: 'border-[#1a4731]/30'  },
              ].map(({ label, value, sub, color, bg, border }) => (
                <div key={label} className={cn('rounded-xl p-3 border text-center', bg, border)}>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">{label}</p>
                  <p className={cn('text-base font-black tabular-nums', color)}>{value}</p>
                  <p className="text-[10px] text-zinc-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 bg-white p-4 rounded-xl border border-zinc-100">
            <div className="w-20 h-20 rounded-lg border border-zinc-100 overflow-hidden flex-shrink-0 bg-zinc-50">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"
                  onError={e => ((e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/80')} />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-zinc-200" /></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-zinc-400 font-medium mb-1">Description</p>
              <p className="text-sm text-zinc-700 leading-relaxed">{product.description || 'Aucune description.'}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {product.supplier && (
                  <span className="text-[10px] bg-zinc-100 text-zinc-600 rounded-md px-2 py-0.5 font-medium flex items-center gap-1">
                    <Building2 className="w-2.5 h-2.5" />{product.supplier}
                  </span>
                )}
                {(product.warrantyMonths ?? 0) > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 rounded-md px-2 py-0.5 font-medium flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" />Garantie {product.warrantyMonths} mois
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">Spécifications techniques</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Emplacement', value: product.location || '—'    },
                { label: 'Poids',       value: product.weight  || '—'    },
                { label: 'Dimensions',  value: product.dimensions || '—' },
                { label: 'Matière',     value: product.material   || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-zinc-400 font-medium mb-0.5 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-zinc-800 font-medium">{value}</p>
                </div>
              ))}
            </div>
            {(product.warrantyMonths ?? 0) > 0 && (
              <div className="mb-4 flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800 font-medium">
                  Garantie : <strong>{product.warrantyMonths} mois</strong>
                </p>
              </div>
            )}
            {product.safetyInstructions && product.safetyInstructions !== 'Néant' && (
              <div className="pt-4 border-t border-zinc-50">
                <p className="text-[10px] text-zinc-400 font-medium mb-1.5 uppercase tracking-wide">Consignes de sécurité</p>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{product.safetyInstructions}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className={cn('p-4 rounded-xl border', statusBg)}>
            <p className={cn('text-xs font-medium mb-1', statusText)}>Stock disponible</p>
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className={cn('text-4xl font-semibold tabular-nums', statusText)}>{product.currentStock}</span>
              <span className={cn('text-sm', statusText)}>unités</span>
            </div>
            <div className="space-y-1.5 text-xs mt-3">
              {[
                { label: "Seuil d'alerte", value: product.minThreshold },
                { label: 'Dernière MAJ',   value: fmtDate(product.lastUpdated) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className={cn('opacity-70', statusText)}>{label}</span>
                  <span className={cn('font-semibold', statusText)}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <StockBar current={product.currentStock} min={product.minThreshold} />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Prix & Valorisation</p>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center p-2.5 bg-[#E8F5E9] rounded-lg">
                <div>
                  <p className="text-xs text-[#1a4731] font-semibold">PMP</p>
                  <p className="text-[10px] text-zinc-400">Pondéré sur les entrées</p>
                </div>
                <p className="text-base font-black text-[#1a4731]">{fmtNumber(pmp)} MAD</p>
              </div>

              {lastPurchasePrice !== null ? (
                <div className="flex justify-between items-center p-2.5 bg-zinc-50 rounded-lg border border-zinc-100">
                  <div>
                    <p className="text-xs text-zinc-600 font-semibold">Dernier achat</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {lastPurchaseSupplier && (
                        <span className="text-[9px] bg-zinc-200 text-zinc-600 rounded px-1.5 py-0.5 font-medium">
                          {lastPurchaseSupplier}
                        </span>
                      )}
                      {lastPurchaseDate && (
                        <span className="text-[9px] text-zinc-400">{fmtDate(lastPurchaseDate)}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-zinc-700">{fmtNumber(lastPurchasePrice)} MAD</p>
                </div>
              ) : (
                <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-100 text-center">
                  <p className="text-xs text-zinc-400 italic">Aucun achat enregistré</p>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-zinc-100">
                <p className="text-xs text-zinc-500">Valeur stock (PMP)</p>
                <p className="text-sm font-semibold text-[#1a4731]">{fmtNumber(valeurActuelle)} MAD</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-zinc-100">
            <p className="text-xs font-medium text-zinc-600 mb-3">Ajustement rapide du stock</p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase tracking-widest">
                  Nouvelle quantité <span className="text-red-400">*</span>
                </label>
                <input type="number" value={adjustValue}
                  onChange={e => setAdjustValue(Number(e.target.value))}
                  className="w-full border border-zinc-200 rounded-lg h-9 px-3 text-sm font-semibold text-center focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase tracking-widest">
                  Motif <span className="text-red-400">*</span>
                  <span className="normal-case tracking-normal text-zinc-400 font-normal ml-1">(min. 3 caractères)</span>
                </label>
                <input
                  value={adjustMotif}
                  onChange={e => setAdjustMotif(e.target.value)}
                  placeholder="Ex: Correction inventaire mensuel…"
                  className={cn(
                    'w-full border rounded-lg h-9 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#1a4731]/20 bg-white',
                    adjustMotif.trim().length > 0 && adjustMotif.trim().length < 3
                      ? 'border-red-300' : 'border-zinc-200',
                  )}
                />
                {adjustMotif.trim().length > 0 && adjustMotif.trim().length < 3 && (
                  <p className="text-[10px] text-red-500 mt-0.5">Le motif doit contenir au moins 3 caractères.</p>
                )}
              </div>
              <button
                disabled={!canAdjust}
                onClick={() => {
                  onAdjustStock(product.id, adjustValue, adjustMotif.trim());
                  setAdjustMotif('');
                  toast.success('Stock ajusté avec succès');
                }}
                className="w-full h-9 rounded-lg bg-[#1a4731] hover:bg-[#153d28] text-white text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                Valider l'ajustement
              </button>
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 text-center">
              Le motif est enregistré pour le suivi.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-6 py-4 border-t border-zinc-100 bg-white sticky bottom-0 z-10">
        <button onClick={onClose}
          className="h-9 px-5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
          Fermer
        </button>
      </div>
    </>
  );
}

// ══════════════════════════════════════ IMPORT MODAL EXPERT ══════════════════════

interface ImportRow {
  lineNumber: number;
  code: string;
  name: string;
  category: string;
  subcategory: string;
  location: string;
  currentStock: number;
  minThreshold: number;
  avgPrice: number;
  supplier: string;
  warrantyMonths: number;
  description: string;
  weight: string;
  dimensions: string;
  material: string;
  safetyInstructions: string;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

const COLUMN_ALIASES: Record<string, string[]> = {
  code:              ['code', 'ref', 'reference', 'sku', 'article'],
  name:              ['nom', 'designation', 'libelle', 'name', 'article', 'produit', 'description_courte'],
  category:          ['categorie', 'category', 'famille', 'famille_article'],
  subcategory:       ['sous_categorie', 'subcategory', 'sous_famille', 'type'],
  location:          ['emplacement', 'location', 'rayon', 'zone', 'localisation'],
  currentStock:      ['stock', 'quantite', 'qty', 'qte', 'current_stock', 'stock_actuel', 'stock_initial'],
  minThreshold:      ['seuil', 'seuil_alerte', 'min', 'min_stock', 'minimum', 'threshold'],
  avgPrice:          ['prix', 'price', 'pmp', 'prix_ht', 'prix_unitaire', 'tarif', 'cout'],
  supplier:          ['fournisseur', 'supplier', 'vendor', 'prestataire'],
  warrantyMonths:    ['garantie', 'warranty', 'warranty_months', 'garantie_mois'],
  description:       ['description', 'desc', 'details', 'remarques'],
  weight:            ['poids', 'weight', 'masse'],
  dimensions:        ['dimensions', 'taille', 'size', 'dim'],
  material:          ['matiere', 'material', 'composition', 'matériau'],
  safetyInstructions:['consignes', 'safety', 'securite', 'precautions'],
};

function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[éèêë]/g, 'e')
    .replace(/[àâä]/g, 'a')
    .replace(/[ùûü]/g, 'u')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/ç/g, 'c');
}

function mapRowToField(row: Record<string, unknown>, fieldKey: string): string {
  const aliases = COLUMN_ALIASES[fieldKey] ?? [fieldKey];
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (normalizeHeader(key) === normalizeHeader(alias)) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') return String(val).trim();
      }
    }
  }
  return '';
}

function validateImportRow(raw: Record<string, unknown>, lineNumber: number, existingCodes: Set<string>): ImportRow {
  const errors: string[]   = [];
  const warnings: string[] = [];

  const name = mapRowToField(raw, 'name');
  if (!name) errors.push('Désignation manquante (obligatoire)');

  const stockRaw     = mapRowToField(raw, 'currentStock');
  const currentStock = stockRaw !== '' ? Number(stockRaw) : 0;
  if (stockRaw !== '' && (isNaN(currentStock) || currentStock < 0)) {
    errors.push(`Quantité de stock invalide: "${stockRaw}" (doit être ≥ 0)`);
  }

  const code = mapRowToField(raw, 'code');
  if (!code) warnings.push('Code absent — sera auto-généré');
  else if (existingCodes.has(code)) errors.push(`Code "${code}" déjà présent dans le catalogue (importation bloquée)`);

  const category = mapRowToField(raw, 'category') || 'Général';
  if (!mapRowToField(raw, 'category')) warnings.push('Catégorie non définie — classée dans "Général"');

  const thresholdRaw  = mapRowToField(raw, 'minThreshold');
  const minThreshold  = thresholdRaw !== '' ? Number(thresholdRaw) : 20;
  if (thresholdRaw !== '' && (isNaN(minThreshold) || minThreshold < 0)) {
    warnings.push(`Seuil invalide "${thresholdRaw}" → valeur par défaut 20 appliquée`);
  }

  const priceRaw = mapRowToField(raw, 'avgPrice');
  const avgPrice = priceRaw !== '' ? Number(priceRaw) : 0;
  if (priceRaw !== '' && (isNaN(avgPrice) || avgPrice < 0)) {
    warnings.push(`Prix invalide "${priceRaw}" → 0 appliqué`);
  }

  const warrantyRaw   = mapRowToField(raw, 'warrantyMonths');
  const warrantyMonths = warrantyRaw !== '' ? Number(warrantyRaw) : 0;

  return {
    lineNumber,
    code:               code || '',
    name:               name || '',
    category,
    subcategory:        mapRowToField(raw, 'subcategory'),
    location:           mapRowToField(raw, 'location'),
    currentStock:       isNaN(currentStock) || currentStock < 0 ? 0 : currentStock,
    minThreshold:       isNaN(minThreshold)  || minThreshold  < 0 ? 20 : minThreshold,
    avgPrice:           isNaN(avgPrice)      || avgPrice      < 0 ? 0  : avgPrice,
    supplier:           mapRowToField(raw, 'supplier'),
    warrantyMonths:     isNaN(warrantyMonths) ? 0 : warrantyMonths,
    description:        mapRowToField(raw, 'description'),
    weight:             mapRowToField(raw, 'weight'),
    dimensions:         mapRowToField(raw, 'dimensions'),
    material:           mapRowToField(raw, 'material'),
    safetyInstructions: mapRowToField(raw, 'safetyInstructions'),
    errors,
    warnings,
    isValid:            errors.length === 0,
  };
}

async function parseFileToRows(file: File): Promise<Record<string, unknown>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    const text    = await file.text();
    const content = text.replace(/^\uFEFF/, '');
    const lines   = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new Error('Le fichier CSV est vide ou ne contient qu\'une ligne d\'en-tête');

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
          result.push(current.trim()); current = '';
        } else {
          current += line[i];
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h.trim()] = values[i] ?? ''; });
      return obj;
    }).filter(row => Object.values(row).some(v => String(v ?? '').trim() !== ''));

  } else if (ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx');
    const buf  = await file.arrayBuffer();
    const wb   = XLSX.read(buf, { type: 'array' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  } else {
    throw new Error(`Format non supporté : ".${ext}". Utilisez .csv ou .xlsx`);
  }
}

function ImportModal({
  open,
  onOpenChange,
  existingProducts,
  onImportConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existingProducts: Product[];
  onImportConfirm: (rows: ImportRow[]) => void;
}) {
  type ImportStep = 'upload' | 'preview' | 'done';

  const [step, setStep]               = useState<ImportStep>('upload');
  const [loading, setLoading]         = useState(false);
  const [isDragOver, setIsDragOver]   = useState(false);
  const [parsedRows, setParsedRows]   = useState<ImportRow[]>([]);
  const [fileName, setFileName]       = useState('');
  const [parseError, setParseError]   = useState('');
  const [importResult, setImportResult] = useState({ imported: 0, skipped: 0, warnings: 0 });

  const existingCodes = useMemo(
    () => new Set(existingProducts.map(p => p.code)),
    [existingProducts],
  );

  const validRows   = parsedRows.filter(r => r.isValid);
  const invalidRows = parsedRows.filter(r => !r.isValid);
  const warnRows    = parsedRows.filter(r => r.isValid && r.warnings.length > 0);

  const reset = useCallback(() => {
    setStep('upload');
    setParsedRows([]);
    setFileName('');
    setParseError('');
    setLoading(false);
    setImportResult({ imported: 0, skipped: 0, warnings: 0 });
  }, []);

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const processFile = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setParseError('Le fichier dépasse la limite de 5 Mo');
      return;
    }
    setLoading(true);
    setParseError('');
    try {
      const rawRows = await parseFileToRows(file);
      if (rawRows.length === 0) throw new Error('Aucune ligne de données trouvée dans le fichier');
      if (rawRows.length > 500) throw new Error(`Trop de lignes : ${rawRows.length} détectées (max 500 par import)`);

      const validated = rawRows.map((row, i) => validateImportRow(row, i + 2, existingCodes));
      setParsedRows(validated);
      setFileName(file.name);
      setStep('preview');
    } catch (err: unknown) {
      setParseError(err instanceof Error ? err.message : 'Erreur inconnue lors de l\'analyse du fichier');
    } finally {
      setLoading(false);
    }
  }, [existingCodes]);

  const handleConfirmImport = useCallback(() => {
    const toImport = validRows;
    onImportConfirm(toImport);
    setImportResult({
      imported: toImport.length,
      skipped:  invalidRows.length,
      warnings: warnRows.length,
    });
    setStep('done');
  }, [validRows, invalidRows, warnRows, onImportConfirm]);

  const downloadTemplate = useCallback(() => {
    const headers = 'code,nom,categorie,sous_categorie,emplacement,stock,seuil,prix,fournisseur,garantie,description,poids,dimensions,matiere,consignes';
    const example = 'PRD-100001,Ramette papier A4,Fournitures bureau,Papeterie > Papier & supports,Rayon A - A1,200,50,18.50,Acme Fournitures,0,Papier 80g qualité supérieure,2.5 kg,21x29.7 cm,Cellulose,Conserver à l\'abri de l\'humidité';
    const blob = new Blob(['\uFEFF' + headers + '\r\n' + example], { type: 'text/csv;charset=utf-8;' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'modele_import_articles.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Modèle CSV téléchargé');
  }, []);

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent
        onInteractOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if ((e.target as Element).closest?.('.my-portal-dropdown')) e.preventDefault();
        }}
        className="sm:max-w-2xl rounded-2xl p-0 border-zinc-100 max-h-[90vh] flex flex-col [&>button.absolute]:hidden [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Importer des articles</DialogTitle>

        <div className="px-6 py-4 border-b border-zinc-100 bg-white rounded-t-2xl flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a4731] flex items-center justify-center flex-shrink-0">
              <UploadCloud className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">Importer des articles</h2>
              <p className="text-xs text-zinc-500">
                {step === 'upload'  && 'Chargez un fichier Excel ou CSV'}
                {step === 'preview' && `${parsedRows.length} ligne(s) analysée(s) — ${validRows.length} valide(s)`}
                {step === 'done'    && `Import terminé : ${importResult.imported} article(s) ajouté(s)`}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center px-6 py-3 bg-zinc-50 border-b border-zinc-100 gap-2 flex-shrink-0">
          {([
            { id: 'upload',  label: '1. Fichier'   },
            { id: 'preview', label: '2. Vérification' },
            { id: 'done',    label: '3. Résultat'  },
          ] as { id: ImportStep; label: string }[]).map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className={cn(
                'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                step === s.id ? 'bg-[#1a4731] text-white' : 'text-zinc-400',
              )}>
                <span className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black',
                  step === s.id ? 'bg-white text-[#1a4731]' : 'bg-zinc-200 text-zinc-500',
                )}>{idx + 1}</span>
                {s.label}
              </div>
              {idx < 2 && <ChevronRightIcon className="w-3 h-3 text-zinc-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">

          {step === 'upload' && (
            <div className="p-6 space-y-4">
              <div
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group',
                  isDragOver ? 'border-[#1a4731] bg-[#E8F5E9]' : 'border-zinc-200 bg-zinc-50 hover:bg-[#E8F5E9] hover:border-[#1a4731]',
                  loading && 'pointer-events-none opacity-60',
                )}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault(); setIsDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) processFile(file);
                }}
                onClick={() => {
                  if (loading) return;
                  const input = document.createElement('input');
                  input.type = 'file'; input.accept = '.csv,.xlsx,.xls';
                  input.onchange = e => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) processFile(file);
                  };
                  input.click();
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  {loading
                    ? <Loader2 className="w-7 h-7 text-[#1a4731] animate-spin" />
                    : <UploadCloud className="w-7 h-7 text-[#1a4731]" />}
                </div>
                <h3 className="text-sm font-bold text-zinc-900 mb-1">
                  {loading ? 'Analyse en cours…' : isDragOver ? 'Relâchez le fichier…' : 'Cliquez ou glissez votre fichier'}
                </h3>
                <p className="text-xs text-zinc-500">.xlsx, .xls, .csv — Max 5 Mo · 500 lignes max</p>
              </div>

              {parseError && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{parseError}</p>
                </div>
              )}

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Champs obligatoires</p>
                </div>
                <div className="space-y-1">
                  {[
                    { field: 'nom / designation', desc: 'Désignation de l\'article' },
                  ].map(({ field, desc }) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                      <code className="text-[10px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{field}</code>
                      <span className="text-[10px] text-amber-700">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <p className="text-xs font-semibold text-zinc-600">Colonnes reconnues (optionnelles sauf nom)</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { col: 'code / ref / sku',                label: 'Référence article'  },
                    { col: 'nom / designation / libelle',     label: 'Désignation ★'      },
                    { col: 'categorie / famille',             label: 'Catégorie'           },
                    { col: 'sous_categorie',                  label: 'Sous-catégorie'      },
                    { col: 'stock / quantite / qty',          label: 'Quantité en stock'   },
                    { col: 'seuil / min',                     label: 'Seuil d\'alerte'     },
                    { col: 'prix / pmp / prix_ht',            label: 'Prix unitaire'       },
                    { col: 'fournisseur / supplier',          label: 'Fournisseur'         },
                    { col: 'emplacement / location',          label: 'Emplacement'         },
                    { col: 'garantie / warranty_months',      label: 'Garantie (mois)'     },
                    { col: 'description',                     label: 'Description'         },
                    { col: 'poids / weight',                  label: 'Poids'               },
                  ].map(({ col, label }) => (
                    <div key={col} className="flex items-start gap-1.5">
                      <span className={cn('text-[9px] font-black flex-shrink-0 mt-0.5', label.includes('★') ? 'text-amber-500' : 'text-zinc-400')}>
                        {label.includes('★') ? '★' : '·'}
                      </span>
                      <div>
                        <code className="text-[9px] font-mono text-zinc-700 bg-zinc-100 px-1 py-0.5 rounded">{col}</code>
                        <span className="text-[9px] text-zinc-400 ml-1">{label.replace(' ★', '')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-[#1a4731] hover:border-[#1a4731] transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Télécharger le modèle CSV
              </button>
            </div>
          )}

          {step === 'preview' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-xl font-black text-emerald-700">{validRows.length}</p>
                  <p className="text-[10px] font-semibold text-emerald-600">Valide(s)</p>
                </div>
                <div className={cn('p-3 rounded-xl border text-center', invalidRows.length > 0 ? 'bg-red-50 border-red-100' : 'bg-zinc-50 border-zinc-100')}>
                  <p className={cn('text-xl font-black', invalidRows.length > 0 ? 'text-red-700' : 'text-zinc-400')}>{invalidRows.length}</p>
                  <p className={cn('text-[10px] font-semibold', invalidRows.length > 0 ? 'text-red-600' : 'text-zinc-400')}>Invalide(s)</p>
                </div>
                <div className={cn('p-3 rounded-xl border text-center', warnRows.length > 0 ? 'bg-amber-50 border-amber-100' : 'bg-zinc-50 border-zinc-100')}>
                  <p className={cn('text-xl font-black', warnRows.length > 0 ? 'text-amber-700' : 'text-zinc-400')}>{warnRows.length}</p>
                  <p className={cn('text-[10px] font-semibold', warnRows.length > 0 ? 'text-amber-600' : 'text-zinc-400')}>Avec avertis.</p>
                </div>
              </div>

              {validRows.length === 0 && (
                <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">
                    Aucune ligne valide. Corrigez votre fichier et réessayez.
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Prévisualisation — {parsedRows.length} ligne(s) · fichier : {fileName}
                  </p>
                  <p className="text-[10px] text-zinc-400">Seules les lignes valides seront importées</p>
                </div>
                <div className="max-h-60 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-zinc-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap">Ligne</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Désignation</th>
                        <th className="px-3 py-2 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Catégorie</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stock</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Seuil</th>
                        <th className="px-3 py-2 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {parsedRows.map(row => (
                        <tr key={row.lineNumber} className={cn(
                          'hover:bg-zinc-50 transition-colors',
                          !row.isValid && 'bg-red-50/60',
                        )}>
                          <td className="px-3 py-2 text-zinc-400 font-mono">{row.lineNumber}</td>
                          <td className="px-3 py-2 font-medium text-zinc-800 max-w-[160px] truncate">
                            {row.name || <span className="italic text-red-400">manquant</span>}
                          </td>
                          <td className="px-3 py-2 text-zinc-500 max-w-[120px] truncate">{row.category}</td>
                          <td className="px-3 py-2 text-center font-semibold text-zinc-700">{row.currentStock}</td>
                          <td className="px-3 py-2 text-center text-zinc-500">{row.minThreshold}</td>
                          <td className="px-3 py-2 text-center">
                            {!row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
                                <X className="w-2.5 h-2.5" />
                                {row.errors.length} erreur(s)
                              </span>
                            ) : row.warnings.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {row.warnings.length} avert.
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                                <Check className="w-2.5 h-2.5" />OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 space-y-2">
                  <p className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Lignes avec erreurs (seront ignorées)
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {invalidRows.map(row => (
                      <div key={row.lineNumber} className="text-[10px] text-red-600">
                        <span className="font-bold">Ligne {row.lineNumber} :</span>{' '}
                        {row.errors.join(' · ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warnRows.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Avertissements (lignes importées avec valeurs corrigées)
                  </p>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {warnRows.map(row => (
                      <div key={row.lineNumber} className="text-[10px] text-amber-700">
                        <span className="font-bold">Ligne {row.lineNumber} :</span>{' '}
                        {row.warnings.join(' · ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 mb-1">Import terminé</h3>
                <p className="text-sm text-zinc-500">
                  {importResult.imported} article(s) ajouté(s) avec succès
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-xl font-black text-emerald-700">{importResult.imported}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Importé(s)</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                  <p className="text-xl font-black text-red-600">{importResult.skipped}</p>
                  <p className="text-[10px] text-red-500 font-semibold">Ignoré(s)</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                  <p className="text-xl font-black text-amber-700">{importResult.warnings}</p>
                  <p className="text-[10px] text-amber-600 font-semibold">Avertis.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/80 rounded-b-2xl flex items-center justify-between flex-shrink-0">
          <div>
            {step === 'preview' && (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Retour
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-zinc-200 font-bold text-sm h-9"
            >
              {step === 'done' ? 'Fermer' : 'Annuler'}
            </Button>
            {step === 'preview' && (
              <Button
                disabled={validRows.length === 0}
                onClick={handleConfirmImport}
                className="rounded-xl h-9 bg-[#1a4731] hover:bg-[#153d28] text-white text-sm font-bold px-5 disabled:opacity-40 flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                Importer {validRows.length} article(s)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════ PAGE PRINCIPALE ═══════════════════════════

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const [search, setSearch]                     = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockFilter, setStockFilter]           = useState<StockFilter>('all');
  const [dateDebut, setDateDebut]               = useState('');
  const [dateFin, setDateFin]                   = useState('');

  const [viewMode, setViewMode]           = useState<ViewMode>('table');
  const [sortColumn, setSortColumn]       = useState<SortColumn>('designation');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [activePanel, setActivePanel] = useState<ActivePanel>('catalogue');

  const [detailProduct, setDetailProduct]     = useState<Product | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct]   = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm]     = useState({
    open: false, productId: 0, productName: '', canDelete: true, blockedReason: '',
  });
  const [importModalOpen, setImportModalOpen] = useState(false);

  const stats = useMemo(() => {
    const ok       = products.filter(p => getStockStatus(p) === 'ok').length;
    const faible   = products.filter(p => getStockStatus(p) === 'faible').length;
    const critique = products.filter(p => getStockStatus(p) === 'critique').length;
    const valeur   = products.reduce((s, p) => {
      const pmp = computePMP(p.movements ?? [], p.avgPrice);
      return s + Math.max(0, p.currentStock) * pmp;
    }, 0);
    const totalStock = products.reduce((s, p) => s + Math.max(0, p.currentStock), 0);
    const pmpGlobal  = totalStock > 0
      ? products.reduce((s, p) => s + Math.max(0, p.currentStock) * computePMP(p.movements ?? [], p.avgPrice), 0) / totalStock
      : 0;
    return { total: products.length, ok, faible, critique, valeur, pmpGlobal };
  }, [products]);

  const locationFilterOptions = useMemo<FilterOption[]>(() => {
    const usedLocations = [...new Set(products.map(p => p.location).filter(Boolean))];
    return [
      { value: 'all', label: 'Tous emplacements' },
      ...MOCK_LOCATIONS.filter(l => usedLocations.includes(l)).map(l => ({ value: l, label: l })),
      ...MOCK_LOCATIONS.filter(l => !usedLocations.includes(l)).map(l => ({ value: l, label: l })),
    ];
  }, [products]);

  const supplierFilterOptions = useMemo<FilterOption[]>(() => {
    const usedSuppliers = [...new Set(products.map(p => p.supplier).filter((s): s is string => !!s))];
    return [
      { value: 'all', label: 'Tous fournisseurs' },
      ...usedSuppliers.map(s => ({ value: s, label: s })),
    ];
  }, [products]);

  const statusFilterOptions: FilterOption[] = [
    { value: 'all',      label: 'Tous statuts'  },
    { value: 'ok',       label: 'Normal',        badge: String(stats.ok),       badgeColor: 'bg-emerald-100 text-emerald-700' },
    { value: 'faible',   label: 'Stock faible',  badge: String(stats.faible),   badgeColor: 'bg-amber-100 text-amber-700'     },
    { value: 'critique', label: 'Rupture',        badge: String(stats.critique), badgeColor: 'bg-red-100 text-red-700'         },
  ];

  const filteredProducts = useMemo(() => {
    const q       = search.toLowerCase();
    const debutTs = dateDebut ? new Date(`${dateDebut}T00:00:00`).getTime() : null;
    const finTs   = dateFin   ? new Date(`${dateFin}T23:59:59`).getTime()   : null;

    return products.filter(p => {
      if (q &&
        !p.name.toLowerCase().includes(q) &&
        !p.code.toLowerCase().includes(q) &&
        !(p.supplier ?? '').toLowerCase().includes(q) &&
        !p.category.toLowerCase().includes(q) &&
        !p.subcategory.toLowerCase().includes(q)
      ) return false;

      if (selectedCategory !== 'all' && selectedCategory !== '') {
        const fullPath = p.subcategory
          ? `${p.category} > ${p.subcategory}`
          : p.category;
        const matchesExact    = fullPath === selectedCategory || p.category === selectedCategory;
        const matchesDescendant = fullPath.startsWith(selectedCategory + ' >') || p.category === selectedCategory;
        if (!matchesExact && !matchesDescendant) return false;
      }

      if (selectedLocation !== 'all' && p.location !== selectedLocation) return false;
      if (selectedSupplier !== 'all' && p.supplier !== selectedSupplier) return false;
      if (stockFilter !== 'all' && getStockStatus(p) !== stockFilter) return false;

      if (debutTs !== null || finTs !== null) {
        const ts = p.lastUpdated ? new Date(p.lastUpdated).getTime() : null;
        if (ts !== null) {
          if (debutTs !== null && ts < debutTs) return false;
          if (finTs   !== null && ts > finTs)   return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let av: string | number, bv: string | number;
      const statusOrder: Record<StockStatus, number> = { critique: 0, faible: 1, ok: 2 };
      switch (sortColumn) {
        case 'designation': av = a.name;           bv = b.name;           break;
        case 'category':    av = a.category;       bv = b.category;       break;
        case 'location':    av = a.location ?? ''; bv = b.location ?? ''; break;
        case 'stock':       av = a.currentStock;   bv = b.currentStock;   break;
        case 'status':
          av = statusOrder[getStockStatus(a)];
          bv = statusOrder[getStockStatus(b)];
          break;
        case 'pmp':
          av = computePMP(a.movements ?? [], a.avgPrice);
          bv = computePMP(b.movements ?? [], b.avgPrice);
          break;
        case 'supplier':    av = a.supplier ?? ''; bv = b.supplier ?? ''; break;
        default:            av = a.name;           bv = b.name;
      }
      if (typeof av === 'string' && typeof bv === 'string')
        return sortDirection === 'asc' ? av.localeCompare(bv, 'fr') : bv.localeCompare(av, 'fr');
      return sortDirection === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
  }, [products, search, selectedCategory, selectedLocation, selectedSupplier, stockFilter, dateDebut, dateFin, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const paginated  = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredProducts, currentPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedLocation, selectedSupplier, stockFilter, dateDebut, dateFin, sortColumn, sortDirection]);

  const hasActiveFilters = !!(
    search || selectedCategory !== 'all' || selectedLocation !== 'all' ||
    selectedSupplier !== 'all' || stockFilter !== 'all' || dateDebut || dateFin
  );

  const resetFilters = useCallback(() => {
    setSearch(''); setSelectedCategory('all'); setSelectedLocation('all');
    setSelectedSupplier('all'); setStockFilter('all');
    setDateDebut(''); setDateFin(''); setCurrentPage(1);
  }, []);

  const handleSort = useCallback((col: SortColumn) => {
    if (sortColumn === col) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDirection('asc'); }
    setCurrentPage(1);
  }, [sortColumn]);

  const SortIcon = ({ field }: { field: SortColumn }) =>
    sortColumn === field
      ? sortDirection === 'asc'
        ? <ChevronUp className="w-3 h-3 text-[#1a4731]" />
        : <ChevronDown className="w-3 h-3 text-[#1a4731]" />
      : <ChevronsUpDown className="w-3 h-3 text-zinc-300 group-hover:text-zinc-500 transition-colors" />;

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginated.length && paginated.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginated.map(p => p.id)));
  }, [selectedIds, paginated]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }, []);

  const getExportData = useCallback(
    () => selectedIds.size > 0 ? products.filter(p => selectedIds.has(p.id)) : filteredProducts,
    [products, filteredProducts, selectedIds],
  );

  const handleExportCSV = useCallback(() => {
    const data = getExportData();
    if (data.length === 0) return;
    const BOM    = '\uFEFF';
    const escape = (v: unknown): string => { const s = String(v ?? '').replace(/"/g, '""'); return /[",\n\r]/.test(s) ? `"${s}"` : s; };
    const headers = ['Code', 'Désignation', 'Catégorie', 'Sous-catégorie', 'Emplacement', 'Stock', 'Seuil alerte',
      'PMP (MAD)', 'Valeur Stock PMP (MAD)', 'Fournisseur', 'Statut', 'Dernière MAJ'];
    const rows = data.map(p => {
      const pmp = computePMP(p.movements ?? [], p.avgPrice);
      return [
        p.code, p.name, p.category, p.subcategory ?? '', p.location ?? '',
        p.currentStock, p.minThreshold,
        pmp.toFixed(2), (Math.max(0, p.currentStock) * pmp).toFixed(2),
        p.supplier ?? '', getStockStatus(p), p.lastUpdated,
      ].map(escape).join(',');
    });
    const blob = new Blob([BOM + [headers.map(escape).join(','), ...rows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `catalogue_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  }, [getExportData]);

  const handleExportExcel = useCallback(async () => {
    const data = getExportData();
    if (data.length === 0) return;
    const XLSX = await import('xlsx');
    const rows = data.map(p => {
      const pmp = computePMP(p.movements ?? [], p.avgPrice);
      return {
        Code: p.code, Désignation: p.name, Catégorie: p.category,
        'Sous-catégorie': p.subcategory ?? '', Emplacement: p.location ?? '',
        Stock: p.currentStock, 'Seuil alerte': p.minThreshold,
        'PMP (MAD)': pmp, 'Valeur Stock PMP (MAD)': Math.max(0, p.currentStock) * pmp,
        Fournisseur: p.supplier ?? '', Statut: getStockStatus(p), 'Dernière MAJ': fmtDate(p.lastUpdated),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Articles');
    XLSX.writeFile(wb, `catalogue_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Export Excel téléchargé');
  }, [getExportData]);

  const handleExportPDF = useCallback(async (): Promise<void> => {
    const data = getExportData();
    if (data.length === 0) return;
    try {
      const { default: jsPDF }     = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc       = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin    = 12;
      const logoUrl   = '/images/alomrane-logo.png';

      let logoDataUrl = '';
      try {
        const img = new Image();
        img.src   = logoUrl;
        await new Promise<void>((resolve, reject) => {
          img.onload  = () => resolve();
          img.onerror = () => reject();
        });
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        logoDataUrl = canvas.toDataURL('image/png');
      } catch { /* logo optionnel */ }

      const addHeaderFooter = (currentPage: number, totalPages: number) => {
        if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', margin, 1, 35, 35);

        doc.setFontSize(16);
        doc.setTextColor(29, 111, 66); // Vert ERP
        doc.setFont('helvetica', 'bold');
        doc.text('GROUPE AL OMRANE', logoDataUrl ? margin + 40 : margin, 15);

        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        doc.text('Catalogue des Articles', logoDataUrl ? margin + 40 : margin, 22);

        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} — ${data.length} article(s)`,
          logoDataUrl ? margin + 40 : margin,
          28
        );

        doc.setDrawColor(29, 111, 66);
        doc.line(margin, 31, pageWidth - margin, 31);

        const footerY = doc.internal.pageSize.getHeight() - 8;
        doc.setFontSize(6);
        doc.setTextColor(140, 140, 140);
        doc.text(`Document confidentiel — Page ${currentPage} / ${totalPages}`, margin, footerY);
        doc.text('Al Omrane — Tous droits réservés', pageWidth - margin - 30, footerY, { align: 'right' });
      };

      const headers = [
        'Code', 'Désignation', 'Catégorie', 'Emplacement',
        'Stock', 'Seuil', 'PMP (MAD)', 'Valeur (MAD)', 'Statut'
      ];

      const rows = data.map(p => {
        const pmp    = computePMP(p.movements ?? [], p.avgPrice);
        const valeur = Math.max(0, p.currentStock) * pmp;
        return [
          p.code,
          p.name,
          p.category,
          p.location || '—',
          String(p.currentStock),
          String(p.minThreshold),
          pmp.toFixed(2),
          valeur.toFixed(2),
          getStockStatus(p).toUpperCase()
        ];
      });

      autoTable(doc, {
        head:    [headers],
        body:    rows,
        startY:  36,
        margin:  { top: 36, left: margin, right: margin, bottom: 15 },
        styles: {
          fontSize:    6,
          cellPadding: 2,
          valign:      'middle',
          halign:      'left',
          textColor:   [40, 40, 40],
          lineColor:   [210, 210, 210],
          lineWidth:   0.08,
        },
        headStyles: {
          fillColor:  [29, 111, 66], 
          textColor:  [255, 255, 255],
          fontStyle:  'bold',
          halign:     'center',
          fontSize:   6,
        },
        alternateRowStyles: { fillColor: [240, 248, 245] },
        columnStyles: {
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'right'  },
          7: { halign: 'right'  },
          8: { halign: 'center' },
        },
        didDrawPage: (dataObj) => addHeaderFooter(dataObj.pageNumber, doc.getNumberOfPages()),
      });

      doc.save(`catalogue_articles_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Rapport PDF exporté');
    } catch (err) {
      console.error('[Export PDF]', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  }, [getExportData]);

  const handleImportConfirm = useCallback((rows: ImportRow[]) => {
    const newProducts: Product[] = rows.map((row, i) => ({
      id: Math.max(0, ...products.map(p => p.id)) + i + 1,
      code: row.code || generateProductCode(),
      name: row.name,
      category: row.category,
      subcategory: row.subcategory,
      location: row.location,
      currentStock: row.currentStock,
      minThreshold: row.minThreshold,
      avgPrice: row.avgPrice,
      imageUrl: getRandomImage(Math.max(0, ...products.map(p => p.id)) + i),
      description: row.description,
      weight: row.weight,
      dimensions: row.dimensions,
      material: row.material,
      safetyInstructions: row.safetyInstructions,
      consignable: false,
      lastUpdated: new Date().toISOString().slice(0, 10),
      supplier: row.supplier,
      warrantyMonths: row.warrantyMonths,
      movements: [],
    }));
    setProducts(prev => [...newProducts, ...prev]);
    toast.success(`${newProducts.length} article(s) importé(s) avec succès`);
  }, [products]);

  const handleAdjustStock = useCallback((productId: number, newQty: number, motif: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      const delta = newQty - p.currentStock;
      const newMovement: StockMovement = {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        type: 'ajustement',
        quantity: Math.abs(delta),
        reason: motif,
        user: 'Utilisateur courant',
        beforeStock: p.currentStock,
        afterStock: Math.max(0, newQty),
        unitPrice: p.avgPrice,
        supplierName: undefined,
      };
      return {
        ...p,
        currentStock: Math.max(0, newQty),
        lastUpdated: new Date().toISOString().slice(0, 10),
        movements: [newMovement, ...(p.movements ?? [])],
      };
    }));
    setDetailProduct(prev =>
      prev?.id === productId
        ? { ...prev, currentStock: Math.max(0, newQty), lastUpdated: new Date().toISOString().slice(0, 10) }
        : prev,
    );
  }, []);

  const handleSaveProduct = useCallback((formData: ProductFormState) => {
    const { category, subcategory } = parseCategoryPath(formData.categoryPath);
    const avgPrice = formData.currentStock > 0 ? formData.pmp : 0;

    if (editingProduct) {
      setProducts(prev => prev.map(p =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formData.name,
              category,
              subcategory,
              location: formData.location,
              currentStock: formData.currentStock,
              minThreshold: formData.minThreshold,
              avgPrice,
              imageUrl: formData.imageUrl,
              description: formData.description,
              weight: formData.weight,
              dimensions: formData.dimensions,
              material: formData.material,
              safetyInstructions: formData.safetyInstructions,
              consignable: formData.consignable,
              supplier: formData.supplier,
              warrantyMonths: formData.warrantyMonths,
              lastUpdated: new Date().toISOString().slice(0, 10),
            }
          : p,
      ));
      toast.success('Article mis à jour avec succès');
      setEditingProduct(null);
    } else {
      const newId = Math.max(0, ...products.map(p => p.id)) + 1;
      setProducts(prev => [{
        id: newId,
        code: formData.code,
        name: formData.name,
        category,
        subcategory,
        location: formData.location,
        currentStock: formData.currentStock,
        minThreshold: formData.minThreshold,
        avgPrice,
        imageUrl: formData.imageUrl,
        description: formData.description,
        weight: formData.weight,
        dimensions: formData.dimensions,
        material: formData.material,
        safetyInstructions: formData.safetyInstructions,
        consignable: formData.consignable,
        supplier: formData.supplier,
        warrantyMonths: formData.warrantyMonths,
        lastUpdated: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        movements: [],
      }, ...prev]);
      toast.success(`Article créé : ${formData.code}`);
    }
  }, [editingProduct, products]);

  const initiateDelete = useCallback((productId: number, productName: string) => {
    if (productId === -1) {
      const toDelete = products.filter(p => selectedIds.has(p.id) && !hasRealMovements(p));
      const blocked  = products.filter(p => selectedIds.has(p.id) && hasRealMovements(p));

      if (blocked.length > 0 && toDelete.length === 0) {
        const detail = blocked.map(p => `• «\u00a0${p.name}\u00a0» (${p.code}) — article mouvementé`).join('\n');
        setDeleteConfirm({
          open: true, productId: -1,
          productName: `${selectedIds.size} article(s) sélectionné(s)`,
          canDelete: false,
          blockedReason: `Les articles suivants ont des mouvements de stock (entrées ou sorties) enregistrés et ne peuvent pas être supprimés pour préserver la traçabilité :\n\n${detail}`,
        });
      } else if (blocked.length > 0 && toDelete.length > 0) {
        const detail = blocked.map(p => `• «\u00a0${p.name}\u00a0» (${p.code}) — article mouvementé, ignoré`).join('\n');
        setDeleteConfirm({
          open: true, productId: -1,
          productName: `${toDelete.length} article(s) supprimable(s) sur ${selectedIds.size} sélectionné(s)`,
          canDelete: true,
          blockedReason: `⚠️ Les articles suivants seront ignorés (mouvements enregistrés) :\n\n${detail}`,
        });
      } else {
        setDeleteConfirm({
          open: true, productId: -1,
          productName: `${toDelete.length} article(s) sélectionné(s)`,
          canDelete: true, blockedReason: '',
        });
      }
    } else {
      const product   = products.find(p => p.id === productId);
      const canDelete = product ? !hasRealMovements(product) : false;
      setDeleteConfirm({
        open: true, productId, productName, canDelete,
        blockedReason: canDelete
          ? ''
          : `L'article «\u00a0${productName}\u00a0» possède des mouvements de stock enregistrés (entrées ou sorties réelles). Sa suppression est bloquée afin de préserver l'intégrité et la traçabilité des données ERP.`,
      });
    }
  }, [products, selectedIds]);

  const handleDeleteProduct = useCallback((productId: number) => {
    if (productId === -1) {
      const toDelete = products.filter(p => selectedIds.has(p.id) && !hasRealMovements(p));
      if (toDelete.length > 0) {
        setProducts(prev => prev.filter(p => !toDelete.some(d => d.id === p.id)));
        toast.success(`${toDelete.length} article(s) supprimé(s)`);
      }
      setSelectedIds(new Set());
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
      setSelectedIds(prev => { const s = new Set(prev); s.delete(productId); return s; });
      toast.success('Article supprimé');
    }
    setDeleteConfirm({ open: false, productId: 0, productName: '', canDelete: true, blockedReason: '' });
  }, [selectedIds, products]);

  const renderTableView = () => (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-10" />
          <col className="w-[28%]" />
          <col className="w-[14%]" />
          <col className="w-[12%]" />
          <col className="w-[16%]" />
          <col className="w-[10%]" />
          <col className="w-[11%]" />
          <col className="w-[9%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            <th className="px-3 py-3">
              <Checkbox
                checked={selectedIds.size === paginated.length && paginated.length > 0}
                onCheckedChange={toggleSelectAll}
                className="border-zinc-300 data-[state=checked]:bg-zinc-800 data-[state=checked]:border-zinc-800"
              />
            </th>
            {([
              { field: 'designation' as SortColumn, label: 'Article',   align: 'left'   },
              { field: 'category'   as SortColumn, label: 'Catégorie', align: 'left'   },
              { field: 'location'   as SortColumn, label: 'Emplac.',   align: 'left'   },
              { field: 'stock'      as SortColumn, label: 'Stock',     align: 'left'   },
              { field: 'pmp'        as SortColumn, label: 'PMP',       align: 'right'  },
              { field: 'status'     as SortColumn, label: 'Statut',    align: 'center' },
            ] as { field: SortColumn; label: string; align: string }[]).map(({ field, label, align }) => (
              <th
                key={field}
                className="px-3 py-3 cursor-pointer select-none group"
                onClick={() => handleSort(field)}
              >
                <span className={cn(
                  'text-[10px] uppercase tracking-wider text-zinc-400 font-semibold inline-flex items-center gap-1 hover:text-zinc-600 transition-colors',
                  align === 'center' ? 'justify-center w-full'
                    : align === 'right' ? 'justify-end w-full'
                    : '',
                  field === 'pmp' && 'text-[#1a4731]',
                )}>
                  {label}
                  <SortIcon field={field} />
                </span>
              </th>
            ))}
            <th className="px-3 py-3 text-right">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {paginated.length === 0 ? (
            <tr>
              <td colSpan={8} className="py-16 text-center">
                <Package className="w-8 h-8 text-zinc-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-zinc-500">Aucun article trouvé</p>
                <p className="text-xs text-zinc-400 mt-1">Modifiez vos critères ou ajoutez un article.</p>
              </td>
            </tr>
          ) : paginated.map(product => {
            const status = getStockStatus(product);
            const pmp    = computePMP(product.movements ?? [], product.avgPrice);
            const canDel = !hasRealMovements(product);
            return (
              <tr
                key={product.id}
                className={cn('hover:bg-zinc-50/80 transition-colors group cursor-pointer', selectedIds.has(product.id) && 'bg-emerald-50/30')}
                onClick={() => setDetailProduct(product)}
              >
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(product.id)}
                    onCheckedChange={() => toggleSelect(product.id)}
                    className="border-zinc-300 data-[state=checked]:bg-[#1a4731] data-[state=checked]:border-[#1a4731]"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-100">
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover"
                            onError={e => ((e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/32')} />
                        : <Package className="w-3.5 h-3.5 text-zinc-400 m-auto mt-1.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">{product.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[10px] text-zinc-600 bg-zinc-100 rounded-md px-1.5 py-0.5 font-medium truncate block max-w-full">
                    {product.category}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 min-w-0">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{product.location || '—'}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <StockBar current={product.currentStock} min={product.minThreshold} />
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-xs font-bold text-[#1a4731]">{fmtNumber(pmp)}</span>
                  <span className="text-[9px] text-zinc-400 block">MAD</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <StatusPill status={status} size="sm" />
                </td>
                <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setDetailProduct(product)}
                      className="w-6 h-6 rounded-md hover:bg-zinc-100 flex items-center justify-center transition-colors"
                      title="Voir"
                    >
                      <Eye className="w-3 h-3 text-zinc-400" />
                    </button>
                    <button
                      onClick={() => { setEditingProduct(product); setProductFormOpen(true); }}
                      className="w-6 h-6 rounded-md hover:bg-zinc-100 flex items-center justify-center transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-3 h-3 text-zinc-400" />
                    </button>
                    <button
                      onClick={() => initiateDelete(product.id, product.name)}
                      className={cn(
                        'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                        canDel ? 'hover:bg-red-50' : 'hover:bg-amber-50',
                      )}
                      title={canDel ? 'Supprimer' : 'Suppression impossible — article mouvementé'}
                    >
                      <Trash2 className={cn('w-3 h-3', canDel ? 'text-zinc-400 hover:text-red-500' : 'text-amber-400')} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50/30">
          <span className="text-xs text-zinc-400">
            {filteredProducts.length > 0
              ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} sur ${filteredProducts.length} article(s)`
              : '0 article'}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="w-8 h-8 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (currentPage <= 3) p = i + 1;
              else if (currentPage >= totalPages - 2) p = totalPages - 4 + i;
              else p = currentPage - 2 + i;
              return (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-all',
                    currentPage === p ? 'bg-[#1a4731] text-white shadow-sm' : 'border border-zinc-200 text-zinc-500 hover:bg-zinc-50')}>
                  {p}
                </button>
              );
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="w-8 h-8 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {paginated.length === 0 ? (
        <div className="col-span-full py-16 text-center">
          <Package className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-500">Aucun article trouvé</p>
        </div>
      ) : paginated.map(product => {
        const status = getStockStatus(product);
        const pmp    = computePMP(product.movements ?? [], product.avgPrice);
        const canDel = !hasRealMovements(product);

        const cardBorderAccent =
          status === 'critique' ? 'border-red-200'
          : status === 'faible' ? 'border-amber-200'
          : 'border-zinc-200';

        return (
          <div
            key={product.id}
            className={cn(
              'group bg-white rounded-xl border-2 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col overflow-hidden',
              cardBorderAccent,
              'hover:border-zinc-300',
            )}
            onClick={() => setDetailProduct(product)}
          >
            <div className="h-36 bg-zinc-50 relative overflow-hidden flex-shrink-0">
              {product.imageUrl
                ? <img src={product.imageUrl} alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => ((e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/200')} />
                : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-zinc-200" /></div>}

              <div className="absolute top-2 left-2" onClick={e => { e.stopPropagation(); toggleSelect(product.id); }}>
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  className="border-white bg-white/80 shadow-sm data-[state=checked]:bg-[#1a4731] data-[state=checked]:border-[#1a4731]"
                />
              </div>
            </div>

            <div className="p-3 flex flex-col flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-400 font-mono mb-0.5">{product.code}</p>
                  <h4 className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug">{product.name}</h4>
                </div>
                <StatusPill status={status} size="sm" />
              </div>

              <div className="flex-1 flex flex-col justify-end space-y-2.5">
                <StockBar current={product.currentStock} min={product.minThreshold} />

                <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                  <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-md truncate max-w-[80px]">
                    {product.category}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1a4731] tabular-nums">
                      {fmtNumber(pmp)}{' '}
                      <span className="text-[10px] text-zinc-400 font-normal">MAD</span>
                    </p>
                    <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider">PMP</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-100 px-3 py-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={e => { e.stopPropagation(); setEditingProduct(product); setProductFormOpen(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 h-7 rounded-lg bg-[#1a4731] text-white text-xs font-medium hover:bg-[#153d28] transition-colors"
              >
                <Edit className="w-3 h-3" /> Modifier
              </button>
              <button
                onClick={e => { e.stopPropagation(); initiateDelete(product.id, product.name); }}
                className={cn(
                  'w-8 h-7 rounded-lg border flex items-center justify-center transition-colors',
                  canDel
                    ? 'border-zinc-200 hover:bg-red-50 hover:border-red-200'
                    : 'border-amber-200 bg-amber-50 cursor-not-allowed',
                )}
                title={canDel ? 'Supprimer' : 'Suppression impossible — article mouvementé'}
              >
                <Trash2 className={cn('w-3.5 h-3.5', canDel ? 'text-zinc-400 hover:text-red-500' : 'text-amber-400')} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const navItems: Array<{ id: ActivePanel; label: string; Icon: React.ElementType }> = [
    { id: 'catalogue', label: 'Catalogue', Icon: Package   },
    { id: 'analyse',   label: 'Analyse',   Icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-5">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-[#1a4731] flex items-center justify-center">
                <Boxes className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Catalogue Articles</h1>
            </div>
            <p className="text-xs text-zinc-400 ml-10">Gestion des stocks · Al Omrane Souss Massa</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 rounded-xl px-3 py-1.5 transition-all"
              >
                <X className="w-3 h-3" /> Réinitialiser
              </button>
            )}
            <button
              onClick={() => setImportModalOpen(true)}
              className="h-9 px-4 rounded-xl border-2 border-zinc-200 font-bold text-sm bg-white text-zinc-700 hover:bg-[#E8F5E9] hover:border-[#1a4731] hover:text-[#1a4731] flex items-center gap-2 transition-all"
            >
              <UploadCloud className="w-4 h-4" /><span className="hidden sm:inline">Importer</span>
            </button>
            <button
              onClick={() => { setEditingProduct(null); setProductFormOpen(true); setActivePanel('catalogue'); }}
              className="h-9 px-4 rounded-xl bg-[#1a4731] text-white font-bold hover:bg-[#153d28] flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nouvel article</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard
            icon={Package}
            label="Total références"
            value={fmtInt(stats.total)}
            colorBg="bg-blue-50" colorText="text-blue-600"
            isActive={stockFilter === 'all' && activePanel === 'catalogue'}
            onClick={() => { setStockFilter('all'); setActivePanel('catalogue'); }}
          />
          <KpiCard
            icon={CheckCircle2}
            label="En stock normal"
            value={fmtInt(stats.ok)}
            colorBg="bg-emerald-50" colorText="text-emerald-600"
            isActive={stockFilter === 'ok' && activePanel === 'catalogue'}
            onClick={() => { setStockFilter('ok'); setActivePanel('catalogue'); }}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Stocks faibles"
            value={fmtInt(stats.faible)}
            colorBg="bg-amber-50" colorText="text-amber-500"
            isActive={stockFilter === 'faible' && activePanel === 'catalogue'}
            onClick={() => { setStockFilter('faible'); setActivePanel('catalogue'); }}
            badge={stats.faible}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Ruptures de stock"
            value={fmtInt(stats.critique)}
            colorBg="bg-red-50" colorText="text-red-500"
            isActive={stockFilter === 'critique' && activePanel === 'catalogue'}
            onClick={() => { setStockFilter('critique'); setActivePanel('catalogue'); }}
            badge={stats.critique}
          />
          <KpiCard
            icon={Calculator}
            label="PMP moyen catalogue"
            value={`${fmtNumber(stats.pmpGlobal)} MAD`}
            sub={`Valeur stock: ${(stats.valeur / 1000).toFixed(0)}k MAD`}
            colorBg="bg-[#E8F5E9]" colorText="text-[#1a4731]"
            isActive={activePanel === 'analyse'}
            onClick={() => setActivePanel('analyse')}
          />
        </div>

        <div className="flex items-center gap-1 bg-white rounded-xl border border-zinc-200 p-1.5">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
                activePanel === id ? 'bg-[#1a4731] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
              )}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
          <a
            href="/dashboard/responsable/alertes"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-all ml-1"
          >
            <Bell className="w-3.5 h-3.5" />Alertes
            {(stats.faible + stats.critique) > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {stats.faible + stats.critique > 9 ? '9+' : stats.faible + stats.critique}
              </span>
            )}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </div>

        {activePanel === 'catalogue' && (
          <>
            <div className="bg-white rounded-xl border border-zinc-200 p-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-3 h-8 flex-1 min-w-[200px] focus-within:border-zinc-400 focus-within:bg-white transition-all">
                <Search className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Nom, référence, catégorie, fournisseur…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent outline-none text-zinc-900 placeholder-zinc-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center hover:bg-zinc-300 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 text-zinc-600" />
                  </button>
                )}
              </div>

              <CategoryHierarchyFilterSelect
                value={selectedCategory}
                onChange={v => { setSelectedCategory(v); setCurrentPage(1); }}
                products={products}
              />

              <FilterSelect
                value={selectedLocation}
                onChange={v => { setSelectedLocation(v); setCurrentPage(1); }}
                options={locationFilterOptions}
                placeholder="Emplacements"
                searchPlaceholder="Rechercher emplacement…"
                dropdownWidth={240}
                compact
                className="hidden lg:block"
              />

              <FilterSelect
                value={selectedSupplier}
                onChange={v => { setSelectedSupplier(v); setCurrentPage(1); }}
                options={supplierFilterOptions}
                placeholder="Fournisseurs"
                searchPlaceholder="Rechercher fournisseur…"
                dropdownWidth={260}
                compact
                className="hidden xl:block"
              />

              <FilterSelect
                value={stockFilter}
                onChange={v => { setStockFilter(v as StockFilter); setCurrentPage(1); }}
                options={statusFilterOptions}
                placeholder="Statut"
                searchPlaceholder="Rechercher statut…"
                dropdownWidth={200}
                compact
              />

              <DateRangePicker
                dateDebut={dateDebut} dateFin={dateFin}
                onDebutChange={v => { setDateDebut(v); setCurrentPage(1); }}
                onFinChange={v  => { setDateFin(v);   setCurrentPage(1); }}
              />

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="h-8 w-8 rounded-lg border border-zinc-200 bg-white text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 flex items-center justify-center transition-all"
                  title="Réinitialiser"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}

              {filteredProducts.length > 0 && (
                <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">
                  {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''}
                </span>
              )}

              <div className="h-4 w-px bg-zinc-200 hidden sm:block ml-auto" />

              <div className="flex items-center bg-zinc-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={cn('w-7 h-7 rounded-md flex items-center justify-center transition-all', viewMode === 'table' ? 'bg-white shadow-sm text-[#1a4731]' : 'text-zinc-400 hover:text-zinc-600')}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('w-7 h-7 rounded-md flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-white shadow-sm text-[#1a4731]' : 'text-zinc-400 hover:text-zinc-600')}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <ExportMenu onCSV={handleExportCSV} onExcel={handleExportExcel} onPDF={handleExportPDF} disabled={filteredProducts.length === 0} />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#1a4731] rounded-xl shadow-lg sticky top-4 z-30">
                <span className="text-xs font-semibold text-white flex-1">{selectedIds.size} article(s) sélectionné(s)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportExcel}
                    className="h-7 px-3 rounded-lg bg-white/10 text-white border border-white/10 hover:bg-white/20 text-xs font-medium transition-all"
                  >
                    Exporter
                  </button>
                  <button
                    onClick={() => initiateDelete(-1, `${selectedIds.size} articles sélectionnés`)}
                    className="h-7 px-3 rounded-lg bg-red-600 text-white hover:bg-red-500 text-xs font-medium transition-all"
                  >
                    Supprimer
                  </button>
                </div>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {viewMode === 'table' ? renderTableView() : renderGridView()}
          </>
        )}

        {activePanel === 'analyse' && <AnalysePanel products={products} />}
      </div>

      {detailProduct && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setDetailProduct(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col border border-zinc-200"
            onClick={e => e.stopPropagation()}
          >
            <ProductDetailModal
              product={detailProduct}
              onAdjustStock={handleAdjustStock}
              onClose={() => setDetailProduct(null)}
              onEdit={() => { setEditingProduct(detailProduct); setDetailProduct(null); setProductFormOpen(true); }}
            />
          </div>
        </div>
      )}

      <ProductFormModal
        open={productFormOpen}
        onOpenChange={open => { setProductFormOpen(open); if (!open) setEditingProduct(null); }}
        initialProduct={editingProduct}
        onSave={handleSaveProduct}
        existingProducts={products}
      />

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        existingProducts={products}
        onImportConfirm={handleImportConfirm}
      />

      <DeleteConfirmModal
        open={deleteConfirm.open}
        onOpenChange={open => !open && setDeleteConfirm({ open: false, productId: 0, productName: '', canDelete: true, blockedReason: '' })}
        productName={deleteConfirm.productName}
        canDelete={deleteConfirm.canDelete}
        blockedReason={deleteConfirm.blockedReason || undefined}
        onConfirm={() => handleDeleteProduct(deleteConfirm.productId)}
      />
    </div>
  );
}
