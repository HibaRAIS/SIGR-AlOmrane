// controller/ProfilController.java
package com.alomrane.sigr.controller;

import com.alomrane.sigr.dto.request.ProfilUpdateRequest;
import com.alomrane.sigr.dto.response.ProfilResponse;
import com.alomrane.sigr.exception.BusinessException;
import com.alomrane.sigr.exception.ResourceNotFoundException;
import com.alomrane.sigr.model.Employe;
import com.alomrane.sigr.model.Utilisateur;
import com.alomrane.sigr.repository.EmployeRepository;
import com.alomrane.sigr.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/profil")
@RequiredArgsConstructor
public class ProfilController {

    private final UtilisateurRepository utilisateurRepository;
    private final EmployeRepository employeRepository;

    // Récupérer le profil de l'utilisateur connecté
    @GetMapping
    public ResponseEntity<ProfilResponse> getProfil(@AuthenticationPrincipal Utilisateur user) {
        Utilisateur managedUser = utilisateurRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        Employe employe = managedUser.getEmploye();
        if (employe == null) {
            throw new BusinessException("Aucun employé associé");
        }

        String service = (employe.getStructure() != null) ? employe.getStructure().getNom() : "Non défini";
        String site = (employe.getStructure() != null && employe.getStructure().getSite() != null)
                ? employe.getStructure().getSite()
                : "Non défini";
        String responsable = (employe.getManager() != null)
                ? employe.getManager().getPrenom() + " " + employe.getManager().getNom()
                : "Aucun";
        String derniereConnexion = (managedUser.getDerniereConnexion() != null)
                ? managedUser.getDerniereConnexion().format(DateTimeFormatter.ofPattern("dd MMMM yyyy 'à' HH:mm"))
                : "Non disponible";

        ProfilResponse response = ProfilResponse.builder()
                .prenom(employe.getPrenom())
                .nom(employe.getNom())
                .email(employe.getEmailProfessionnel())
                .telephone(employe.getTelephone() != null ? employe.getTelephone() : "")
                .service(service)
                .site(site)
                .matricule(employe.getMatricule())
                .responsable(responsable)
                .niveauAcces(managedUser.getRole().name())
                .badge(employe.getBadge() != null ? employe.getBadge() : "")
                .derniereConnexion(derniereConnexion)
                .build();

        return ResponseEntity.ok(response);
    }

    // Mettre à jour le téléphone (seul champ modifiable)
    @PutMapping("/telephone")
    public ResponseEntity<Void> updateTelephone(@AuthenticationPrincipal Utilisateur user,
                                                @RequestBody ProfilUpdateRequest request) {
        Utilisateur managedUser = utilisateurRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        Employe employe = managedUser.getEmploye();
        if (employe == null) {
            throw new BusinessException("Aucun employé associé");
        }

        String telephone = request.getTelephone();
        if (telephone != null && !telephone.isBlank()) {
            if (!telephone.matches("^(\\+212|0)[5-7][0-9]{8}$")) {
                throw new BusinessException("Numéro invalide. Format attendu : +2126XXXXXXXX ou 06XXXXXXXX");
            }
            employe.setTelephone(telephone);
            employeRepository.save(employe);
        }
        return ResponseEntity.ok().build();
    }
}