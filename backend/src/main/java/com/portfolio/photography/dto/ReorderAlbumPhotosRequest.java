package com.portfolio.photography.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * Ordered list of photo ids for a single album. The position of each id in the
 * list is the new {@code displayOrder} for that photo.
 */
public record ReorderAlbumPhotosRequest(
        @NotNull @Size(min = 1) List<UUID> photoIds
) {
}
