import type {
  Categorie, Rayon, Fournisseur, Produit, Demande, BonSortie,
  CommandeFournisseur, Reception, JournalMouvement, AlerteStock,
  KPIData, MouvementChart, TopCategorie
} from '@/types/index';

export const categories: Categorie[] = [
  { id: 'cat-1', code: 'BUREAU', libelle: 'Fournitures de Bureau', description: 'Articles de papeterie et bureau', couleur: '#1D6F42', icone: 'Briefcase', createdAt: new Date('2024-01-01') },
  { id: 'cat-2', code: 'INFORM', libelle: 'Informatique & Bureautique', description: 'Matériel informatique', couleur: '#1565C0', icone: 'Monitor', createdAt: new Date('2024-01-01') },
  { id: 'cat-3', code: 'HYGIENE', libelle: 'Hygiène & Entretien', description: 'Produits d\'entretien', couleur: '#E65100', icone: 'Sparkles', createdAt: new Date('2024-01-01') },
  { id: 'cat-4', code: 'MOBIL', libelle: 'Mobilier & Aménagement', description: 'Mobilier de bureau', couleur: '#6A1B9A', icone: 'Armchair', createdAt: new Date('2024-01-01') },
  { id: 'cat-5', code: 'ELEC', libelle: 'Électricité & Maintenance', description: 'Matériel électrique', couleur: '#F9A825', icone: 'Zap', createdAt: new Date('2024-01-01') },
  { id: 'cat-6', code: 'PLOMB', libelle: 'Plomberie & Sanitaire', description: 'Équipements sanitaires', couleur: '#00838F', icone: 'Droplets', createdAt: new Date('2024-01-01') },
  { id: 'cat-7', code: 'VEHIC', libelle: 'Véhicules & Transport', description: 'Pièces et accessoires', couleur: '#558B2F', icone: 'Car', createdAt: new Date('2024-01-01') },
  { id: 'cat-8', code: 'SECU', libelle: 'Sécurité & Protection', description: 'EPI et sécurité', couleur: '#B71C1C', icone: 'Shield', createdAt: new Date('2024-01-01') },
];

export const rayons: Rayon[] = [
  { id: 'ray-1', code: 'R01', libelle: 'Rayon A - Fournitures', superficie: 45, capacite: 500, createdAt: new Date('2024-01-01') },
  { id: 'ray-2', code: 'R02', libelle: 'Rayon B - Informatique', superficie: 30, capacite: 200, createdAt: new Date('2024-01-01') },
  { id: 'ray-3', code: 'R03', libelle: 'Rayon C - Entretien', superficie: 60, capacite: 800, createdAt: new Date('2024-01-01') },
  { id: 'ray-4', code: 'R04', libelle: 'Rayon D - Mobilier', superficie: 120, capacite: 150, createdAt: new Date('2024-01-01') },
  { id: 'ray-5', code: 'R05', libelle: 'Rayon E - Électricité', superficie: 40, capacite: 600, createdAt: new Date('2024-01-01') },
  { id: 'ray-6', code: 'R06', libelle: 'Rayon F - Divers', superficie: 50, capacite: 700, createdAt: new Date('2024-01-01') },
];

