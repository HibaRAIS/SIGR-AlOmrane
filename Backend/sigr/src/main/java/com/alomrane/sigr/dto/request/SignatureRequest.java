package com.alomrane.sigr.dto.request;

public record SignatureRequest(
        String role,   // MAGASINIER, DEMANDEUR, RECEPTIONNAIRE
        String img,    // base64
        String dateStr // ISO
) {}