package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.UtilisateurRequest;
import com.alomrane.sigr.dto.response.UtilisateurDto;
import com.alomrane.sigr.model.Employe;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.model.enums.RoleUtilisateur;
import com.alomrane.sigr.repository.EmployeRepository;
import com.alomrane.sigr.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UtilisateurService {

    private final UtilisateurRepository utilisateurRepository;
    private final EmployeRepository employeRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Transactional(readOnly = true)
    public List<UtilisateurDto> getAll() {
        return utilisateurRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UtilisateurDto create(UtilisateurRequest request) {
        if (utilisateurRepository.findByLoginLdap(request.loginLdap()).isPresent()) {
            throw new IllegalArgumentException("Ce login LDAP existe déjà.");
        }

        Employe employe = employeRepository.findById(request.employeId())
                .orElseThrow(() -> new IllegalArgumentException("Employé introuvable."));

        if (utilisateurRepository.findByEmploye(employe).isPresent()) {
            throw new IllegalArgumentException("Cet employé est déjà associé à un compte utilisateur.");
        }

        Utilisateur utilisateur = Utilisateur.builder()
                .loginLdap(request.loginLdap().toLowerCase())
                .actif(request.actif())
                .role(RoleUtilisateur.valueOf(request.role()))
                .employe(employe)
                .build();

        return toDto(utilisateurRepository.save(utilisateur));
    }

    @Transactional
    public UtilisateurDto update(Long id, UtilisateurRequest request) {
        Utilisateur utilisateur = utilisateurRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable."));

        // Vérifier si le nouveau login n'est pas pris par un autre user
        utilisateurRepository.findByLoginLdap(request.loginLdap())
                .filter(u -> !u.getId().equals(id))
                .ifPresent(u -> { throw new IllegalArgumentException("Ce login LDAP existe déjà."); });

        Employe employe = employeRepository.findById(request.employeId())
                .orElseThrow(() -> new IllegalArgumentException("Employé introuvable."));

        // Vérifier si le nouvel employé n'est pas pris par un autre user
        utilisateurRepository.findByEmploye(employe)
                .filter(u -> !u.getId().equals(id))
                .ifPresent(u -> { throw new IllegalArgumentException("Cet employé est déjà associé à un autre compte."); });

        utilisateur.setLoginLdap(request.loginLdap().toLowerCase());
        utilisateur.setActif(request.actif());
        utilisateur.setRole(RoleUtilisateur.valueOf(request.role()));
        utilisateur.setEmploye(employe);

        return toDto(utilisateurRepository.save(utilisateur));
    }

    @Transactional
    public void delete(Long id) {
        if (!utilisateurRepository.existsById(id)) {
            throw new IllegalArgumentException("Utilisateur introuvable.");
        }
        utilisateurRepository.deleteById(id);
    }

    @Transactional
    public void bulkDelete(List<Long> ids) {
        utilisateurRepository.deleteAllById(ids);
    }

    @Transactional
    public void bulkUpdateStatus(List<Long> ids, boolean actif) {
        List<Utilisateur> users = utilisateurRepository.findAllById(ids);
        users.forEach(u -> u.setActif(actif));
        utilisateurRepository.saveAll(users);
    }

    // --- Mapper Entity -> DTO ---
    private UtilisateurDto toDto(Utilisateur u) {
        String employeNom = u.getEmploye() != null ? u.getEmploye().getPrenom() + " " + u.getEmploye().getNom() : "Inconnu";
        String department = (u.getEmploye() != null && u.getEmploye().getStructure() != null)
                ? u.getEmploye().getStructure().getNom() : "N/A";
        String phone = u.getEmploye() != null ? u.getEmploye().getTelephone() : "";

        return UtilisateurDto.builder()
                .id(u.getId())
                .loginLdap(u.getLoginLdap())
                .actif(u.isActif())
                .role(u.getRole().name())
                .employeId(u.getEmploye() != null ? u.getEmploye().getId() : null)
                .employeNom(employeNom)
                .department(department)
                .derniereConnexion(u.getDerniereConnexion() != null ? u.getDerniereConnexion().format(DATE_FORMATTER) : "Jamais")
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .phone(phone)
                .build();
    }
}