export const fournisseurs: Fournisseur[] = [
  { id: 'f-1', code: 'FRNR001', raisonSociale: 'PAPECO MAROC SARL', ice: '001234567000012', if: '12345678', rc: 'RC-2018-001', telephone: '+212522234567', email: 'contact@papeco.ma', adresse: 'Zone Industrielle Aïn Sebaâ, Lot 45', ville: 'Casablanca', pays: 'Maroc', actif: true, createdAt: new Date('2022-01-15'), updatedAt: new Date('2024-06-01') },
  { id: 'f-2', code: 'FRNR002', raisonSociale: 'TECHNO SOLUTIONS MAGHREB', ice: '002345678000023', if: '23456789', rc: 'RC-2019-045', telephone: '+212537567890', email: 'info@technosol.ma', adresse: 'Rue de Fès, Hay Riad, Imm B', ville: 'Rabat', pays: 'Maroc', actif: true, createdAt: new Date('2022-03-20'), updatedAt: new Date('2024-05-15') },
  { id: 'f-3', code: 'FRNR003', raisonSociale: 'CLEAN MAROC DISTRIBUTION', ice: '003456789000034', if: '34567890', rc: 'RC-2017-123', telephone: '+212528345678', email: 'ventes@cleanmaroc.ma', adresse: 'Bd Mohammed V, Résidence Atlas', ville: 'Casablanca', pays: 'Maroc', actif: true, createdAt: new Date('2021-06-10'), updatedAt: new Date('2024-04-20') },
  { id: 'f-4', code: 'FRNR004', raisonSociale: 'MOBILIER ROYAL MAROC', ice: '004567890000045', if: '45678901', rc: 'RC-2020-067', telephone: '+212535678901', email: 'commercial@mobilierroyal.ma', adresse: 'Zone Industrielle Sidi Bernoussi, Rue 12', ville: 'Casablanca', pays: 'Maroc', actif: true, createdAt: new Date('2023-01-05'), updatedAt: new Date('2024-03-10') },
  { id: 'f-5', code: 'FRNR005', raisonSociale: 'ELECTRO MAGHREB SARL', ice: '005678901000056', if: '56789012', rc: 'RC-2016-234', telephone: '+212522456789', email: 'direction@electromaghreb.ma', adresse: 'ZI Moulay Rachid, Zone A, Lot 8', ville: 'Casablanca', pays: 'Maroc', actif: true, createdAt: new Date('2020-09-15'), updatedAt: new Date('2024-06-05') },
  { id: 'f-6', code: 'FRNR006', raisonSociale: 'SECURIT PLUS MAROC', ice: '006789012000067', if: '67890123', rc: 'RC-2021-089', telephone: '+212537123456', email: 'securite@securitplus.ma', adresse: 'Avenue Hassan II, Imm Oumnia, Bureau 304', ville: 'Rabat', pays: 'Maroc', actif: false, createdAt: new Date('2021-11-20'), updatedAt: new Date('2024-01-08') },
];

