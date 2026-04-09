"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  id: number
  nom: string
  prenom: string
  email: string
  role: "EMPLOYE" | "CHEF_SERVICE" | "RESPONSABLE" | "ADMIN"
  service: string
  initiales: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Récupère l'utilisateur sauvegardé si déjà connecté
    const saved = localStorage.getItem("sigr_user")
    if (saved) setUser(JSON.parse(saved))
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem("sigr_user", JSON.stringify(data))
      setUser(data)
      return true
    } catch {
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("sigr_user")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth doit être dans AuthProvider")
  return ctx
}