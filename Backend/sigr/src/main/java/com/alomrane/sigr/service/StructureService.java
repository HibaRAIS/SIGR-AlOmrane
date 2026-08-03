// service/StructureService.java
package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.request.CreateStructureRequest;
import com.alomrane.sigr.dto.response.StructureFlatDto;
import com.alomrane.sigr.model.Structure;
import com.alomrane.sigr.model.enums.TypeStructure;
import com.alomrane.sigr.repository.StructureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StructureService {

    private final StructureRepository repository;

    /**
     * Retourne toutes les structures sous forme de liste plate avec leur parentId.
     */
    @Transactional(readOnly = true)
    public List<StructureFlatDto> getAllFlat() {
        return repository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Crée une nouvelle structure.
     * @param request les données de création
     * @return la structure créée (entité)
     */
    @Transactional
    public Structure create(CreateStructureRequest request) {
        Structure parent = resolveParent(request.getParentId());
        Structure entity = Structure.builder()
                .nom(request.getNom())
                .codeAnalytique(request.getCodeAnalytique())
                .type(TypeStructure.valueOf(request.getType()))
                .site(request.getSite())
                .parent(parent)
                .build();
        return repository.save(entity);
    }

    /**
     * Met à jour une structure existante.
     * @param id      l'identifiant de la structure à modifier
     * @param request les nouvelles données
     * @return la structure mise à jour (entité)
     */
    @Transactional
    public Structure update(Long id, CreateStructureRequest request) {
        Structure entity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Structure introuvable avec l'id : " + id));

        entity.setNom(request.getNom());
        entity.setCodeAnalytique(request.getCodeAnalytique());
        entity.setType(TypeStructure.valueOf(request.getType()));
        entity.setSite(request.getSite());

        // Mise à jour du parent
        Structure parent = resolveParent(request.getParentId());
        entity.setParent(parent); // null si parentId est null

        return repository.save(entity);
    }

    /**
     * Supprime une structure et tous ses enfants (cascade = ALL dans l'entité).
     * @param id l'identifiant de la structure à supprimer
     */
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Structure introuvable avec l'id : " + id);
        }
        // La suppression cascade supprime également les enfants
        repository.deleteById(id);
    }

    // ---------- Méthodes privées ----------

    private StructureFlatDto toDto(Structure s) {
        return new StructureFlatDto(
                s.getId(),
                s.getNom(),
                s.getCodeAnalytique(),
                s.getType().name(),
                s.getSite(),
                s.getParent() != null ? s.getParent().getId() : null
        );
    }

    /**
     * Résout le parent à partir d'un parentId.
     * @param parentId peut être null
     * @return l'entité parente ou null
     * @throws IllegalArgumentException si le parentId est fourni mais introuvable
     */
    private Structure resolveParent(Long parentId) {
        if (parentId == null) {
            return null;
        }
        return repository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Parent introuvable avec l'id : " + parentId));
    }
}