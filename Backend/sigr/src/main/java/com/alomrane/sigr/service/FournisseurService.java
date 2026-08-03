package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.CreateFournisseurRequest;
import com.alomrane.sigr.dto.request.UpdateFournisseurRequest;
import com.alomrane.sigr.model.Fournisseur;
import com.alomrane.sigr.repository.FournisseurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FournisseurService {

    private static final Pattern TELEPHONE_PATTERN = Pattern.compile("^(\\+212|0)[5-7]\\d{8}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern ICE_PATTERN = Pattern.compile("^\\d{15}$");
    private static final Pattern CODE_NUMERIC_PATTERN = Pattern.compile("\\d+$");

    private final FournisseurRepository repository;

    // ─── Méthodes publiques de lecture ────────────────────────────────────
    public List<Fournisseur> getAll() {
        return repository.findAll();
    }

    public Fournisseur getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fournisseur introuvable"));
    }

    // ─── Validation des champs optionnels ─────────────────────────────────
    private void validateContactFields(String telephone, String email) {
        if (telephone != null && !telephone.isBlank() && !TELEPHONE_PATTERN.matcher(telephone.trim()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Format du téléphone invalide (ex: 0612345678 ou +212612345678)");
        }
        if (email != null && !email.isBlank() && !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format de l'email invalide");
        }
    }

    // ─── Génération du code sans séquence ─────────────────────────────────
    private String generateNextCode() {
        Optional<Fournisseur> last = repository.findTopByOrderByCodeDesc();
        if (last.isEmpty() || last.get().getCode() == null) {
            return "FRN-0001";
        }

        String lastCode = last.get().getCode(); // ex: "FRN-0042"
        Matcher matcher = CODE_NUMERIC_PATTERN.matcher(lastCode);
        if (matcher.find()) {
            int nextNumber = Integer.parseInt(matcher.group()) + 1;
            return String.format("FRN-%04d", nextNumber);
        }
        // Fallback (si le format est inattendu)
        return "FRN-0001";
    }

    // ─── Création ─────────────────────────────────────────────────────────
    @Transactional
    public Fournisseur create(CreateFournisseurRequest request) {
        // 1. Validation de l'ICE
        if (!ICE_PATTERN.matcher(request.getIce()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'ICE doit comporter exactement 15 chiffres");
        }

        // 2. Unicité de l'ICE
        if (repository.findByIce(request.getIce()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un fournisseur avec cet ICE existe déjà");
        }

        // 3. Validation des contacts (optionnels)
        validateContactFields(request.getTelephone(), request.getEmail());

        // 4. Génération du code
        String code = generateNextCode();

        // 5. Construction de l'entité
        Fournisseur fournisseur = Fournisseur.builder()
                .code(code)
                .raisonSociale(request.getRaisonSociale())
                .ice(request.getIce())
                .identifiantFiscal(request.getIdentifiantFiscal())
                .registreCommerce(request.getRegistreCommerce())
                .telephone(request.getTelephone() != null ? request.getTelephone().trim() : null)
                .email(request.getEmail() != null ? request.getEmail().trim() : null)
                .adresse(request.getAdresse())
                .ville(request.getVille())
                .pays(request.getPays() != null ? request.getPays() : "Maroc")
                .actif(request.getActif() != null ? request.getActif() : true)
                .build();

        // 6. Sauvegarde
        try {
            return repository.save(fournisseur);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Violation de contrainte d'unicité (ICE probablement déjà utilisé)");
        }
    }

    // ─── Mise à jour ──────────────────────────────────────────────────────
    @Transactional
    public Fournisseur update(Long id, UpdateFournisseurRequest request) {
        Fournisseur fournisseur = getById(id);

        // Validation des contacts (optionnels)
        validateContactFields(request.getTelephone(), request.getEmail());

        // Vérification de l'ICE si modifié
        if (request.getIce() != null && !request.getIce().equals(fournisseur.getIce())) {
            if (!ICE_PATTERN.matcher(request.getIce()).matches()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'ICE doit comporter 15 chiffres");
            }
            repository.findByIce(request.getIce())
                    .ifPresent(f -> {
                        if (!f.getId().equals(id)) {
                            throw new ResponseStatusException(HttpStatus.CONFLICT,
                                    "Cet ICE est déjà attribué à un autre fournisseur");
                        }
                    });
            fournisseur.setIce(request.getIce());
        }

        // Mise à jour des autres champs (seulement si fournis)
        if (request.getRaisonSociale() != null) fournisseur.setRaisonSociale(request.getRaisonSociale());
        if (request.getIdentifiantFiscal() != null) fournisseur.setIdentifiantFiscal(request.getIdentifiantFiscal());
        if (request.getRegistreCommerce() != null) fournisseur.setRegistreCommerce(request.getRegistreCommerce());
        if (request.getTelephone() != null) fournisseur.setTelephone(request.getTelephone().trim());
        if (request.getEmail() != null) fournisseur.setEmail(request.getEmail().trim());
        if (request.getAdresse() != null) fournisseur.setAdresse(request.getAdresse());
        if (request.getVille() != null) fournisseur.setVille(request.getVille());
        if (request.getPays() != null) fournisseur.setPays(request.getPays());
        if (request.getActif() != null) fournisseur.setActif(request.getActif());

        return repository.save(fournisseur);
    }

    // ─── Suppression unitaire ─────────────────────────────────────────────
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fournisseur introuvable");
        }
        repository.deleteById(id);
    }

    // ─── Suppression multiple ─────────────────────────────────────────────
    @Transactional
    public void bulkDelete(List<Long> ids) {
        List<Fournisseur> fournisseurs = repository.findAllById(ids);
        if (fournisseurs.size() != ids.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Certains IDs sont invalides");
        }
        repository.deleteAll(fournisseurs);
    }

    // ─── Création multiple ────────────────────────────────────────────────
    @Transactional
    public List<Fournisseur> bulkCreate(List<CreateFournisseurRequest> requests) {
        List<Fournisseur> created = new ArrayList<>();
        for (CreateFournisseurRequest req : requests) {
            created.add(this.create(req)); // réutilise toute la logique (validation, code)
        }
        return created;
    }
}