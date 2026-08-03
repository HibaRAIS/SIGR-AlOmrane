package com.alomrane.sigr.dto.response;

public record SignatureResponse(
        String role,
        String img,
        String dateStr
) {}