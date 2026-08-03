package com.alomrane.sigr.dto.request;

import java.util.List;

public record LivraisonRequest(
        String nomReceptionnaire,
        List<SignatureRequest> signatures
) {}