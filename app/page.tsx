"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, User, Building2, Shield } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate LDAP/AD authentication
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1D6F42] via-[#2B8C52] to-[#1D6F42] p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg p-2">
              <Image 
                src="/images/alomrane-logo.png" 
                alt="Al Omrane Logo" 
                width={80} 
                height={80}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AL OMRANE</h1>
              <p className="text-white/80 text-base">Agadir</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight text-balance">
            Système de Gouvernance des Ressources
          </h2>
          <p className="text-white/90 text-lg">
            Portail Collaboratif Unifié - SIGR
          </p>
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Building2 className="w-8 h-8 text-[#E31837] mb-2" />
              <p className="text-white font-medium">Gestion des Ressources</p>
              <p className="text-white/70 text-sm">Catalogue & Demandes</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <Shield className="w-8 h-8 text-[#E31837] mb-2" />
              <p className="text-white font-medium">Sécurité LDAP/AD</p>
              <p className="text-white/70 text-sm">Authentification SSO</p>
            </div>
          </div>
        </div>

        <p className="text-white/60 text-sm">
          © 2026 Al Omrane Agadir - Tous droits réservés
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-border p-2">
              <Image 
                src="/images/alomrane-logo.png" 
                alt="Al Omrane Logo" 
                width={64} 
                height={64}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AL OMRANE</h1>
              <p className="text-muted-foreground text-sm">SIGR - Agadir</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
              <CardDescription className="text-center">
                Authentification via LDAP/Active Directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Identifiant</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Entrez votre identifiant"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Connexion en cours...
                    </span>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <p className="text-center text-sm text-muted-foreground">
                  Problème de connexion ?{" "}
                  <a href="#" className="text-primary hover:underline font-medium">
                    Contactez le support IT
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            En vous connectant, vous acceptez les conditions d&apos;utilisation du système SIGR
          </p>
        </div>
      </div>
    </div>
  )
}
