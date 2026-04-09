"use client"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Search,
  ShoppingCart,
  Package,
  Grid3X3,
  List,
  Filter,
  Plus,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Pen,
  FileText,
  Printer,
  Monitor,
  Armchair,
  SprayCan,
  FolderOpen,
  Paperclip,
  Mouse,
  Cable,
  HardDrive,
  Headphones,
  Palette,
  StickyNote,
  FileBox,
} from "lucide-react"

interface SubCategory {
  id: string
  name: string
  icon: React.ReactNode
}

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  subCategories: SubCategory[]
}

const categories: Category[] = [
  {
    id: "bureautique",
    name: "Fournitures de bureau",
    icon: <Pen className="w-4 h-4" />,
    color: "text-[#1D6F42]",
    subCategories: [
      { id: "stylos", name: "Stylos et crayons", icon: <Pen className="w-3 h-3" /> },
      { id: "papier", name: "Papier et ramettes", icon: <FileText className="w-3 h-3" /> },
      { id: "classement", name: "Classement et archivage", icon: <FolderOpen className="w-3 h-3" /> },
      { id: "agrafage", name: "Agrafage et perforation", icon: <Paperclip className="w-3 h-3" /> },
      { id: "adhesifs", name: "Adhésifs et colles", icon: <StickyNote className="w-3 h-3" /> },
    ],
  },
  {
    id: "informatique",
    name: "Matériel informatique",
    icon: <Monitor className="w-4 h-4" />,
    color: "text-blue-600",
    subCategories: [
      { id: "peripheriques", name: "Périphériques", icon: <Mouse className="w-3 h-3" /> },
      { id: "cables", name: "Câbles et connecteurs", icon: <Cable className="w-3 h-3" /> },
      { id: "stockage", name: "Stockage", icon: <HardDrive className="w-3 h-3" /> },
      { id: "accessoires", name: "Accessoires PC", icon: <Headphones className="w-3 h-3" /> },
    ],
  },
  {
    id: "impression",
    name: "Consommables impression",
    icon: <Printer className="w-4 h-4" />,
    color: "text-[#E31837]",
    subCategories: [
      { id: "cartouches", name: "Cartouches d'encre", icon: <Palette className="w-3 h-3" /> },
      { id: "toners", name: "Toners", icon: <FileBox className="w-3 h-3" /> },
      { id: "papier-special", name: "Papier spécial", icon: <FileText className="w-3 h-3" /> },
    ],
  },
  {
    id: "mobilier",
    name: "Mobilier",
    icon: <Armchair className="w-4 h-4" />,
    color: "text-amber-600",
    subCategories: [
      { id: "bureaux", name: "Bureaux", icon: <Armchair className="w-3 h-3" /> },
      { id: "chaises", name: "Chaises et fauteuils", icon: <Armchair className="w-3 h-3" /> },
      { id: "rangement", name: "Rangement", icon: <FolderOpen className="w-3 h-3" /> },
    ],
  },
  {
    id: "hygiene",
    name: "Hygiène et entretien",
    icon: <SprayCan className="w-4 h-4" />,
    color: "text-cyan-600",
    subCategories: [
      { id: "nettoyage", name: "Produits de nettoyage", icon: <SprayCan className="w-3 h-3" /> },
      { id: "papier-hygiene", name: "Papier hygiénique", icon: <FileText className="w-3 h-3" /> },
      { id: "desinfectant", name: "Désinfectants", icon: <SprayCan className="w-3 h-3" /> },
    ],
  },
]

interface Product {
  id: number
  name: string
  category: string
  subCategory: string
  categoryLabel: string
  subCategoryLabel: string
  reference: string
  description: string
  specifications: string[]
  image: string
}

