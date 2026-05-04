package com.alomrane.sigr.dto.response;

import java.util.List;

public record CategorieResponse(Long id, String nom, List<CategorieResponse> sousCategories) {}