export const produits: Produit[] = [
  { id: 'p-1', codeArticle: 'ART-2024-001', designation: 'Ramette de papier A4 80g/m²', description: 'Papier blanc multifonction pour imprimante laser et jet d\'encre, 500 feuilles/ramette', categorieId: 'cat-1', categorie: categories[0], rayonEmplacementId: 'ray-1', rayon: rayons[0], uniteMesure: 'Ramette', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 100, quantiteMax: 2000, quantiteACommander: 500, stockDisponible: 850, stockReserve: 120, pmpActuel: 28.50, fournisseurPrincipalId: 'f-1', fournisseur: fournisseurs[0], statutStock: 'OK', createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-06-10') },
  { id: 'p-2', codeArticle: 'ART-2024-002', designation: 'Stylo bille Bic Cristal bleu - Boîte 50', description: 'Stylos bille pointe moyenne, encre bleue, boîte de 50 pièces', categorieId: 'cat-1', categorie: categories[0], rayonEmplacementId: 'ray-1', rayon: rayons[0], uniteMesure: 'Boîte', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 20, quantiteMax: 500, quantiteACommander: 100, stockDisponible: 45, stockReserve: 10, pmpActuel: 52.00, fournisseurPrincipalId: 'f-1', fournisseur: fournisseurs[0], statutStock: 'FAIBLE', createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-06-12') },
  { id: 'p-3', codeArticle: 'ART-2024-003', designation: 'Cartouche toner HP LaserJet - Noir', description: 'Cartouche toner noire compatible HP LaserJet Pro MFP, rendement 2100 pages', categorieId: 'cat-2', categorie: categories[1], rayonEmplacementId: 'ray-2', rayon: rayons[1], uniteMesure: 'Pièce', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 10, quantiteMax: 100, quantiteACommander: 30, stockDisponible: 8, stockReserve: 2, pmpActuel: 285.00, fournisseurPrincipalId: 'f-2', fournisseur: fournisseurs[1], statutStock: 'CRITIQUE', createdAt: new Date('2024-02-05'), updatedAt: new Date('2024-06-15') },
  { id: 'p-4', codeArticle: 'ART-2024-004', designation: 'Produit de nettoyage multi-surfaces 5L', description: 'Nettoyant désinfectant concentré toutes surfaces, flacon 5 litres, parfum pin', categorieId: 'cat-3', categorie: categories[2], rayonEmplacementId: 'ray-3', rayon: rayons[2], uniteMesure: 'Bidon', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 50, quantiteMax: 500, quantiteACommander: 200, stockDisponible: 0, stockReserve: 0, pmpActuel: 35.00, fournisseurPrincipalId: 'f-3', fournisseur: fournisseurs[2], statutStock: 'RUPTURE', createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-06-08') },
  { id: 'p-5', codeArticle: 'ART-2024-005', designation: 'Chaise de bureau ergonomique - Réglable', description: 'Fauteuil de bureau avec accoudoirs, réglable en hauteur, assise rembourée tissu gris', categorieId: 'cat-4', categorie: categories[3], rayonEmplacementId: 'ray-4', rayon: rayons[3], uniteMesure: 'Pièce', estConsignable: true, estTaxable: true, tauxTVA: 20, quantiteMin: 5, quantiteMax: 50, quantiteACommander: 15, stockDisponible: 12, stockReserve: 3, pmpActuel: 850.00, fournisseurPrincipalId: 'f-4', fournisseur: fournisseurs[3], statutStock: 'OK', createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-05-30') },
  { id: 'p-6', codeArticle: 'ART-2024-006', designation: 'Câble électrique 2.5mm² - Rouleau 100m', description: 'Câble électrique rigide U1000R2V 3G2.5mm², âme cuivre, rouleau 100 mètres', categorieId: 'cat-5', categorie: categories[4], rayonEmplacementId: 'ray-5', rayon: rayons[4], uniteMesure: 'Rouleau', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 10, quantiteMax: 100, quantiteACommander: 30, stockDisponible: 25, stockReserve: 5, pmpActuel: 420.00, fournisseurPrincipalId: 'f-5', fournisseur: fournisseurs[4], statutStock: 'OK', createdAt: new Date('2024-02-15'), updatedAt: new Date('2024-06-01') },
  { id: 'p-7', codeArticle: 'ART-2024-007', designation: 'Classeur A4 à levier - Dos 8cm', description: 'Classeur rigide avec mécanisme à levier, capacité 600 feuilles, disponible en plusieurs couleurs', categorieId: 'cat-1', categorie: categories[0], rayonEmplacementId: 'ray-1', rayon: rayons[0], uniteMesure: 'Pièce', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 50, quantiteMax: 1000, quantiteACommander: 200, stockDisponible: 320, stockReserve: 40, pmpActuel: 12.00, fournisseurPrincipalId: 'f-1', fournisseur: fournisseurs[0], statutStock: 'OK', createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-06-10') },
  { id: 'p-8', codeArticle: 'ART-2024-008', designation: 'Savon liquide pour les mains - Recharge 5L', description: 'Savon liquide antibactérien pH neutre, parfum fleur, conditionnement recharge 5 litres', categorieId: 'cat-3', categorie: categories[2], rayonEmplacementId: 'ray-3', rayon: rayons[2], uniteMesure: 'Bidon', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 30, quantiteMax: 300, quantiteACommander: 100, stockDisponible: 18, stockReserve: 5, pmpActuel: 45.00, fournisseurPrincipalId: 'f-3', fournisseur: fournisseurs[2], statutStock: 'FAIBLE', createdAt: new Date('2024-01-25'), updatedAt: new Date('2024-06-13') },
  { id: 'p-9', codeArticle: 'ART-2024-009', designation: 'Bureau direction en bois massif - 160x80', description: 'Bureau de direction en bois massif chêne, plateau 160x80cm, 3 tiroirs avec serrure', categorieId: 'cat-4', categorie: categories[3], rayonEmplacementId: 'ray-4', rayon: rayons[3], uniteMesure: 'Pièce', estConsignable: true, estTaxable: true, tauxTVA: 20, quantiteMin: 2, quantiteMax: 20, quantiteACommander: 5, stockDisponible: 3, stockReserve: 1, pmpActuel: 4500.00, fournisseurPrincipalId: 'f-4', fournisseur: fournisseurs[3], statutStock: 'FAIBLE', createdAt: new Date('2024-03-15'), updatedAt: new Date('2024-06-05') },
  { id: 'p-10', codeArticle: 'ART-2024-010', designation: 'Disjoncteur 16A - Courbe C', description: 'Disjoncteur magnéto-thermique bipolaire 16A courbe C, 230V, pour tableau électrique', categorieId: 'cat-5', categorie: categories[4], rayonEmplacementId: 'ray-5', rayon: rayons[4], uniteMesure: 'Pièce', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 20, quantiteMax: 200, quantiteACommander: 50, stockDisponible: -5, stockReserve: 0, pmpActuel: 38.00, fournisseurPrincipalId: 'f-5', fournisseur: fournisseurs[4], statutStock: 'RUPTURE', createdAt: new Date('2024-02-20'), updatedAt: new Date('2024-06-14') },
  { id: 'p-11', codeArticle: 'ART-2024-011', designation: 'Casque de protection chantier - Blanc', description: 'Casque de chantier conforme EN 397, réglage roue crantée, ventilation ajustable', categorieId: 'cat-8', categorie: categories[7], rayonEmplacementId: 'ray-6', rayon: rayons[5], uniteMesure: 'Pièce', estConsignable: true, estTaxable: true, tauxTVA: 20, quantiteMin: 20, quantiteMax: 200, quantiteACommander: 60, stockDisponible: 75, stockReserve: 15, pmpActuel: 85.00, fournisseurPrincipalId: 'f-6', fournisseur: fournisseurs[5], statutStock: 'OK', createdAt: new Date('2024-04-01'), updatedAt: new Date('2024-06-11') },
  { id: 'p-12', codeArticle: 'ART-2024-012', designation: 'Agrafeuse de bureau capacité 30 feuilles', description: 'Agrafeuse standard, capacité 30 feuilles, compatible agrafes 26/6 et 24/6', categorieId: 'cat-1', categorie: categories[0], rayonEmplacementId: 'ray-1', rayon: rayons[0], uniteMesure: 'Pièce', estConsignable: false, estTaxable: true, tauxTVA: 20, quantiteMin: 10, quantiteMax: 100, quantiteACommander: 30, stockDisponible: 42, stockReserve: 8, pmpActuel: 25.00, fournisseurPrincipalId: 'f-1', fournisseur: fournisseurs[0], statutStock: 'OK', createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-06-10') },
];

export const demandes: Demande[] = [
  {
    id: 'd-1', numero: 'DEM-2024-0045', demandeurId: 'u-1', demandeurNom: 'Ahmed Benali', departement: 'Direction Générale',
    valideurId: 'u-5', valideurNom: 'Mohammed Rachidi', priorite: 'URGENT', statut: 'VALIDEE',
    observations: 'Besoin urgent pour réunion directoire', dateCreation: new Date('2024-06-10'), dateValidation: new Date('2024-06-11'),
    lignes: [
      { id: 'ld-1', demandeId: 'd-1', produitId: 'p-1', produit: produits[0], quantiteDemandee: 20, quantiteValidee: 20 },
      { id: 'ld-2', demandeId: 'd-1', produitId: 'p-2', produit: produits[1], quantiteDemandee: 5, quantiteValidee: 5 },
    ]
  },
  {
    id: 'd-2', numero: 'DEM-2024-0046', demandeurId: 'u-2', demandeurNom: 'Fatima Zohra Idrissi', departement: 'Service Comptabilité',
    valideurId: 'u-5', valideurNom: 'Mohammed Rachidi', priorite: 'NORMAL', statut: 'VALIDEE',
    dateCreation: new Date('2024-06-11'), dateValidation: new Date('2024-06-12'),
    lignes: [
      { id: 'ld-3', demandeId: 'd-2', produitId: 'p-7', produit: produits[6], quantiteDemandee: 30, quantiteValidee: 30 },
      { id: 'ld-4', demandeId: 'd-2', produitId: 'p-12', produit: produits[11], quantiteDemandee: 8, quantiteValidee: 8 },
    ]
  },
  {
    id: 'd-3', numero: 'DEM-2024-0047', demandeurId: 'u-3', demandeurNom: 'Youssef Amine', departement: 'Direction Technique',
    valideurId: 'u-5', valideurNom: 'Mohammed Rachidi', priorite: 'CRITIQUE', statut: 'EN_PREPARATION',
    dateCreation: new Date('2024-06-12'), dateValidation: new Date('2024-06-12'),
    lignes: [
      { id: 'ld-5', demandeId: 'd-3', produitId: 'p-6', produit: produits[5], quantiteDemandee: 5, quantiteValidee: 5 },
      { id: 'ld-6', demandeId: 'd-3', produitId: 'p-10', produit: produits[9], quantiteDemandee: 20, quantiteValidee: 10 },
    ]
  },
  {
    id: 'd-4', numero: 'DEM-2024-0044', demandeurId: 'u-4', demandeurNom: 'Sara El Mansouri', departement: 'Service RH',
    valideurId: 'u-5', valideurNom: 'Mohammed Rachidi', priorite: 'NORMAL', statut: 'LIVREE',
    dateCreation: new Date('2024-06-08'), dateValidation: new Date('2024-06-09'), dateLivraison: new Date('2024-06-10'),
    lignes: [
      { id: 'ld-7', demandeId: 'd-4', produitId: 'p-8', produit: produits[7], quantiteDemandee: 10, quantiteValidee: 10, quantiteServie: 10 },
    ]
  },
  {
    id: 'd-5', numero: 'DEM-2024-0048', demandeurId: 'u-1', demandeurNom: 'Ahmed Benali', departement: 'Direction Générale',
    priorite: 'NORMAL', statut: 'EN_ATTENTE',
    dateCreation: new Date('2024-06-14'),
    lignes: [
      { id: 'ld-8', demandeId: 'd-5', produitId: 'p-3', produit: produits[2], quantiteDemandee: 5 },
      { id: 'ld-9', demandeId: 'd-5', produitId: 'p-5', produit: produits[4], quantiteDemandee: 3 },
    ]
  },
];

export const commandes: CommandeFournisseur[] = [
  {
    id: 'cmd-1', numero: 'BC-2024-0112', fournisseurId: 'f-1', fournisseur: fournisseurs[0],
    marchePublicRef: 'MP-2024-AOO-015', statut: 'RECU_PARTIEL',
    dateCommande: new Date('2024-05-15'), dateLivraisonPrevue: new Date('2024-06-15'),
    lignes: [
      { id: 'lcmd-1', commandeId: 'cmd-1', produitId: 'p-1', produit: produits[0], quantiteCommandee: 1000, quantiteRecue: 600, prixUnitaireHT: 27.00, tauxTVA: 20, montantHT: 27000, montantTTC: 32400 },
      { id: 'lcmd-2', commandeId: 'cmd-1', produitId: 'p-2', produit: produits[1], quantiteCommandee: 200, quantiteRecue: 100, prixUnitaireHT: 50.00, tauxTVA: 20, montantHT: 10000, montantTTC: 12000 },
    ],
    montantTotalHT: 37000, montantTotalTTC: 44400, devise: 'MAD', notes: 'Appel d\'offres ouvert 2024', createdAt: new Date('2024-05-15'), createdBy: 'Hassan Alaoui'
  },
  {
    id: 'cmd-2', numero: 'BC-2024-0113', fournisseurId: 'f-3', fournisseur: fournisseurs[2],
    statut: 'EN_ATTENTE',
    dateCommande: new Date('2024-06-10'), dateLivraisonPrevue: new Date('2024-07-01'),
    lignes: [
      { id: 'lcmd-3', commandeId: 'cmd-2', produitId: 'p-4', produit: produits[3], quantiteCommandee: 300, quantiteRecue: 0, prixUnitaireHT: 34.00, tauxTVA: 20, montantHT: 10200, montantTTC: 12240 },
      { id: 'lcmd-4', commandeId: 'cmd-2', produitId: 'p-8', produit: produits[7], quantiteCommandee: 150, quantiteRecue: 0, prixUnitaireHT: 43.00, tauxTVA: 20, montantHT: 6450, montantTTC: 7740 },
    ],
    montantTotalHT: 16650, montantTotalTTC: 19980, devise: 'MAD', createdAt: new Date('2024-06-10'), createdBy: 'Hassan Alaoui'
  },
  {
    id: 'cmd-3', numero: 'BC-2024-0114', fournisseurId: 'f-5', fournisseur: fournisseurs[4],
    marchePublicRef: 'MP-2024-AOO-018', statut: 'SOLDE',
    dateCommande: new Date('2024-04-01'), dateLivraisonPrevue: new Date('2024-05-01'),
    lignes: [
      { id: 'lcmd-5', commandeId: 'cmd-3', produitId: 'p-6', produit: produits[5], quantiteCommandee: 50, quantiteRecue: 50, prixUnitaireHT: 410.00, tauxTVA: 20, montantHT: 20500, montantTTC: 24600 },
      { id: 'lcmd-6', commandeId: 'cmd-3', produitId: 'p-10', produit: produits[9], quantiteCommandee: 100, quantiteRecue: 100, prixUnitaireHT: 36.00, tauxTVA: 20, montantHT: 3600, montantTTC: 4320 },
    ],
    montantTotalHT: 24100, montantTotalTTC: 28920, devise: 'MAD', createdAt: new Date('2024-04-01'), createdBy: 'Hassan Alaoui'
  },
];

export const bons: BonSortie[] = [
  {
    id: 'bs-1', numero: 'BS-2024-0089', demandeId: 'd-4', demande: demandes[3], statut: 'VALIDE',
    departementBeneficiaire: 'Service RH',
    lignes: [
      { id: 'lbs-1', bonSortieId: 'bs-1', produitId: 'p-8', produit: produits[7], quantiteDemandee: 10, quantiteServie: 10, pmpSnapshot: 45.00, valeurHT: 450.00 },
    ],
    montantTotalHT: 450.00, createdAt: new Date('2024-06-10'), updatedAt: new Date('2024-06-10'), createdBy: 'Hassan Alaoui'
  },
  {
    id: 'bs-2', numero: 'BS-2024-0090', demandeId: 'd-1', demande: demandes[0], statut: 'EN_COURS',
    departementBeneficiaire: 'Direction Générale',
    lignes: [
      { id: 'lbs-2', bonSortieId: 'bs-2', produitId: 'p-1', produit: produits[0], quantiteDemandee: 20, quantiteServie: 20, pmpSnapshot: 28.50, valeurHT: 570.00 },
      { id: 'lbs-3', bonSortieId: 'bs-2', produitId: 'p-2', produit: produits[1], quantiteDemandee: 5, quantiteServie: 5, pmpSnapshot: 52.00, valeurHT: 260.00 },
    ],
    montantTotalHT: 830.00, createdAt: new Date('2024-06-13'), updatedAt: new Date('2024-06-13'), createdBy: 'Hassan Alaoui'
  },
];

export const journal: JournalMouvement[] = [
  { id: 'j-1', date: new Date('2024-06-14T09:15:00'), type: 'SORTIE', referenceDocument: 'BS-2024-0090', produitId: 'p-1', produit: produits[0], quantite: 20, stockApres: 850, pmpSnapshot: 28.50, valeurFlux: 570.00, utilisateur: 'Hassan Alaoui', hash: 'a1b2c3d4' },
  { id: 'j-2', date: new Date('2024-06-14T09:16:00'), type: 'SORTIE', referenceDocument: 'BS-2024-0090', produitId: 'p-2', produit: produits[1], quantite: 5, stockApres: 45, pmpSnapshot: 52.00, valeurFlux: 260.00, utilisateur: 'Hassan Alaoui', hash: 'b2c3d4e5' },
  { id: 'j-3', date: new Date('2024-06-13T14:30:00'), type: 'ENTREE', referenceDocument: 'BR-2024-0045', produitId: 'p-1', produit: produits[0], quantite: 600, stockApres: 870, pmpSnapshot: 28.50, valeurFlux: 17100.00, utilisateur: 'Hassan Alaoui', hash: 'c3d4e5f6' },
  { id: 'j-4', date: new Date('2024-06-12T11:00:00'), type: 'SORTIE', referenceDocument: 'BS-2024-0089', produitId: 'p-8', produit: produits[7], quantite: 10, stockApres: 18, pmpSnapshot: 45.00, valeurFlux: 450.00, utilisateur: 'Hassan Alaoui', hash: 'd4e5f6g7' },
  { id: 'j-5', date: new Date('2024-06-11T16:00:00'), type: 'AJUSTEMENT', referenceDocument: 'ADJ-2024-003', produitId: 'p-10', produit: produits[9], quantite: -5, stockApres: -5, pmpSnapshot: 38.00, valeurFlux: -190.00, utilisateur: 'Admin Système', hash: 'e5f6g7h8', notes: 'Correction inventaire' },
  { id: 'j-6', date: new Date('2024-06-10T09:00:00'), type: 'ENTREE', referenceDocument: 'BR-2024-0044', produitId: 'p-6', produit: produits[5], quantite: 50, stockApres: 25, pmpSnapshot: 420.00, valeurFlux: 21000.00, utilisateur: 'Hassan Alaoui', hash: 'f6g7h8i9' },
];

export const alertes: AlerteStock[] = [
  { id: 'al-1', produitId: 'p-4', produit: produits[3], type: 'CRITIQUE', message: 'Rupture de stock : Produit de nettoyage multi-surfaces - Stock actuel: 0', dateCreation: new Date('2024-06-08'), traitee: false },
  { id: 'al-2', produitId: 'p-10', produit: produits[9], type: 'CRITIQUE', message: 'Stock négatif : Disjoncteur 16A - Stock actuel: -5', dateCreation: new Date('2024-06-11'), traitee: false },
  { id: 'al-3', produitId: 'p-3', produit: produits[2], type: 'CRITIQUE', message: 'Stock critique : Cartouche toner HP - Stock: 8 (min: 10)', dateCreation: new Date('2024-06-12'), traitee: false },
  { id: 'al-4', produitId: 'p-2', produit: produits[1], type: 'FAIBLE', message: 'Stock faible : Stylo bille Bic Cristal - Stock: 45 (min: 20)', dateCreation: new Date('2024-06-13'), traitee: false },
  { id: 'al-5', produitId: 'p-8', produit: produits[7], type: 'FAIBLE', message: 'Stock faible : Savon liquide - Stock: 18 (min: 30)', dateCreation: new Date('2024-06-13'), traitee: false },
  { id: 'al-6', produitId: 'p-9', produit: produits[8], type: 'SURVEILLANCE', message: 'Stock en surveillance : Bureau direction - Stock: 3 (seuil: 3)', dateCreation: new Date('2024-06-14'), traitee: false },
];

export const kpiData: KPIData = {
  totalArticles: produits.length,
  articlesRupture: produits.filter(p => p.statutStock === 'RUPTURE' || p.stockDisponible <= 0).length,
  demandesValidees: demandes.filter(d => d.statut === 'VALIDEE').length,
  valeurTotaleStock: produits.reduce((sum, p) => sum + (Math.max(0, p.stockDisponible) * p.pmpActuel), 0),
  commandesEnAttente: commandes.filter(c => c.statut === 'EN_ATTENTE').length,
  alertesCritiques: alertes.filter(a => a.type === 'CRITIQUE' && !a.traitee).length,
  mouvementsJour: 12,
  fournisseursActifs: fournisseurs.filter(f => f.actif).length,
};

export const mouvementsChart: MouvementChart[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString('fr-MA', { day: '2-digit', month: 'short' }),
    entrees: Math.floor(Math.random() * 8000) + 1000,
    sorties: Math.floor(Math.random() * 6000) + 800,
    ajustements: Math.floor(Math.random() * 1000),
  };
});

export const topCategories: TopCategorie[] = [
  { categorie: 'Fournitures Bureau', valeur: 45820, articles: 4 },
  { categorie: 'Informatique', valeur: 38500, articles: 2 },
  { categorie: 'Mobilier', valeur: 61500, articles: 2 },
  { categorie: 'Électricité', valeur: 22350, articles: 2 },
  { categorie: 'Hygiène & Entretien', valeur: 9900, articles: 2 },
  { categorie: 'Sécurité', valeur: 8925, articles: 1 },
];
