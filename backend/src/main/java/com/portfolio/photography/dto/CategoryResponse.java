package com.portfolio.photography.dto;

import com.portfolio.photography.domain.enums.TimeOfDay;

import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String description,
        TimeOfDay timeOfDay,
        String defaultAmbientHex,
        Integer displayOrder) {
}
