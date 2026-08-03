package com.alomrane.sigr.service;

import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.StatutDemande;
import com.alomrane.sigr.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ProduitRepository produitRepository;
    private final StockPhysiqueRepository stockPhysiqueRepository;
    private final JournalMouvementRepository journalMouvementRepository;
    private final DemandeInterneRepository demandeInterneRepository;
    private final AlerteStockRepository alerteStockRepository;
    private final CategorieRepository categorieRepository;
    private final CommandeAchatRepository commandeAchatRepository;
    private final FournisseurRepository fournisseurRepository;
    private final MouvementService mouvementService; // pour l'intégrité du journal
    private final GroqService groqService;

    // ────────────────────────────────────────────────────────────
    public String processMessage(String message) {
        String lower = message.toLowerCase().trim();

        // ─── Questions métier (par mots‑clés) ─────────────────
        if (containsAny(lower, "rupture", "stock faible", "en dessous du seuil", "réapprovisionnement", "seuil critique")) {
            return getRuptureInfo();
        }
        if (containsAny(lower, "nombre de produits", "combien de produits", "total produits", "nombre d'articles")) {
            return getProduitCount();
        }
        if (containsAny(lower, "dernier mouvement", "dernière opération", "mouvement récent")) {
            return getDernierMouvement();
        }
        if (containsAny(lower, "mouvements aujourd'hui", "mouvement du jour", "aujourd'hui mouvement")) {
            return getMouvementsAujourdhui();
        }
        if (containsAny(lower, "journal intègre", "intégrité journal", "vérifier intégrité", "chaîne valide","Le journal est-il intègre ?")) {
            return getIntegriteJournal();
        }
        if (containsAny(lower, "demande en attente", "demandes en attente", "attente de préparation","Combien de demandes sont en attente ?")) {
            return getDemandesEnAttente();
        }
        if (containsAny(lower, "demande validée", "demandes validées")) {
            return getDemandesValidees();
        }
        if (containsAny(lower, "ticket ouvert", "tickets ouverts", "ticket en cours")) {
            return getTicketsOuverts();
        }
        if (containsAny(lower, "stock du produit", "stock de l'article", "quel est le stock de")) {
            return getStockProduit(lower);
        }
        if (containsAny(lower, "alerte active", "alertes en cours", "nombre d'alertes")) {
            return getAlertesActives();
        }
        if (containsAny(lower, "nombre de catégories", "catégories disponibles", "combien de catégories")) {
            return getCategorieCount();
        }
        if (containsAny(lower, "nombre de fournisseurs", "fournisseurs enregistrés")) {
            return getFournisseurCount();
        }
        if (containsAny(lower, "commande en retard", "commandes en retard", "fournisseur en retard")) {
            return getCommandesEnRetard();
        }

        // ─── Sinon, interroger Groq ──────────────────────────
        return groqService.askGroq(message);
    }

    // ────── Méthodes métier ──────────────────────────────────

    private String getRuptureInfo() {
        long count = stockPhysiqueRepository.countBySeuil(0);
        return String.format("Actuellement, %d produit(s) sont en rupture de stock (quantité théorique ≤ 0).", count);
    }

    private String getProduitCount() {
        long count = produitRepository.count();
        return String.format("Le catalogue contient %d produit(s).", count);
    }

    private String getDernierMouvement() {
        JournalMouvement dernier = journalMouvementRepository
                .findTopByOrderByDateMouvementDescIdDesc()
                .orElse(null);
        if (dernier == null) return "Aucun mouvement enregistré pour le moment.";
        return String.format("Dernier mouvement : %s (%s) le %s à %s.",
                dernier.getCodeUnique(), dernier.getType(),
                dernier.getDateMouvement().toLocalDate(),
                dernier.getDateMouvement().toLocalTime());
    }

    private String getMouvementsAujourdhui() {
        java.time.LocalDateTime debut = java.time.LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        java.time.LocalDateTime fin   = java.time.LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
        long count = journalMouvementRepository.countByDateMouvementBetween(debut, fin);
        return String.format("Aujourd'hui, %d mouvement(s) ont été enregistrés.", count);
    }

    private String getIntegriteJournal() {
        try {
            boolean integre = mouvementService.verifierIntegriteChaine();
            return integre
                    ? "✅ Le journal des mouvements est intègre. La chaîne de hachage est valide."
                    : "❌ Attention ! L'intégrité du journal est rompue. Un ou plusieurs mouvements ont été altérés.";
        } catch (Exception e) {
            return "La vérification d'intégrité n'a pas pu être effectuée (erreur interne).";
        }
    }

    private String getDemandesEnAttente() {
        long count = demandeInterneRepository.countByStatut(StatutDemande.VALIDEE);
        return String.format("Il y a %d demande(s) en attente de préparation (statut VALIDEE).", count);
    }

    private String getDemandesValidees() {
        long count = demandeInterneRepository.countByStatut(StatutDemande.VALIDEE);
        return String.format("Il y a %d demande(s) validée(s).", count);
    }

    private String getTicketsOuverts() {
        // Supposons que TicketSupportRepository ait une méthode countByStatut(String)
        // À défaut, renvoyer un message temporaire.
        return "Information sur les tickets en cours d'intégration (fonctionnalité à venir).";
    }

    private String getStockProduit(String message) {
        // Extraction simple : chercher après "produit "
        String[] parts = message.split("produit ");
        if (parts.length > 1) {
            String nom = parts[1].trim().replaceAll("[?.,!]$", "");
            List<Produit> produits = produitRepository.findByDesignationContainingIgnoreCase(nom);
            if (produits.isEmpty()) return "Aucun produit trouvé pour '" + nom + "'.";
            return produits.stream()
                    .map(p -> String.format("%s : stock = %d %s",
                            p.getDesignation(),
                            p.getStockPhysique() != null ? p.getStockPhysique().getQuantiteTheorique().intValue() : 0,
                            p.getUniteMesure() != null ? p.getUniteMesure() : ""))
                    .collect(Collectors.joining("\n"));
        }
        return "Veuillez préciser le nom du produit (exemple : 'stock du produit clavier').";
    }

    private String getAlertesActives() {
        long count = alerteStockRepository.count(); // toutes les alertes, on pourrait filtrer par traitee=false
        // Pour plus de précision, on peut utiliser une méthode spécifique.
        // Ici, on compte toutes les alertes non traitées et non ignorées via une requête custom si nécessaire.
        return String.format("Il y a actuellement %d alerte(s) active(s) dans le système.", count);
    }

    private String getCategorieCount() {
        long count = categorieRepository.count();
        return String.format("Le catalogue contient %d catégorie(s).", count);
    }

    private String getFournisseurCount() {
        long count = fournisseurRepository.count();
        return String.format("Il y a %d fournisseur(s) enregistré(s).", count);
    }

    private String getCommandesEnRetard() {
        // Implémentation simplifiée : on pourrait comparer date de livraison prévue avec aujourd'hui.
        // On retourne une information générique.
        return "Cette fonctionnalité est en cours de développement. Je pourrai bientôt vous indiquer les commandes en retard.";
    }

    // ────── Utilitaire ────────────────────────────────────────
    private boolean containsAny(String source, String... keywords) {
        for (String k : keywords) {
            if (source.contains(k)) return true;
        }
        return false;
    }
}