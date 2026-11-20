package com.portfolio.photography.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateEventAlbumRequest(
        @NotBlank @Size(max = 100) String title,
        @NotBlank @Size(max = 100)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Must be a lowercase slug, e.g. subzero-warehouse-rave")
        String slug,
        @NotNull UUID categoryId,
        @Size(max = 150) String venueName,
        @Size(max = 150) String location,
        LocalDate eventDate,
        String description,
        String coverPhotoUrl,
        String coverPhotoPublicId,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Must be a valid 6-digit hex color")
        String dominantHex,
        boolean featured
) {
}
