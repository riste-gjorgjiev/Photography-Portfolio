package com.portfolio.photography.dto;

import java.time.Instant;

public record ExifMetadataDto(
        String cameraModel,
        String lensModel,
        String focalLength,
        String aperture,
        String shutterSpeed,
        Integer iso,
        Instant capturedAt
) {
}
