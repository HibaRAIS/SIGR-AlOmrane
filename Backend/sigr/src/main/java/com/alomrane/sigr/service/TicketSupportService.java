// service/TicketSupportService.java
package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.CreerTicketRequest;
import com.alomrane.sigr.dto.request.RechercheTicketRequest;
import com.alomrane.sigr.dto.response.TicketResponse;
import com.alomrane.sigr.exception.BusinessException;
import com.alomrane.sigr.exception.ResourceNotFoundException;
import com.alomrane.sigr.model.TicketSupport;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.model.enums.PrioriteTicket;
import com.alomrane.sigr.model.enums.StatutTicket;
import com.alomrane.sigr.repository.TicketSupportRepository;
import com.alomrane.sigr.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketSupportService {

    private final TicketSupportRepository ticketRepository;
    private final UtilisateurRepository utilisateurRepository;

    // Création d'un ticket par un employé
    @Transactional
    public TicketResponse creerTicket(Utilisateur currentUser, CreerTicketRequest request) {
        Utilisateur user = utilisateurRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        PrioriteTicket priorite;
        try {
            priorite = (request.getPriorite() != null)
                    ? PrioriteTicket.valueOf(request.getPriorite().toUpperCase())
                    : PrioriteTicket.NORMALE;
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Priorité invalide. Utilisez BASSE, NORMALE, HAUTE ou CRITIQUE");
        }

        TicketSupport ticket = TicketSupport.builder()
                .sujet(request.getSujet())
                .description(request.getDescription())
                .priorite(priorite)
                .categorie(request.getCategorie())
                .utilisateur(user)
                .build();
        ticket = ticketRepository.save(ticket);
        log.info("Ticket créé : {} par {}", ticket.getId(), user.getLoginLdap());
        return toResponse(ticket);
    }

    // Récupérer les tickets de l'utilisateur connecté
    public List<TicketResponse> getMesTickets(Utilisateur currentUser) {
        Utilisateur user = utilisateurRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));
        return ticketRepository.findByUtilisateurOrderByDateCreationDesc(user)
                .stream().map(this::toResponse).toList();
    }

    // ----- Admin -----
    public List<TicketResponse> getAllTickets() {
        return ticketRepository.findAllByOrderByDateCreationDesc()
                .stream().map(this::toResponseWithUser).toList();
    }

    @Transactional
    public TicketResponse repondreTicket(Long ticketId, String reponse, Utilisateur admin) {
        if (!admin.getRole().name().equals("ADMIN_SI")) {
            throw new BusinessException("Accès non autorisé");
        }
        TicketSupport ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket introuvable"));
        ticket.setReponse(reponse);
        ticket.setDateReponse(LocalDateTime.now());
        ticket.setStatut(StatutTicket.RESOLU);
        ticket = ticketRepository.save(ticket);
        log.info("Ticket {} résolu par admin {}", ticketId, admin.getLoginLdap());
        return toResponseWithUser(ticket);
    }

    // Mappings privés
    private TicketResponse toResponse(TicketSupport t) {
        return TicketResponse.builder()
                .id(t.getId()).sujet(t.getSujet()).description(t.getDescription())
                .priorite(t.getPriorite().name()).statut(t.getStatut().name())
                .categorie(t.getCategorie()).dateCreation(t.getDateCreation())
                .reponse(t.getReponse()).dateReponse(t.getDateReponse())
                .build();
    }

    private TicketResponse toResponseWithUser(TicketSupport t) {
        String nom = t.getUtilisateur().getEmploye() != null
                ? t.getUtilisateur().getEmploye().getPrenom() + " " + t.getUtilisateur().getEmploye().getNom()
                : t.getUtilisateur().getLoginLdap();
        String email = t.getUtilisateur().getEmploye() != null
                ? t.getUtilisateur().getEmploye().getEmailProfessionnel()
                : null;
        String telephone = t.getUtilisateur().getEmploye() != null
                ? t.getUtilisateur().getEmploye().getTelephone()
                : null;
        return TicketResponse.builder()
                .id(t.getId()).sujet(t.getSujet()).description(t.getDescription())
                .priorite(t.getPriorite().name()).statut(t.getStatut().name())
                .categorie(t.getCategorie()).dateCreation(t.getDateCreation())
                .reponse(t.getReponse()).dateReponse(t.getDateReponse())
                .utilisateurNom(nom)
                .utilisateurEmail(email)
                .utilisateurTelephone(telephone)
                .build();
    }

    //Recherche Tickets
    public Page<TicketResponse> rechercherTickets(RechercheTicketRequest request) {
        List<Specification<TicketSupport>> specs = new ArrayList<>();

        if (request.getStatut() != null && !request.getStatut().isEmpty()) {
            specs.add((root, query, cb) -> cb.equal(root.get("statut"), StatutTicket.valueOf(request.getStatut())));
        }
        if (request.getPriorite() != null && !request.getPriorite().isEmpty()) {
            specs.add((root, query, cb) -> cb.equal(root.get("priorite"), PrioriteTicket.valueOf(request.getPriorite())));
        }
        if (request.getCategorie() != null && !request.getCategorie().isEmpty()) {
            specs.add((root, query, cb) -> cb.equal(root.get("categorie"), request.getCategorie()));
        }
        if (request.getSearch() != null && !request.getSearch().isEmpty()) {
            String search = "%" + request.getSearch().toLowerCase() + "%";
            specs.add((root, query, cb) -> {
                // Jointure pour accéder aux champs de l'employé via l'utilisateur
                var utilisateurJoin = root.join("utilisateur");
                var employeJoin = utilisateurJoin.join("employe");
                return cb.or(
                        cb.like(cb.lower(root.get("sujet")), search),
                        cb.like(cb.lower(root.get("description")), search),
                        cb.like(cb.lower(employeJoin.get("nom")), search),
                        cb.like(cb.lower(employeJoin.get("prenom")), search)
                );
            });
        }
        if (request.getDateDebut() != null) {
            specs.add((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("dateCreation"), request.getDateDebut()));
        }
        if (request.getDateFin() != null) {
            specs.add((root, query, cb) -> cb.lessThanOrEqualTo(root.get("dateCreation"), request.getDateFin()));
        }

        Specification<TicketSupport> spec = Specification.allOf(specs); // ← méthode moderne
        int page = request.getPage() != null ? request.getPage() : 0;
        int size = request.getSize() != null ? request.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateCreation"));
        Page<TicketSupport> ticketPage = ticketRepository.findAll(spec, pageable);
        return ticketPage.map(this::toResponseWithUser);
    }

    @Transactional
    public TicketResponse changerStatut(Long ticketId, String nouveauStatut) {
        TicketSupport ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket introuvable"));
        StatutTicket ancien = ticket.getStatut();
        StatutTicket nouveau;
        try {
            nouveau = StatutTicket.valueOf(nouveauStatut);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Statut invalide");
        }
        ticket.setStatut(nouveau);
        if (nouveau == StatutTicket.RESOLU && ancien != StatutTicket.RESOLU) {
            ticket.setDateReponse(LocalDateTime.now());
        } else if (ancien == StatutTicket.RESOLU && nouveau != StatutTicket.RESOLU) {
            ticket.setDateReponse(null);
            // Option : vous pouvez aussi effacer la solution associée si nécessaire
            // ticket.setReponse(null);
        }
        ticket = ticketRepository.save(ticket);
        log.info("Statut du ticket {} changé de {} à {}", ticketId, ancien, nouveau);
        return toResponseWithUser(ticket);
    }

    @Transactional
    public TicketResponse modifierReponse(Long ticketId, String nouvelleReponse) {
        // Mise à jour uniquement du champ reponse
        int updated = ticketRepository.updateReponseOnly(ticketId, nouvelleReponse);
        if (updated == 0) {
            throw new ResourceNotFoundException("Ticket introuvable");
        }
        // Recharger le ticket pour la réponse
        TicketSupport ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket introuvable"));
        log.info("Réponse modifiée pour le ticket {} (dateReponse inchangée: {})", ticketId, ticket.getDateReponse());
        return toResponseWithUser(ticket);
    }

    @Transactional
    public void supprimerReponse(Long ticketId) {
        int updated = ticketRepository.updateReponseOnly(ticketId, null);
        if (updated == 0) {
            throw new ResourceNotFoundException("Ticket introuvable");
        }
        log.info("Réponse supprimée pour le ticket {}", ticketId);
    }
}