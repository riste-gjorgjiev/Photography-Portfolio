package com.portfolio.photography.dto;

import com.portfolio.photography.domain.enums.TimeOfDay;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100)
        @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Must be a lowercase slug, e.g. night-events")
        String slug,
        String description,
        @NotNull TimeOfDay timeOfDay,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Must be a valid 6-digit hex color")
        String defaultAmbientHex,
        Integer displayOrder
) {
}
