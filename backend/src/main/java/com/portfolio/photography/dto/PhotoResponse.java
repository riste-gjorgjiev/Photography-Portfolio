package com.portfolio.photography.dto;

import com.portfolio.photography.domain.enums.TimeOfDay;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PhotoResponse(
        UUID id,
        String title,
        String caption,
        String cloudinaryPublicId,
        String imageUrl,
        Integer width,
        Integer height,
        BigDecimal aspectRatio,
        TimeOfDay timeOfDay,
        UUID categoryId,
        String categoryName,
        String categorySlug,
        UUID eventAlbumId,
        String eventAlbumTitle,
        String dominantHexPrimary,
        String dominantHexSecondary,
        ExifMetadataDto exif,
        boolean featured,
        Integer displayOrder,
        Instant createdAt

) {}
