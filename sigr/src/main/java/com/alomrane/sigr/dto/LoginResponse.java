package com.alomrane.sigr.dto;

public record LoginResponse(String token, String role, String nom) {}