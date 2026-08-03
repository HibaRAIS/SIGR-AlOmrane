// ValidationInfoResponse.java
package com.alomrane.sigr.dto.response;

public record ValidationInfoResponse(
        String etape,
        String valideParNom,
        String dateValidation
) {}