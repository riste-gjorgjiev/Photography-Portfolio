package com.portfolio.photography.dto;

import com.portfolio.photography.domain.enums.TimeOfDay;

import java.time.LocalDate;
import java.util.UUID;

public record EventAlbumResponse(
        UUID id,
        String title,
        String slug,
        UUID categoryId,
        String categoryName,
        String categorySlug,
        TimeOfDay timeOfDay,
        String venueName,
        String location,
        LocalDate eventDate,
        String description,
        String coverPhotoUrl,
        String dominantHex,
        boolean featured
) {
}
