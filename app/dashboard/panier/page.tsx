"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingCart,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface CartItem {
  id: number
  name: string
  category: string
  reference: string
  quantity: number
}

const initialCartItems: CartItem[] = [
  {
    id: 1,
    name: "Stylo bille bleu",
    category: "Fournitures de bureau",
    reference: "STY-001",
    quantity: 5,
  },
  {
    id: 2,
    name: "Ramette papier A4",
    category: "Fournitures de bureau",
    reference: "PAP-A4-500",
    quantity: 2,
  },
  {
    id: 3,
    name: "Cartouche HP 305 Noir",
    category: "Consommables impression",
    reference: "HP-305-BK",
    quantity: 1,
  },
]

export default function PanierPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems)
  const router = useRouter()

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    )
  }

  const setQuantity = (id: number, value: string) => {
    const quantity = parseInt(value) || 1
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    )
  }

  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmitRequest = () => {
    router.push("/dashboard/demandes?from=panier")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mon Panier</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les articles avant de soumettre votre demande
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/catalogue">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continuer les achats
          </Link>
        </Button>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge variant="secondary" className="text-xs mb-1">
                            {item.category}
                          </Badge>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Réf: {item.reference}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-sm text-muted-foreground">Quantité:</span>
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-r-none"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => setQuantity(item.id, e.target.value)}
                            className="w-16 h-9 text-center border-0 rounded-none focus-visible:ring-0"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-l-none"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nombre d&apos;articles</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantité totale</span>
                    <span className="font-medium">{totalItems} unités</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Votre demande sera soumise pour validation par votre responsable hiérarchique.
                  </p>
                  <Button className="w-full" size="lg" onClick={handleSubmitRequest}>
                    Soumettre la demande
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Votre panier est vide</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Parcourez le catalogue pour ajouter des articles à votre panier
            </p>
            <Button asChild>
              <Link href="/dashboard/catalogue">
                <Package className="w-4 h-4 mr-2" />
                Voir le catalogue
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
