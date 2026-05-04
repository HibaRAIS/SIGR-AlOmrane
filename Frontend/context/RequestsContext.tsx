"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { CartItem } from "./CartContext"

export interface Request {
  id: string
  title: string
  date: string
  status: "pending" | "approved" | "rejected" | "processing"
  statusLabel: string
  urgency: "Normal" | "Urgent" | "Critique"
  items: { id: number; name: string; quantity: number; reference: string }[]
  justification: string
  approver?: string
  approvalDate?: string
  rejectionReason?: string
}

interface RequestsContextType {
  requests: Request[]
  addRequest: (request: Request) => void
  updateRequest: (id: string, updates: Partial<Request>) => void
  deleteRequest: (id: string) => void
}

const RequestsContext = createContext<RequestsContextType | null>(null)

const initialRequests: Request[] = [
  {
    id: "DEM-2026-0145",
    title: "Fournitures de bureau",
    date: "10 Mars 2026",
    status: "approved",
    statusLabel: "Approuvée",
    urgency: "Normal",
    items: [
      { id: 1, name: "Post-it couleurs", quantity: 12, reference: "POST-CLR" },
      { id: 2, name: "Agrafeuse", quantity: 1, reference: "AGR-STD-01" },
    ],
    justification: "Réapprovisionnement mensuel standard",
    approver: "Ahmed Benali",
    approvalDate: "10 Mars 2026",
  },
  {
    id: "DEM-2026-0142",
    title: "Cartouches d'imprimante",
    date: "8 Mars 2026",
    status: "processing",
    statusLabel: "En traitement",
    urgency: "Urgent",
    items: [
      { id: 1, name: "Cartouche HP 305 Noir", quantity: 2, reference: "HP-305-BK" },
    ],
    justification: "Stock épuisé, impression urgente de rapports",
    approver: "Ahmed Benali",
    approvalDate: "8 Mars 2026",
  },
  {
    id: "DEM-2026-0138",
    title: "Matériel informatique",
    date: "5 Mars 2026",
    status: "rejected",
    statusLabel: "Refusée",
    urgency: "Normal",
    items: [{ id: 1, name: "Souris sans fil", quantity: 1, reference: "SOU-WL-01" }],
    justification: "Remplacement souris défectueuse",
    approver: "Ahmed Benali",
    approvalDate: "6 Mars 2026",
    rejectionReason: "Budget dépassé pour ce mois. Veuillez resoumettre le mois prochain.",
  },
]

export function RequestsProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<Request[]>(initialRequests)

  const addRequest = (request: Request) =>
    setRequests((prev) => [request, ...prev])

  const updateRequest = (id: string, updates: Partial<Request>) =>
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    )

  const deleteRequest = (id: string) =>
    setRequests((prev) => prev.filter((r) => r.id !== id))

  return (
    <RequestsContext.Provider value={{ requests, addRequest, updateRequest, deleteRequest }}>
      {children}
    </RequestsContext.Provider>
  )
}

export function useRequests() {
  const ctx = useContext(RequestsContext)
  if (!ctx) throw new Error("useRequests must be used inside RequestsProvider")
  return ctx
}