package com.alomrane.sigr.dto.response;

public record LoginResponse(String token, String role, String nom,String loginLdap) {}