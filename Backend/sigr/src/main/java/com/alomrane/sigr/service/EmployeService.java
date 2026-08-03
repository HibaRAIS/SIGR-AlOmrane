package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.CreateEmployeRequest;
import com.alomrane.sigr.dto.response.EmployeDto;
import com.alomrane.sigr.model.Employe;
import com.alomrane.sigr.model.Structure;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.model.enums.Grade;
import com.alomrane.sigr.repository.EmployeRepository;
import com.alomrane.sigr.repository.StructureRepository;
import com.alomrane.sigr.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeService {

    private final EmployeRepository employeRepository;
    private final StructureRepository structureRepository;
    private final UtilisateurRepository utilisateurRepository;

    // ---------- CRUD ----------
    @Transactional(readOnly = true)
    public List<EmployeDto> getAll() {
        return employeRepository.findAll()
                .stream()
                .map(this::toEmployeDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EmployeDto create(CreateEmployeRequest request) {
        Employe employe = mapToEntity(request, new Employe());
        Employe saved = employeRepository.save(employe);
        return toEmployeDto(saved);
    }

    @Transactional
    public EmployeDto update(Long id, CreateEmployeRequest request) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employé introuvable"));
        mapToEntity(request, employe);
        Employe saved = employeRepository.save(employe);
        return toEmployeDto(saved);
    }

    @Transactional
    public void delete(Long id) {
        if (!employeRepository.existsById(id)) {
            throw new IllegalArgumentException("Employé introuvable");
        }
        employeRepository.deleteById(id);
    }

    @Transactional
    public void updateStatus(Long id, boolean actif) {
        Employe employe = employeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Employé introuvable"));

        if (actif) {
            // Si on tente d'activer, on exige qu'il y ait un compte utilisateur
            Utilisateur user = utilisateurRepository.findByEmploye(employe)
                    .orElseThrow(() -> new IllegalStateException("Cet employé n'a pas de compte, créez un compte pour que ce dernier soit activé."));

            user.setActif(true);
            utilisateurRepository.save(user);
        } else {
            // Si on désactive, on le fait silencieusement s'il a un compte
            utilisateurRepository.findByEmploye(employe).ifPresent(user -> {
                user.setActif(false);
                utilisateurRepository.save(user);
            });
        }
    }

    // ---------- Méthodes privées ----------
    private Employe mapToEntity(CreateEmployeRequest request, Employe employe) {
        employe.setMatricule(request.getMatricule());
        employe.setBadge(request.getBadge());
        employe.setNom(request.getNom());
        employe.setPrenom(request.getPrenom());
        employe.setEmailProfessionnel(request.getEmailProfessionnel());
        employe.setTelephone(request.getTelephone());
        employe.setGrade(Grade.valueOf(request.getGrade()));

        if (request.getStructureId() != null) {
            Structure structure = structureRepository.findById(request.getStructureId())
                    .orElseThrow(() -> new IllegalArgumentException("Structure introuvable"));
            employe.setStructure(structure);
        } else {
            employe.setStructure(null);
        }

        if (request.getManagerId() != null) {
            Employe manager = employeRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new IllegalArgumentException("Manager introuvable"));
            employe.setManager(manager);
        } else {
            employe.setManager(null);
        }

        // Si vous souhaitez permettre la saisie de la date d'embauche via le DTO de requête,
        // vous pouvez l'ajouter ici. Pour l'instant, la date n'est pas modifiable via le formulaire,
        // donc elle reste inchangée.
        return employe;
    }

    private EmployeDto toEmployeDto(Employe e) {
        // Récupération du statut actif/inactif depuis l'utilisateur lié
        Optional<Utilisateur> userOpt = utilisateurRepository.findByEmploye(e);
        boolean actif = userOpt.isPresent() && userOpt.get().isActif();

        // Formatage de la date d'embauche
        String dateEmbauche = "";
        if (e.getDateEmbauche() != null) {
            dateEmbauche = e.getDateEmbauche().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        }

        return EmployeDto.builder()
                .id(e.getId())
                .matricule(e.getMatricule())
                .badge(e.getBadge())
                .nom(e.getNom())
                .prenom(e.getPrenom())
                .emailProfessionnel(e.getEmailProfessionnel())
                .telephone(e.getTelephone())
                .grade(e.getGrade().name())
                .structureNom(e.getStructure() != null ? e.getStructure().getNom() : "")
                .structureCode(e.getStructure() != null ? e.getStructure().getCodeAnalytique() : "")
                .structureId(e.getStructure() != null ? e.getStructure().getId() : null)
                .managerNom(e.getManager() != null
                        ? e.getManager().getPrenom() + " " + e.getManager().getNom()
                        : "")
                .managerId(e.getManager() != null ? e.getManager().getId() : null)
                .dateEmbauche(dateEmbauche)
                .actif(actif)
                .build();
    }
}