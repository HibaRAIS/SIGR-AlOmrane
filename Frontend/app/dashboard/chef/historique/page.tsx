"use client";

import { useState } from "react";
import {
  CheckCircle2, XCircle, Clock, Search, Filter, Download, ChevronDown,
  User, Calendar, Package, FileText, ArrowRight, MoreVertical
} from "lucide-react";

const AL_OMRANE_GREEN = "#1D6F42";

interface Decision {
  id: string;
  number: string;
  requester: string;
  department: string;
  articles: number;
  status: "approved" | "rejected" | "pending";
  date: string;
  items: string[];
  reason?: string;
  notes?: string;
}

interface DecisionStats {
  total: number;
  approved: number;
  rejected: number;
  pendingReview: number;
}

const getStatusIcon = (status: string) => {
  switch(status) {
    case "approved": return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    case "rejected": return <XCircle className="w-5 h-5 text-red-600" />;
    case "pending": return <Clock className="w-5 h-5 text-amber-600" />;
    default: return null;
  }
};

const getStatusLabel = (status: string) => {
  switch(status) {
    case "approved": return "Approuvée";
    case "rejected": return "Rejetée";
    case "pending": return "En attente";
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch(status) {
    case "approved": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected": return "bg-red-50 text-red-700 border-red-200";
    case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
    default: return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

export default function HistoriqueDecisions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const decisions: Decision[] = [
    {
      id: "1",
      number: "DEC-2024-001",
      requester: "Mohamed Bennani",
      department: "Approvisionnement",
      articles: 12,
      status: "approved",
      date: "2024-04-12",
      items: ["Ciment", "Acier", "Bois de construction"],
      notes: "Approuvé - Conforme aux normes qualité"
    },
    {
      id: "2",
      number: "DEC-2024-002",
      requester: "Fatima Al Rashid",
      department: "Maintenance",
      articles: 8,
      status: "approved",
      date: "2024-04-11",
      items: ["Peinture", "Outils"],
      notes: "Approuvé - Stock réapprovisionné"
    },
    {
      id: "3",
      number: "DEC-2024-003",
      requester: "Hassan Aziz",
      department: "Électricité",
      articles: 15,
      status: "rejected",
      date: "2024-04-10",
      items: ["Câbles électriques", "Transformateurs", "Disjoncteurs"],
      reason: "Dépassement du budget alloué - Recommandé de réviser la demande",
      notes: "Renvoyé pour ajustement des quantités"
    },
    {
      id: "4",
      number: "DEC-2024-004",
      requester: "Leila Saïdi",
      department: "Hygiène",
      articles: 6,
      status: "approved",
      date: "2024-04-09",
      items: ["Produits de nettoyage", "Équipements de sécurité"],
      notes: "Approuvé - Priorité sécurité maintenue"
    },
    {
      id: "5",
      number: "DEC-2024-005",
      requester: "Ahmed Hassan",
      department: "Approvisionnement",
      articles: 20,
      status: "pending",
      date: "2024-04-08",
      items: ["Granulats", "Ciment blanc", "Additifs"],
      notes: "En attente de validation RH"
    },
    {
      id: "6",
      number: "DEC-2024-006",
      requester: "Samir Benali",
      department: "Logistique",
      articles: 5,
      status: "approved",
      date: "2024-04-07",
      items: ["Véhicules de transport"],
      notes: "Approuvé - Livraison prévue 15/04"
    },
    {
      id: "7",
      number: "DEC-2024-007",
      requester: "Nadia Jouini",
      department: "Qualité",
      articles: 3,
      status: "approved",
      date: "2024-04-06",
      items: ["Équipements de test"],
      notes: "Approuvé - Livraison confirmée"
    },
    {
      id: "8",
      number: "DEC-2024-008",
      requester: "Khaled Mansouri",
      department: "Maintenance",
      articles: 9,
      status: "rejected",
      date: "2024-04-05",
      items: ["Pièces de rechange", "Huiles"],
      reason: "Doublon détecté - Même demande soumise le 03/04",
      notes: "Fusionner avec demande précédente"
    },
    {
      id: "9",
      number: "DEC-2024-009",
      requester: "Lamia Khelili",
      department: "Approvisionnement",
      articles: 11,
      status: "approved",
      date: "2024-04-04",
      items: ["Matériaux de construction"],
      notes: "Approuvé - Conforme aux spécifications"
    },
    {
      id: "10",
      number: "DEC-2024-010",
      requester: "Ziad Chakroun",
      department: "Électricité",
      articles: 7,
      status: "pending",
      date: "2024-04-03",
      items: ["Câbles haute tension"],
      notes: "En attente de devis fournisseur"
    },
    {
      id: "11",
      number: "DEC-2024-011",
      requester: "Salma Azzouz",
      department: "Hygiène",
      articles: 4,
      status: "approved",
      date: "2024-04-02",
      items: ["Équipements de sécurité"],
      notes: "Approuvé - Stock minimal atteint"
    },
    {
      id: "12",
      number: "DEC-2024-012",
      requester: "Omar Bouslama",
      department: "Logistique",
      articles: 18,
      status: "approved",
      date: "2024-04-01",
      items: ["Équipements de manutention"],
      notes: "Approuvé - Améliore la productivité"
    }
  ];

  const stats: DecisionStats = {
    total: decisions.length,
    approved: decisions.filter(d => d.status === "approved").length,
    rejected: decisions.filter(d => d.status === "rejected").length,
    pendingReview: decisions.filter(d => d.status === "pending").length
  };

  const filteredDecisions = decisions.filter(decision => {
    const matchesSearch = 
      decision.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decision.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      decision.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || decision.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const paginatedDecisions = filteredDecisions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredDecisions.length / itemsPerPage);

  return (
    <div className="w-full bg-white">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historique des Décisions</h1>
            <p className="text-sm text-gray-500 mt-1">Suivi complet de toutes les demandes d&apos;approvisionnement</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">Demandes traitées</p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-1">Approuvées</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
            <p className="text-xs text-emerald-600 mt-1">{((stats.approved / stats.total) * 100).toFixed(0)}% du total</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-semibold text-red-700 mb-1">Rejetées</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            <p className="text-xs text-red-600 mt-1">{((stats.rejected / stats.total) * 100).toFixed(0)}% du total</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">En Attente</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pendingReview}</p>
            <p className="text-xs text-amber-600 mt-1">À traiter</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="px-6 py-4 border-b border-gray-100 flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro, demandeur ou département..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <option value="all">Tous les statuts</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Rejetées</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Decisions List */}
      <div className="px-6 py-6">
        <div className="space-y-3">
          {paginatedDecisions.map((decision) => (
            <div
              key={decision.id}
              className="rounded-xl border border-gray-200 bg-white hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Main Row */}
              <div
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {getStatusIcon(decision.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{decision.number}</p>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getStatusColor(decision.status)}`}>
                        {getStatusLabel(decision.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {decision.requester}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {decision.department}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        {decision.articles} articles
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(decision.date).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <button className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === decision.id ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === decision.id && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Articles demandés</p>
                      <div className="flex flex-wrap gap-2">
                        {decision.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {decision.reason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs font-semibold text-red-700 mb-1">Motif du rejet</p>
                        <p className="text-xs text-red-600">{decision.reason}</p>
                      </div>
                    )}

                    {decision.notes && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Notes</p>
                        <p className="text-xs text-blue-600">{decision.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText className="w-3 h-3" />
                        Voir le détail
                      </button>
                      {decision.status !== "approved" && (
                        <button
                          className="flex-1 px-4 py-2 rounded-lg text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                          style={{ backgroundColor: AL_OMRANE_GREEN }}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approuver
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredDecisions.length)} sur {filteredDecisions.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === idx + 1
                      ? "bg-gray-900 text-white"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
