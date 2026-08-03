package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.CommandeAchatRequest;
import com.alomrane.sigr.dto.request.LigneCommandeRequest;
import com.alomrane.sigr.dto.request.DocumentJointRequest;
import com.alomrane.sigr.dto.response.*;
import com.alomrane.sigr.model.*;
import com.alomrane.sigr.model.enums.*;
import com.alomrane.sigr.repository.CommandeAchatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommandeAchatService {

    private final CommandeAchatRepository commandeRepository;

    @Transactional(readOnly = true)
    public Page<CommandeAchatResponse> getCommandes(Pageable pageable, String search, String statut, String methode,
                                                    LocalDate dateDebut, LocalDate dateFin) {
        Specification<CommandeAchat> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("reference")), pattern),
                        cb.like(cb.lower(root.get("fournisseur")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("objetMarche")), pattern),
                        cb.like(cb.lower(root.get("numeroMarche")), pattern)
                ));
            }
            if (statut != null && !statut.equals("all")) {
                predicates.add(cb.equal(root.get("statut"), StatutCommande.valueOf(statut)));
            }
            if (methode != null && !methode.equals("all")) {
                predicates.add(cb.equal(root.get("methode"), MethodeCommande.valueOf(methode)));
            }
            if (dateDebut != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dateCommande"), dateDebut));
            }
            if (dateFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dateCommande"), dateFin));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<CommandeAchat> page = commandeRepository.findAll(spec, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CommandeAchatResponse getCommande(Long id) {
        CommandeAchat cmd = commandeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        return toResponse(cmd);
    }

    @Transactional
    public CommandeAchatResponse createCommande(CommandeAchatRequest request) {
        CommandeAchat cmd = buildEntity(request);
        cmd.setReference(generateReference());
        cmd.setStatut(StatutCommande.EN_COURS); // par défaut
        commandeRepository.save(cmd);
        return toResponse(cmd);
    }

    @Transactional
    public CommandeAchatResponse updateCommande(Long id, CommandeAchatRequest request) {
        CommandeAchat existing = commandeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        // On ne peut modifier que si elle n'est pas annulée ou reçue ? On peut autoriser modifs mineures, mais restons flexibles.
        // On reconstruit les attributs modifiables.
        existing.setDescription(request.getDescription());
        existing.setObjetMarche(request.getObjetMarche());
        existing.setFournisseur(request.getFournisseur());
        existing.setMethode(MethodeCommande.valueOf(request.getMethode()));
        existing.setNumeroMarche(request.getNumeroMarche());
        existing.setMontantMarche(request.getMontantMarche());
        existing.setDateCommande(request.getDateCommande());
        if (request.getStatut() != null) {
            existing.setStatut(StatutCommande.valueOf(request.getStatut()));
        }
        // Gestion des lignes : suppression et recréation
        existing.getLignes().clear();
        request.getLignes().forEach(lr -> {
            LigneCommandeAchat ligne = mapToLigne(lr, existing);
            existing.getLignes().add(ligne);
        });
        // Documents : on pourrait les gérer séparément, mais pour simplifier, on les remplace aussi
        if (request.getDocuments() != null) {
            existing.getDocuments().clear();
            request.getDocuments().forEach(dr -> {
                DocumentJoint doc = mapToDocument(dr, existing);
                existing.getDocuments().add(doc);
            });
        }
        commandeRepository.save(existing);
        return toResponse(existing);
    }

    @Transactional
    public CommandeAchatResponse annulerCommande(Long id, String motif) {
        CommandeAchat cmd = commandeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        if (cmd.getStatut() == StatutCommande.ANNULEE) {
            throw new IllegalStateException("La commande est déjà annulée");
        }
        cmd.setStatut(StatutCommande.ANNULEE);
        cmd.setMotifAnnulation(motif);
        commandeRepository.save(cmd);
        return toResponse(cmd);
    }

    @Transactional
    public CommandeAchatResponse recevoirCommande(Long id) {
        CommandeAchat cmd = commandeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Commande introuvable"));
        if (cmd.getStatut() == StatutCommande.ANNULEE) {
            throw new IllegalStateException("Impossible de recevoir une commande annulée");
        }
        cmd.setStatut(StatutCommande.RECUE);
        commandeRepository.save(cmd);
        return toResponse(cmd);
    }

    @Transactional(readOnly = true)
    public StatsCommandesResponse getStats() {
        List<CommandeAchat> toutes = commandeRepository.findAll();
        long enCours = toutes.stream().filter(c -> c.getStatut() == StatutCommande.EN_COURS).count();
        long recues = toutes.stream().filter(c -> c.getStatut() == StatutCommande.RECUE).count();
        long annulees = toutes.stream().filter(c -> c.getStatut() == StatutCommande.ANNULEE).count();
        long marche = toutes.stream().filter(c -> c.getMethode() == MethodeCommande.MARCHE_PUBLIC).count();
        long bc = toutes.stream().filter(c -> c.getMethode() == MethodeCommande.BON_COMMANDE).count();
        BigDecimal montantEnCours = toutes.stream()
                .filter(c -> c.getStatut() == StatutCommande.EN_COURS)
                .map(this::calculerMontantTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal montantRecues = toutes.stream()
                .filter(c -> c.getStatut() == StatutCommande.RECUE)
                .map(this::calculerMontantTTC)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return StatsCommandesResponse.builder()
                .total(toutes.size())
                .enCours(enCours)
                .recues(recues)
                .annulees(annulees)
                .nbMarchePublic(marche)
                .nbBonCommande(bc)
                .montantEnCours(montantEnCours)
                .montantRecues(montantRecues)
                .build();
    }

    @Transactional
    public List<CommandeAchatResponse> importFichier(MultipartFile file) {
        // Implémentation similaire à celle du front, mais côté serveur.
        // Retourne la liste des commandes créées.
        // Pour simplifier, on peut parser et appeler createCommande pour chaque groupe.
        // (non détaillé ici, à adapter selon vos besoins)
        throw new UnsupportedOperationException("Import non implémenté côté serveur pour le moment");
    }

    // --- Helpers privés ---
    private CommandeAchat buildEntity(CommandeAchatRequest req) {
        CommandeAchat cmd = new CommandeAchat();
        cmd.setDescription(req.getDescription());
        cmd.setObjetMarche(req.getObjetMarche());
        cmd.setFournisseur(req.getFournisseur());
        cmd.setMethode(MethodeCommande.valueOf(req.getMethode()));
        cmd.setNumeroMarche(req.getNumeroMarche());
        cmd.setMontantMarche(req.getMontantMarche());
        cmd.setDateCommande(req.getDateCommande());
        req.getLignes().forEach(lr -> cmd.getLignes().add(mapToLigne(lr, cmd)));
        if (req.getDocuments() != null) {
            req.getDocuments().forEach(dr -> cmd.getDocuments().add(mapToDocument(dr, cmd)));
        }
        return cmd;
    }

    private LigneCommandeAchat mapToLigne(LigneCommandeRequest lr, CommandeAchat cmd) {
        return LigneCommandeAchat.builder()
                .commande(cmd)
                .codeArticle(lr.getCodeArticle())
                .designation(lr.getDesignation())
                .quantite(lr.getQuantite())
                .prixUnitaireHT(lr.getPrixUnitaireHT())
                .tauxTVA(lr.getTauxTVA())
                .build();
    }

    private DocumentJoint mapToDocument(DocumentJointRequest dr, CommandeAchat cmd) {
        return DocumentJoint.builder()
                .commande(cmd)
                .nom(dr.getNom())
                .type(TypeDocument.valueOf(dr.getType()))
                .dataUrl(dr.getDataUrl())
                .dateAjout(LocalDateTime.now())
                .build();
    }

    private String generateReference() {
        int year = LocalDate.now().getYear();
        String prefix = year + "/";
        long count = commandeRepository.countByReferenceStartingWith(prefix);
        return String.format("%s%04d", prefix, count + 1);
    }

    private CommandeAchatResponse toResponse(CommandeAchat cmd) {
        BigDecimal ht = cmd.getLignes().stream()
                .map(l -> l.getPrixUnitaireHT().multiply(BigDecimal.valueOf(l.getQuantite())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal ttc = cmd.getLignes().stream()
                .map(l -> {
                    BigDecimal totalHT = l.getPrixUnitaireHT().multiply(BigDecimal.valueOf(l.getQuantite()));
                    BigDecimal taux = l.getTauxTVA().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    return totalHT.multiply(BigDecimal.ONE.add(taux));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CommandeAchatResponse.builder()
                .id(cmd.getId())
                .reference(cmd.getReference())
                .description(cmd.getDescription())
                .objetMarche(cmd.getObjetMarche())
                .fournisseur(cmd.getFournisseur())
                .methode(cmd.getMethode().name())
                .numeroMarche(cmd.getNumeroMarche())
                .montantMarche(cmd.getMontantMarche())
                .dateCommande(cmd.getDateCommande())
                .statut(cmd.getStatut().name())
                .motifAnnulation(cmd.getMotifAnnulation())
                .montantHT(ht.setScale(2, RoundingMode.HALF_UP))
                .montantTTC(ttc.setScale(2, RoundingMode.HALF_UP))
                .createdAt(cmd.getCreatedAt())
                .lignes(cmd.getLignes().stream().map(this::toLigneResponse).collect(Collectors.toList()))
                .documents(cmd.getDocuments().stream().map(this::toDocumentResponse).collect(Collectors.toList()))
                .build();
    }

    private LigneCommandeResponse toLigneResponse(LigneCommandeAchat l) {
        BigDecimal totalHT = l.getPrixUnitaireHT().multiply(BigDecimal.valueOf(l.getQuantite())).setScale(2, RoundingMode.HALF_UP);
        BigDecimal taux = l.getTauxTVA().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalTTC = totalHT.multiply(BigDecimal.ONE.add(taux)).setScale(2, RoundingMode.HALF_UP);
        return LigneCommandeResponse.builder()
                .id(l.getId())
                .codeArticle(l.getCodeArticle())
                .designation(l.getDesignation())
                .quantite(l.getQuantite())
                .prixUnitaireHT(l.getPrixUnitaireHT())
                .tauxTVA(l.getTauxTVA())
                .totalHT(totalHT)
                .totalTTC(totalTTC)
                .build();
    }

    private DocumentJointResponse toDocumentResponse(DocumentJoint d) {
        return DocumentJointResponse.builder()
                .id(d.getId())
                .nom(d.getNom())
                .type(d.getType().name())
                .dataUrl(d.getDataUrl())
                .dateAjout(d.getDateAjout())
                .build();
    }

    private BigDecimal calculerMontantTTC(CommandeAchat cmd) {
        return cmd.getLignes().stream()
                .map(l -> {
                    BigDecimal totalHT = l.getPrixUnitaireHT().multiply(BigDecimal.valueOf(l.getQuantite()));
                    BigDecimal taux = l.getTauxTVA().divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    return totalHT.multiply(BigDecimal.ONE.add(taux));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}