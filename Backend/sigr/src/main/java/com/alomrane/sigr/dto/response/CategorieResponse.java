package com.alomrane.sigr.dto.response;

import java.util.List;

public record CategorieResponse(Long id, String nom,Long parentId,int nombreArticles,  List<CategorieResponse> sousCategories) {}
