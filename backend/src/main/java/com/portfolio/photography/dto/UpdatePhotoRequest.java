package com.portfolio.photography.dto;

import com.portfolio.photography.domain.enums.TimeOfDay;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdatePhotoRequest(
        @Size(max = 100) String title,
        String caption,
        @NotNull UUID categoryId,
        UUID eventAlbumId,
        @NotNull TimeOfDay timeOfDay,
        boolean featured,
        Integer displayOrder
) {
}
