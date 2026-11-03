package com.portfolio.photography.domain.entity;

import com.portfolio.photography.domain.enums.TimeOfDay;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Photo {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String caption;

    @Column(name = "cloudinary_public_id", nullable = false, unique = true, length = 255)
    private String cloudinaryPublicId;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false)
    private Integer width;

    @Column(nullable = false)
    private Integer height;

    @Column(name = "aspect_ratio", precision = 6, scale = 4, insertable = false, updatable = false)
    private BigDecimal aspectRatio;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_of_day", nullable = false, length = 10)
    private TimeOfDay timeOfDay;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_album_id")
    private EventAlbum eventAlbum;

    @Column(name = "dominant_hex_primary", nullable = false, length = 7)
    @Builder.Default
    private String dominantHexPrimary = "#3B82F6";

    @Column(name = "dominant_hex_secondary", nullable = false, length = 7)
    @Builder.Default
    private String dominantHexSecondary = "#1D4ED8";

    @Column(name = "camera_model", length = 120)
    private String cameraModel;

    @Column(name = "lens_model", length = 120)
    private String lensModel;

    @Column(name = "focal_length", length = 120)
    private String focalLength;

    @Column(length = 20)
    private String aperture;

    @Column(name = "shutter_speed", length = 30)
    private String shutterSpeed;
    private Integer iso;

    @Column(name = "captured_at")
    private Instant capturedAt;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private boolean featured = false;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

