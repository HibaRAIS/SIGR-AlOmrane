package com.alomrane.sigr.dto.request;

import jakarta.validation.constraints.NotBlank;

public record RefusResponsableRequest(@NotBlank String motif) {}