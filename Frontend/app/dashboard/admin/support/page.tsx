'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Search,
  ChevronRight,
  MessageSquare,
  Zap,
  FileText,
  X,
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ArrowUpDown,
  User,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { ticketService, TicketResponse } from '@/services/ticket.service';

// Couleurs pour les priorités
const priorityColors: Record<string, string> = {
  CRITIQUE: 'bg-red-100 text-red-800 border-red-300',
  HAUTE: 'bg-orange-100 text-orange-800 border-orange-300',
  NORMALE: 'bg-blue-100 text-blue-800 border-blue-300',
  BASSE: 'bg-green-100 text-green-800 border-green-300',
};

// Couleurs pour les statuts (utilisées dans les badges et les boutons)
const statusColors: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
  EN_COURS: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  RESOLU: 'bg-green-100 text-green-800 hover:bg-green-200',
};

const statusIcons: Record<string, any> = {
  EN_ATTENTE: AlertCircle,
  EN_COURS: Clock,
  RESOLU: CheckCircle2,
};

const priorityOrder = { CRITIQUE: 0, HAUTE: 1, NORMALE: 2, BASSE: 3 };

export default function AdminTicketsPage() {
  const [allTickets, setAllTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketResponse | null>(null);
  const [showTicketDetail, setShowTicketDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [responseText, setResponseText] = useState('');
  const [sortField, setSortField] = useState<'date' | 'priorite'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [editingSolution, setEditingSolution] = useState(false);
  const [editSolutionText, setEditSolutionText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Statistiques globales
  const dashboard = useMemo(() => {
    const total = allTickets.length;
    const enAttente = allTickets.filter(t => t.statut === 'EN_ATTENTE').length;
    const enCours = allTickets.filter(t => t.statut === 'EN_COURS').length;
    const resolus = allTickets.filter(t => t.statut === 'RESOLU').length;
    const critique = allTickets.filter(t => t.priorite === 'CRITIQUE').length;
    const haute = allTickets.filter(t => t.priorite === 'HAUTE').length;
    const normale = allTickets.filter(t => t.priorite === 'NORMALE').length;
    const basse = allTickets.filter(t => t.priorite === 'BASSE').length;
    return {
      totalTickets: total,
      ticketsOuverts: enAttente,
      ticketsEnCours: enCours,
      ticketsResolus: resolus,
      ticketsParPriorite: { CRITIQUE: critique, HAUTE: haute, NORMALE: normale, BASSE: basse },
    };
  }, [allTickets]);

  // Filtrage local (recherche, statut, priorité, dates, tri)
  const filteredTickets = useMemo(() => {
    return allTickets
      .filter(ticket => {
        const matchSearch = searchTerm === '' ||
          ticket.sujet.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.utilisateurNom && ticket.utilisateurNom.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchStatus = filterStatus === 'all' || ticket.statut === filterStatus;
        const matchPriority = filterPriority === 'all' || ticket.priorite === filterPriority;
        let matchDate = true;
        if (startDate) {
          const ticketDate = new Date(ticket.dateCreation).toISOString().split('T')[0];
          if (ticketDate < startDate) matchDate = false;
        }
        if (endDate) {
          const ticketDate = new Date(ticket.dateCreation).toISOString().split('T')[0];
          if (ticketDate > endDate) matchDate = false;
        }
        return matchSearch && matchStatus && matchPriority && matchDate;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const dateA = new Date(a.dateCreation).getTime();
          const dateB = new Date(b.dateCreation).getTime();
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        } else {
          const orderA = priorityOrder[a.priorite as keyof typeof priorityOrder];
          const orderB = priorityOrder[b.priorite as keyof typeof priorityOrder];
          return sortOrder === 'desc' ? orderB - orderA : orderA - orderB;
        }
      });
  }, [allTickets, searchTerm, filterStatus, filterPriority, startDate, endDate, sortField, sortOrder]);

  const fetchAllTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ticketService.getAllTickets();
      setAllTickets(data);
    } catch (error) {
      toast.error('Erreur de chargement des tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTickets();
  }, [fetchAllTickets]);

const handleSaveSolution = async () => {
  if (!selectedTicket) return;
  try {
    let updated;
    if (selectedTicket.statut === 'RESOLU') {
      if (!responseText.trim()) {
        toast.error('Veuillez saisir une solution');
        return;
      }
      updated = await ticketService.modifierReponse(selectedTicket.id, responseText);
      toast.success('Solution enregistrée');
    } else {
      if (responseText.trim()) {
        updated = await ticketService.repondreTicket(selectedTicket.id, responseText);
        toast.success('Ticket résolu avec solution');
      } else {
        updated = await ticketService.changerStatut(selectedTicket.id, 'RESOLU');
        toast.success('Ticket résolu sans solution');
      }
    }
    setAllTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTicket(updated);
    setResponseText('');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erreur');
  }
};

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;
    try {
      const updated = await ticketService.changerStatut(selectedTicket.id, status);
      setAllTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      setSelectedTicket(updated);
      toast.success(`Statut mis à jour en ${getStatusLabel(status)}`);
      // Si on repasse en non résolu, effacer le texte de solution dans le champ
      if (status !== 'RESOLU') {
        setResponseText('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

    const handleModifySolution = async () => {
    if (!selectedTicket || !editSolutionText.trim()) return;
    try {
        const updated = await ticketService.modifierReponse(selectedTicket.id, editSolutionText);
        setAllTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
        setSelectedTicket(updated);
        setEditingSolution(false);
        toast.success('Solution modifiée avec succès');
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    }
    };

  const handleDeleteSolution = async () => {
  if (!selectedTicket) return;
  try {
    await ticketService.supprimerReponse(selectedTicket.id);
    // Mettre à jour localement : on conserve la date de résolution inchangée
    const updated = { ...selectedTicket, reponse: null };
    setAllTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTicket(updated);
    setShowDeleteConfirm(false);
    toast.success('Solution supprimée');
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
  }
};

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = { EN_ATTENTE: 'En attente', EN_COURS: 'En cours', RESOLU: 'Résolu' };
    return labels[statut] || statut;
  };

  const getStatusIcon = (statut: string) => {
    const Icon = statusIcons[statut] || AlertCircle;
    return <Icon className="w-4 h-4" />;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterPriority('all');
    setStartDate('');
    setEndDate('');
    setSortField('date');
    setSortOrder('desc');
  };

  const toggleSort = (field: 'date' | 'priorite') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  if (loading && allTickets.length === 0) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;
  }

  const statutCards = [
    { key: 'all', label: 'Total', value: dashboard.totalTickets, icon: FileText, color: 'text-blue-500', bgIcon: 'bg-blue-100' },
    { key: 'EN_ATTENTE', label: 'En attente', value: dashboard.ticketsOuverts, icon: AlertCircle, color: 'text-amber-500', bgIcon: 'bg-amber-100' },
    { key: 'EN_COURS', label: 'En cours', value: dashboard.ticketsEnCours, icon: Clock, color: 'text-blue-500', bgIcon: 'bg-blue-100' },
    { key: 'RESOLU', label: 'Résolus', value: dashboard.ticketsResolus, icon: CheckCircle2, color: 'text-green-500', bgIcon: 'bg-green-100' },
  ];

  const prioriteCards = [
    { key: 'CRITIQUE', label: 'Critique', value: dashboard.ticketsParPriorite.CRITIQUE, icon: Zap, color: 'text-red-600', bgIcon: 'bg-red-100' },
    { key: 'HAUTE', label: 'Haute', value: dashboard.ticketsParPriorite.HAUTE, icon: Zap, color: 'text-orange-600', bgIcon: 'bg-orange-100' },
    { key: 'NORMALE', label: 'Normale', value: dashboard.ticketsParPriorite.NORMALE, icon: Zap, color: 'text-blue-600', bgIcon: 'bg-blue-100' },
    { key: 'BASSE', label: 'Basse', value: dashboard.ticketsParPriorite.BASSE, icon: Zap, color: 'text-green-600', bgIcon: 'bg-green-100' },
  ];

  const handleStatusClick = (statusKey: string) => setFilterStatus(statusKey);
  const handlePriorityClick = (priorityKey: string) => setFilterPriority(prev => prev === priorityKey ? 'all' : priorityKey);

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Tickets</h1>
          <p className="text-muted-foreground mt-1">Gérez et suivez tous les tickets de support IT</p>
        </div>
        <Button variant="outline" onClick={fetchAllTickets}>
          <RefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
        </Button>
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap items-stretch gap-3">
        <div className="flex flex-1 flex-wrap gap-3">
          {statutCards.map(card => (
            <Card key={card.key} className={`flex-1 min-w-[100px] border-0 shadow-sm cursor-pointer hover:shadow-md transition-all ${filterStatus === card.key ? 'ring-2 ring-primary shadow-md' : ''}`} onClick={() => handleStatusClick(card.key)}>
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-2"><div className={`p-2 rounded-full ${card.bgIcon}`}><card.icon className={`w-5 h-5 ${card.color}`} /></div></div>
                <p className="text-2xl font-bold">{card.value}</p><p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="hidden lg:flex items-center"><div className="h-12 w-px bg-gray-200"></div></div>
        <div className="lg:hidden w-full border-t border-gray-200 my-2"></div>
        <div className="flex flex-1 flex-wrap gap-3">
          {prioriteCards.map(card => (
            <Card key={card.key} className={`flex-1 min-w-[100px] border-0 shadow-sm cursor-pointer hover:shadow-md transition-all ${filterPriority === card.key ? 'ring-2 ring-primary shadow-md' : ''}`} onClick={() => handlePriorityClick(card.key)}>
              <CardContent className="p-3 text-center">
                <div className="flex justify-center mb-2"><div className={`p-2 rounded-full ${card.bgIcon}`}><card.icon className={`w-5 h-5 ${card.color}`} /></div></div>
                <p className="text-2xl font-bold">{card.value}</p><p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filtres avancés */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Rechercher (sujet, description, demandeur)..." className="pl-10" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="EN_COURS">En cours</SelectItem>
                <SelectItem value="RESOLU">Résolu</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Priorité" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="CRITIQUE">Critique</SelectItem>
                <SelectItem value="HAUTE">Haute</SelectItem>
                <SelectItem value="NORMALE">Normale</SelectItem>
                <SelectItem value="BASSE">Basse</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input type="date" placeholder="Date début" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-36" />
              <Input type="date" placeholder="Date fin" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-36" />
            </div>
            <Button variant="outline" onClick={resetFilters}><X className="w-4 h-4 mr-2" /> Réinitialiser</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des tickets */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Tickets ({filteredTickets.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => toggleSort('date')} className="gap-1">
              <Calendar className="w-4 h-4" /> Date {sortField === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleSort('priorite')} className="gap-1">
              <Zap className="w-4 h-4" /> Priorité {sortField === 'priorite' && (sortOrder === 'desc' ? '↓' : '↑')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead><TableHead>Sujet</TableHead><TableHead>Demandeur</TableHead>
                  <TableHead>Priorité</TableHead><TableHead>Statut</TableHead><TableHead>Catégorie</TableHead>
                  <TableHead>Créé le</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-12"><p className="text-muted-foreground">Aucun ticket correspondant</p></TableCell></TableRow>
                ) : (
                  filteredTickets.map(ticket => (
                    <TableRow key={ticket.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedTicket(ticket); setShowTicketDetail(true); }}>
                      <TableCell className="font-mono font-semibold">#{ticket.id}</TableCell>
                      <TableCell><p className="font-medium">{ticket.sujet}</p><p className="text-xs text-muted-foreground break-words">{ticket.description}</p></TableCell>
                      <TableCell><p className="font-medium">{ticket.utilisateurNom || 'Inconnu'}</p></TableCell>
                      <TableCell><Badge className={`border ${priorityColors[ticket.priorite]}`}>{ticket.priorite}</Badge></TableCell>
                      <TableCell><div className="flex items-center gap-2">{getStatusIcon(ticket.statut)}<Badge className={statusColors[ticket.statut]}>{getStatusLabel(ticket.statut)}</Badge></div></TableCell>
                      <TableCell><Badge variant="secondary">{ticket.categorie}</Badge></TableCell>
                      <TableCell><p className="text-sm">{new Date(ticket.dateCreation).toLocaleDateString('fr-FR')}</p></TableCell>
                      <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

{/* Dialogue de détail du ticket - version finale avec dates sur deux lignes et hover doux */}
<Dialog open={showTicketDetail} onOpenChange={setShowTicketDetail}>
  <DialogContent className="max-w-6xl w-[90vw] h-[85vh] min-h-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 gap-0 bg-white/95 backdrop-blur-sm scrollbar-none">
    {selectedTicket && (
      <>
        {/* Header sticky */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b px-6 py-5 flex items-center justify-between rounded-t-2xl">
          <div>
            <DialogTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Ticket #{selectedTicket.id}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">{selectedTicket.sujet}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`text-sm px-4 py-1.5 shadow-sm ${priorityColors[selectedTicket.priorite]}`}>
              {selectedTicket.priorite}
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => setShowTicketDetail(false)} className="rounded-full h-8 w-8 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Corps avec onglets */}
        <div className="px-6 pt-4 pb-6 overflow-x-hidden">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="reponses">Solution</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>

            {/* Onglet Détails */}
            <TabsContent value="details" className="mt-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-gray-50/40 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Demandeur</p>
                      <p className="text-sm font-medium text-gray-800 break-all">{selectedTicket.utilisateurNom || 'Inconnu'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50/40 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Catégorie</p>
                      <p className="text-sm font-medium text-gray-800 capitalize break-all">{selectedTicket.categorie}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50/40 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date de création</p>
                      <div className="text-sm font-medium text-gray-800">
                        <div>{new Date(selectedTicket.dateCreation).toLocaleDateString('fr-FR')}</div>
                        <div className="text-xs text-gray-500">{new Date(selectedTicket.dateCreation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedTicket.dateReponse && (
                  <div className="bg-gray-50/40 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date de résolution</p>
                        <div className="text-sm font-medium text-gray-800">
                          <div>{new Date(selectedTicket.dateReponse).toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs text-gray-500">{new Date(selectedTicket.dateReponse).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-6 overflow-x-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description initiale</h3>
                </div>
                <div className="prose prose-sm max-w-none text-gray-600 whitespace-pre-wrap break-all leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>
            </TabsContent>

            {/* Onglet Solution */}
            <TabsContent value="reponses" className="mt-4 space-y-5">
              {selectedTicket.reponse ? (
                <div className="rounded-2xl border border-green-100 bg-green-50/40 p-6 shadow-sm overflow-x-hidden">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
                      <h3 className="font-semibold text-green-800">Solution apportée</h3>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditSolutionText(selectedTicket.reponse || '');
                          setEditingSolution(true);
                        }}
                        className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                  {editingSolution ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editSolutionText}
                        onChange={(e) => setEditSolutionText(e.target.value)}
                        rows={4}
                        className="resize-none break-all w-full"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setEditingSolution(false)}>Annuler</Button>
                        <Button size="sm" onClick={handleModifySolution}>Enregistrer</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap break-all border border-green-100">
                        {selectedTicket.reponse}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 break-all">
                        Résolu le {selectedTicket.dateReponse ? new Date(selectedTicket.dateReponse).toLocaleString('fr-FR') : ''}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-8 text-center">
                  <p className="text-muted-foreground">Aucune solution enregistrée pour ce ticket.</p>
                </div>
              )}

              {/* Dialogue de confirmation suppression */}
              <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Confirmer la suppression</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-gray-600">
                    Êtes-vous sûr de vouloir supprimer cette solution ? Cette action est irréversible.
                  </p>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                    <Button variant="destructive" onClick={handleDeleteSolution}>Supprimer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Onglet Actions */}
            <TabsContent value="actions" className="mt-4 space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-primary shrink-0" /> Modifier le statut
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['EN_ATTENTE', 'EN_COURS', 'RESOLU'].map(status => (
                    <Button
                      key={status}
                      variant={selectedTicket.statut === status ? 'default' : 'outline'}
                      className={`rounded-full px-4 ${selectedTicket.statut === status ? statusColors[status] : ''}`}
                      onClick={() => handleUpdateStatus(status)}
                    >
                      {getStatusLabel(status)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm overflow-x-hidden">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {selectedTicket.statut === 'RESOLU' ? 'Ajouter / modifier la solution' : 'Résoudre le ticket'}
                </h3>
                <Textarea
                  placeholder={selectedTicket.statut === 'RESOLU' 
                    ? "Ajoutez ou modifiez la solution (optionnelle)..."
                    : "Décrivez la solution apportée (optionnelle)..."
                  }
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  rows={4}
                  className="resize-none rounded-xl border-gray-200 focus:border-primary break-all w-full"
                />
                <Button
                  onClick={handleSaveSolution}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  disabled={selectedTicket.statut === 'RESOLU' && !responseText.trim()}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {selectedTicket.statut === 'RESOLU' ? 'Enregistrer la solution' : 'Marquer comme résolu'}
                </Button>
              </div>
            </TabsContent>

            {/* Onglet Contact */}
            <TabsContent value="contact" className="mt-4 space-y-5">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm overflow-x-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-gray-800">Contacter l'employé</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {selectedTicket.utilisateurEmail ? (
                    <a
                      href={`mailto:${selectedTicket.utilisateurEmail}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span className="break-all">{selectedTicket.utilisateurEmail}</span>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>Non renseigné</span>
                    </div>
                  )}
                  {selectedTicket.utilisateurTelephone ? (
                    <a
                      href={`tel:${selectedTicket.utilisateurTelephone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      {selectedTicket.utilisateurTelephone}
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>Non renseigné</span>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Pied de dialogue */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t px-6 py-3 flex justify-end rounded-b-2xl">
          <Button variant="ghost" onClick={() => setShowTicketDetail(false)} className="rounded-full">Fermer</Button>
        </div>
      </>
    )}
      </DialogContent>
     </Dialog>
    </div>
  );
}