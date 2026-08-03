package com.alomrane.sigr.service;

import com.alomrane.sigr.dto.response.TvaResponse;
import com.alomrane.sigr.model.Tva;
import com.alomrane.sigr.repository.TvaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TvaService {

    private final TvaRepository tvaRepository;

    public List<TvaResponse> getAll() {
        return tvaRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TvaResponse getById(Long id) {
        Tva tva = tvaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("TVA introuvable"));
        return toResponse(tva);
    }

    @Transactional
    public TvaResponse create(Tva tva) {
        Tva saved = tvaRepository.save(tva);
        return toResponse(saved);
    }

    @Transactional
    public TvaResponse update(Long id, Tva tvaDetails) {
        Tva tva = tvaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("TVA introuvable"));
        tva.setCode(tvaDetails.getCode());
        tva.setLibelle(tvaDetails.getLibelle());
        tva.setTaux(tvaDetails.getTaux());
        tva.setDateDebutValidite(tvaDetails.getDateDebutValidite());
        tva.setDateFinValidite(tvaDetails.getDateFinValidite());
        tva.setActif(tvaDetails.getActif());
        Tva updated = tvaRepository.save(tva);
        return toResponse(updated);
    }

    @Transactional
    public void delete(Long id) {
        if (!tvaRepository.existsById(id)) {
            throw new NoSuchElementException("TVA introuvable");
        }
        tvaRepository.deleteById(id);
    }

    private TvaResponse toResponse(Tva tva) {
        return new TvaResponse(
                tva.getId(),
                tva.getCode(),
                tva.getLibelle(),
                tva.getTaux(),
                tva.getDateDebutValidite(),
                tva.getDateFinValidite(),
                tva.getActif()
        );
    }
}