const products: Product[] = [
  {
    id: 1,
    name: "Stylo bille bleu",
    category: "bureautique",
    subCategory: "stylos",
    categoryLabel: "Fournitures de bureau",
    subCategoryLabel: "Stylos et crayons",
    reference: "STY-001",
    description: "Stylo bille pointe moyenne, encre bleue, corps plastique ergonomique",
    specifications: ["Pointe: 0.7mm", "Couleur: Bleu", "Type: Rétractable", "Marque: BIC"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 2,
    name: "Ramette papier A4",
    category: "bureautique",
    subCategory: "papier",
    categoryLabel: "Fournitures de bureau",
    subCategoryLabel: "Papier et ramettes",
    reference: "PAP-A4-500",
    description: "Ramette 500 feuilles, 80g/m², blanc, format A4 standard",
    specifications: ["Format: A4 (210x297mm)", "Grammage: 80g/m²", "Quantité: 500 feuilles", "Blancheur: CIE 161"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 3,
    name: "Cartouche HP 305 Noir",
    category: "impression",
    subCategory: "cartouches",
    categoryLabel: "Consommables impression",
    subCategoryLabel: "Cartouches d'encre",
    reference: "HP-305-BK",
    description: "Cartouche d'encre originale HP 305 noir pour imprimantes jet d'encre",
    specifications: ["Type: Original HP", "Couleur: Noir", "Rendement: ~120 pages", "Compatibilité: DeskJet, ENVY"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 4,
    name: "Souris sans fil Logitech",
    category: "informatique",
    subCategory: "peripheriques",
    categoryLabel: "Matériel informatique",
    subCategoryLabel: "Périphériques",
    reference: "SOU-WL-01",
    description: "Souris optique sans fil, récepteur USB nano, ergonomique",
    specifications: ["Connexion: Sans fil 2.4GHz", "Capteur: Optique 1000 DPI", "Autonomie: 12 mois", "Marque: Logitech M185"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 5,
    name: "Clavier USB AZERTY",
    category: "informatique",
    subCategory: "peripheriques",
    categoryLabel: "Matériel informatique",
    subCategoryLabel: "Périphériques",
    reference: "CLV-USB-01",
    description: "Clavier AZERTY filaire USB, touches silencieuses, pavé numérique",
    specifications: ["Type: Filaire USB", "Layout: AZERTY FR", "Touches: 104", "Longueur câble: 1.5m"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 6,
    name: "Classeur à levier A4",
    category: "bureautique",
    subCategory: "classement",
    categoryLabel: "Fournitures de bureau",
    subCategoryLabel: "Classement et archivage",
    reference: "CLS-A4-01",
    description: "Classeur A4 à levier, dos 75mm, couverture plastifiée",
    specifications: ["Format: A4", "Dos: 75mm", "Mécanisme: Levier", "Matière: Carton plastifié"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 7,
    name: "Agrafeuse de bureau",
    category: "bureautique",
    subCategory: "agrafage",
    categoryLabel: "Fournitures de bureau",
    subCategoryLabel: "Agrafage et perforation",
    reference: "AGR-STD-01",
    description: "Agrafeuse de bureau, capacité 25 feuilles, agrafes 24/6",
    specifications: ["Capacité: 25 feuilles", "Agrafes: 24/6 ou 26/6", "Profondeur: 55mm", "Corps: Métal"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 8,
    name: "Toner HP LaserJet",
    category: "impression",
    subCategory: "toners",
    categoryLabel: "Consommables impression",
    subCategoryLabel: "Toners",
    reference: "HP-LJ-BK",
    description: "Toner noir original HP LaserJet, haute capacité",
    specifications: ["Type: Original HP", "Couleur: Noir", "Rendement: ~2500 pages", "Compatibilité: LaserJet Pro"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 9,
    name: "Clé USB 32Go",
    category: "informatique",
    subCategory: "stockage",
    categoryLabel: "Matériel informatique",
    subCategoryLabel: "Stockage",
    reference: "USB-32-01",
    description: "Clé USB 3.0, 32Go, lecture rapide, capuchon intégré",
    specifications: ["Capacité: 32Go", "Interface: USB 3.0", "Vitesse lecture: 100 Mo/s", "Marque: SanDisk"],
    image: "/placeholder.svg?height=120&width=120",
  },
  {
    id: 10,
    name: "Ruban adhésif transparent",
    category: "bureautique",
    subCategory: "adhesifs",
    categoryLabel: "Fournitures de bureau",
    subCategoryLabel: "Adhésifs et colles",
    reference: "ADH-TR-01",
    description: "Ruban adhésif transparent 19mm x 33m, invisible sur papier",
    specifications: ["Largeur: 19mm", "Longueur: 33m", "Type: Invisible", "Support: Dévidoir"],
    image: "/placeholder.svg?height=120&width=120",
  },
]

export default function CataloguePage() {
  const { addToCart, removeFromCart, isInCart, cartCount } = useCart()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSubCategory, setSelectedSubCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["bureautique"])

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    const matchesSubCategory = selectedSubCategory === "all" || product.subCategory === selectedSubCategory
    return matchesSearch && matchesCategory && matchesSubCategory
  })

  const toggleCart = (productId: number) => {
    const product = products.find((p) => p.id === productId)!
    if (isInCart(productId)) {
      removeFromCart(productId)
    } else {
      addToCart({
        id: product.id,
        name: product.name,
        reference: product.reference,
        categoryLabel: product.categoryLabel,
        description: product.description,
      })
    }
  }

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setDetailsOpen(true)
  }

  const addToCartFromDialog = () => {
    if (selectedProduct) {
      addToCart(
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          reference: selectedProduct.reference,
          categoryLabel: selectedProduct.categoryLabel,
          description: selectedProduct.description,
        },
        quantity
      )
      setDetailsOpen(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1D6F42]">Catalogue des Articles</h1>
          <p className="text-muted-foreground mt-1">
            Consultez et sélectionnez les articles dont vous avez besoin
          </p>
        </div>
        {/* ✅ FIX 1 : Link à l'extérieur, Button sans asChild */}
        <Link href="/dashboard/panier">
          <Button className="w-fit bg-[#E31837] hover:bg-[#E31837]/90">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Mon Panier ({cartCount})
          </Button>
        </Link>
      </div>

      {/* Info Banner */}
      <Card className="border-0 bg-white shadow-sm border-l-4 border-l-[#1D6F42]">
        <CardContent className="p-4">
          <p className="text-sm text-foreground">
            <strong className="text-[#1D6F42]">Note :</strong> Les prix, stocks et emplacements
            physiques ne sont pas affichés pour les employés. Sélectionnez vos articles et soumettez
            votre demande pour validation.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-6">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-72 flex-shrink-0">
            <Card className="border-0 shadow-sm sticky top-24">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#1D6F42]" />
                    <h3 className="font-semibold">Catégories</h3>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(false)}>
                    <PanelLeftClose className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mb-4">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    className={`w-full justify-start ${selectedCategory === "all" ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : ""}`}
                    onClick={() => { setSelectedCategory("all"); setSelectedSubCategory("all") }}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Tous les articles
                  </Button>
                </div>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Collapsible
                      key={category.id}
                      open={expandedCategories.includes(category.id)}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={`w-full justify-between px-3 py-2 h-auto ${selectedCategory === category.id ? "bg-[#1D6F42]/10 text-[#1D6F42]" : ""}`}
                          onClick={() => { setSelectedCategory(category.id); setSelectedSubCategory("all") }}
                        >
                          <span className={`flex items-center gap-2 text-sm ${category.color}`}>
                            {category.icon}
                            <span className="text-foreground">{category.name}</span>
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategories.includes(category.id) ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-3">
                          {category.subCategories.map((sub) => (
                            <Button
                              key={sub.id}
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-xs h-8 ${selectedSubCategory === sub.id ? "bg-[#E31837]/10 text-[#E31837] font-medium" : "text-muted-foreground"}`}
                              onClick={() => { setSelectedCategory(category.id); setSelectedSubCategory(sub.id) }}
                            >
                              <span className="mr-2">{sub.icon}</span>
                              {sub.name}
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Products */}
        <div className="flex-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {!sidebarOpen && (
                  <Button variant="outline" size="icon" className="h-11 w-11 flex-shrink-0" onClick={() => setSidebarOpen(true)}>
                    <PanelLeftOpen className="w-4 h-4" />
                  </Button>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, référence ou mot-clé..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                {selectedCategoryData && (
                  <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                    <SelectTrigger className="w-full sm:w-48 h-11 lg:hidden">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sous-catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {selectedCategoryData.subCategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-none ${viewMode === "grid" ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className={`rounded-none ${viewMode === "list" ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Catalogue</span>
            {selectedCategory !== "all" && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#1D6F42] font-medium">{selectedCategoryData?.name}</span>
              </>
            )}
            {selectedSubCategory !== "all" && selectedCategoryData && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-[#E31837] font-medium">
                  {selectedCategoryData.subCategories.find((s) => s.id === selectedSubCategory)?.name}
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground">{filteredProducts.length} article(s) trouvé(s)</p>

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const inCart = isInCart(product.id)
                return (
                  <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                    <CardContent className="p-4">
                      <div
                        className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-4 flex items-center justify-center group-hover:from-[#1D6F42]/5 group-hover:to-[#1D6F42]/10 transition-colors cursor-pointer relative"
                        onClick={() => openProductDetails(product)}
                      >
                        <Package className="w-12 h-12 text-muted-foreground/50" />
                        <div className="absolute top-2 right-2">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                            onClick={(e) => { e.stopPropagation(); openProductDetails(product) }}
                          >
                            <Info className="w-4 h-4 text-[#1D6F42]" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="secondary" className="text-xs bg-[#1D6F42]/10 text-[#1D6F42] hover:bg-[#1D6F42]/20">
                          {product.categoryLabel}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 cursor-pointer hover:text-[#1D6F42] line-clamp-1" onClick={() => openProductDetails(product)}>
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">Réf: {product.reference}</p>
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                      <Button
                        variant={inCart ? "default" : "outline"}
                        size="sm"
                        className={`w-full ${inCart ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : "hover:border-[#1D6F42] hover:text-[#1D6F42]"}`}
                        onClick={() => toggleCart(product.id)}
                      >
                        {inCart ? (
                          <><Check className="w-4 h-4 mr-2" />Dans le panier</>
                        ) : (
                          <><Plus className="w-4 h-4 mr-2" />Ajouter au panier</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => {
                const inCart = isInCart(product.id)
                return (
                  <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer hover:from-[#1D6F42]/5 hover:to-[#1D6F42]/10"
                          onClick={() => openProductDetails(product)}
                        >
                          <Package className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-sm cursor-pointer hover:text-[#1D6F42]" onClick={() => openProductDetails(product)}>
                              {product.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs bg-[#1D6F42]/10 text-[#1D6F42]">
                              {product.subCategoryLabel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Réf: {product.reference}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openProductDetails(product)}>
                            <Info className="w-4 h-4 mr-2" />Détails
                          </Button>
                          <Button
                            variant={inCart ? "default" : "outline"}
                            size="sm"
                            className={inCart ? "bg-[#1D6F42] hover:bg-[#1D6F42]/90" : ""}
                            onClick={() => toggleCart(product.id)}
                          >
                            {inCart ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucun article trouvé</h3>
                <p className="text-muted-foreground text-sm">Modifiez vos critères de recherche ou sélectionnez une autre catégorie</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#1D6F42]">{selectedProduct.name}</DialogTitle>
                <DialogDescription>Référence: {selectedProduct.reference}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-xl flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground/50" />
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-[#1D6F42]/10 text-[#1D6F42] hover:bg-[#1D6F42]/20 border-0">{selectedProduct.categoryLabel}</Badge>
                  <Badge variant="outline" className="text-[#E31837] border-[#E31837]/30">{selectedProduct.subCategoryLabel}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Caractéristiques techniques</h4>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    {selectedProduct.specifications.map((spec, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-[#1D6F42]" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <label className="text-sm font-medium mb-2 block">Quantité souhaitée</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number" min="1" value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center h-10"
                    />
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity(quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              {/* ✅ FIX 2 : Dialog footer corrigé — bouton Ajouter + bouton Fermer */}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDetailsOpen(false)}>
                  Fermer
                </Button>
                <Button className="bg-[#1D6F42] hover:bg-[#1D6F42]/90" onClick={addToCartFromDialog}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ajouter au panier ({quantity})
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}