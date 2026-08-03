package com.alomrane.sigr.controller;


import com.alomrane.sigr.dto.response.MouvementResponse;
import com.alomrane.sigr.service.MouvementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/mouvements")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RESPONSABLE_LOGISTIQUE')")
public class MouvementController {

    private final MouvementService mouvementService;

    @GetMapping
    public Page<MouvementResponse> getJournal(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String produit,
            @RequestParam(required = false) String departement,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "date") String sort,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sortObj = Sort.by(Sort.Direction.fromString(direction), sort);
        return mouvementService.getJournal(search, type, produit, departement,
                dateDebut, dateFin, PageRequest.of(page, size, sortObj));
    }
}