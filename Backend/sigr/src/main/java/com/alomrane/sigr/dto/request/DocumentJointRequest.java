package com.alomrane.sigr.dto.request;

import lombok.Data;

@Data
public class DocumentJointRequest {
    private String nom;
    private String type; // "BON_COMMANDE", "FACTURE", etc.
    private String dataUrl;
}
