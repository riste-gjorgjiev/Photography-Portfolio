package com.portfolio.photography.service;

import com.portfolio.photography.domain.entity.Category;
import com.portfolio.photography.domain.entity.EventAlbum;
import com.portfolio.photography.domain.entity.Photo;
import com.portfolio.photography.dto.*;
import com.portfolio.photography.exception.ConflictException;
import com.portfolio.photography.exception.ExternalServiceException;
import com.portfolio.photography.exception.ResourceNotFoundException;
import com.portfolio.photography.repository.CategoryRepository;
import com.portfolio.photography.repository.EventAlbumRepositiry;
import com.portfolio.photography.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final CategoryRepository categoryRepository;
    private final EventAlbumRepositiry eventAlbumRepository;
    private final PhotoRepository photoRepository;
    private final PortfolioMapper mapper;
    private final ImageAnalysisService imageAnalysisService;
    private final ImageOptimizationService imageOptimizationService;
    private final CloudinaryService cloudinaryService;

    public List<CategoryResponse> getCategories(String timeOfDay) {
        if (timeOfDay != null && !timeOfDay.isBlank()) {
            return categoryRepository
                    .findByTimeOfDayOrderByDisplayOrderAsc(
                            com.portfolio.photography.domain.enums.TimeOfDay.valueOf(timeOfDay.toUpperCase())
                    )
                    .stream()
                    .map(mapper::toCategoryResponse)
                    .toList();
        }
        return categoryRepository.findAllByOrderByTimeOfDayAscDisplayOrderAsc()
                .stream()
                .map(mapper::toCategoryResponse)
                .toList();
    }

    public List<EventAlbumResponse> getAlbums(String timeOfDay, String categorySlug) {
        com.portfolio.photography.domain.enums.TimeOfDay tod = null;
        if (timeOfDay != null && !timeOfDay.isBlank()) {
            tod = com.portfolio.photography.domain.enums.TimeOfDay.valueOf(timeOfDay.toUpperCase());
        }
        String cSlug = (categorySlug != null && !categorySlug.isBlank()) ? categorySlug : null;

        return eventAlbumRepository.findFilteredAlbums(tod, cSlug)
                .stream()
                .map(mapper::toEventAlbumResponse)
                .toList();
    }

    public EventAlbumResponse getAlbumBySlug(String slug) {
        EventAlbum album = eventAlbumRepository.findBySlugWithCategory(slug)
                .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "slug", slug));
        return mapper.toEventAlbumResponse(album);
    }

    public List<PhotoResponse> getPhotos(String timeOfDay, String categorySlug, String albumSlug, Boolean featuredOnly) {
        com.portfolio.photography.domain.enums.TimeOfDay tod = null;
        if (timeOfDay != null && !timeOfDay.isBlank()) {
            tod = com.portfolio.photography.domain.enums.TimeOfDay.valueOf(timeOfDay.toUpperCase());
        }
        String cSlug = (categorySlug != null && !categorySlug.isBlank()) ? categorySlug : null;
        String aSlug = (albumSlug != null && !albumSlug.isBlank()) ? albumSlug : null;
        boolean featured = featuredOnly != null && featuredOnly;

        return photoRepository.findFilteredPhotos(tod, cSlug, aSlug, featured)
                .stream()
                .map(mapper::toPhotoResponse)
                .toList();
    }

    public PhotoResponse uploadPhoto(MultipartFile file, PhotoUploadRequest request) {
        validateImageUpload(file);

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        EventAlbum album = null;
        if (request.eventAlbumId() != null) {
            album = eventAlbumRepository.findById(request.eventAlbumId())
                    .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", request.eventAlbumId()));
        }

        String fallbackHex = category.getDefaultAmbientHex();

        byte[] originalBytes;
        try {
            originalBytes = file.getBytes();
        } catch (IOException e) {
            throw new ExternalServiceException("Could not read the uploaded file", e);
        }

        ImageAnalysisService.AnalyzedImageMetadata analysis =
                imageAnalysisService.analyze(originalBytes, file.getOriginalFilename(), fallbackHex);

        // Cloudinary's free plan rejects assets over 10 MiB, so shrink oversized
        // photos to a web-friendly size before uploading.
        ImageOptimizationService.OptimizedImage optimized = imageOptimizationService.optimize(
                originalBytes, file.getContentType(), file.getOriginalFilename());

        CloudinaryService.UploadResult uploadResult = cloudinaryService.uploadPhoto(
                optimized.bytes(), optimized.contentType(), optimized.filename(), category.getSlug());

        com.portfolio.photography.domain.enums.TimeOfDay timeOfDay = request.timeOfDayOverride() != null
                ? request.timeOfDayOverride()
                : category.getTimeOfDay();

        Photo photo = Photo.builder()
                .title(request.title())
                .caption(request.caption())
                .cloudinaryPublicId(uploadResult.publicId())
                .imageUrl(uploadResult.secureUrl())
                .width(analysis.width())
                .height(analysis.height())
                .timeOfDay(timeOfDay)
                .category(category)
                .eventAlbum(album)
                .dominantHexPrimary(analysis.dominantHexPrimary())
                .dominantHexSecondary(analysis.dominantHexSecondary())
                .cameraModel(analysis.cameraModel())
                .lensModel(analysis.lensModel())
                .focalLength(analysis.focalLength())
                .aperture(analysis.aperture())
                .shutterSpeed(analysis.shutterSpeed())
                .iso(analysis.iso())
                .capturedAt(analysis.capturedAt())
                .featured(request.featured())
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .build();

        Photo saved = photoRepository.save(photo);
        return mapper.toPhotoResponse(saved);
    }

    public EventAlbumResponse createAlbum(CreateEventAlbumRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        String slug = normalizeSlug(request.slug());
        if (eventAlbumRepository.existsBySlug(slug)) {
            throw new ConflictException("An album with slug '" + slug + "' already exists");
        }

        EventAlbum album = EventAlbum.builder()
                .title(request.title().trim())
                .slug(slug)
                .category(category)
                .venueName(request.venueName())
                .location(request.location())
                .eventDate(request.eventDate())
                .description(request.description())
                .coverPhotoUrl(request.coverPhotoUrl())
                .dominatHex(request.dominantHex() != null ? request.dominantHex() : "#6366F1")
                .featured(request.featured())
                .build();

        EventAlbum saved = eventAlbumRepository.save(album);
        return mapper.toEventAlbumResponse(saved);
    }

    public EventAlbumResponse updateAlbum(UUID id, UpdateEventAlbumRequest request) {
        EventAlbum album = eventAlbumRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", id));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        String slug = normalizeSlug(request.slug());
        if (eventAlbumRepository.existsBySlugAndIdNot(slug, id)) {
            throw new ConflictException("An album with slug '" + slug + "' already exists");
        }

        String newCoverUrl = blankToNull(request.coverPhotoUrl());
        String newCoverPublicId = blankToNull(request.coverPhotoPublicId());
        String previousCoverUrl = blankToNull(album.getCoverPhotoUrl());
        String previousCoverPublicId = album.getCoverPhotoPublicId();

        // Clients that only know the URL (e.g. an older form) must not cause the
        // stored asset to be treated as replaced.
        if (newCoverPublicId == null
                && previousCoverPublicId != null
                && Objects.equals(newCoverUrl, previousCoverUrl)) {
            newCoverPublicId = previousCoverPublicId;
        }

        album.setTitle(request.title().trim());
        album.setSlug(slug);
        album.setCategory(category);
        album.setVenueName(request.venueName());
        album.setLocation(request.location());
        album.setEventDate(request.eventDate());
        album.setDescription(request.description());
        album.setCoverPhotoUrl(newCoverUrl);
        album.setCoverPhotoPublicId(newCoverPublicId);
        album.setDominatHex(request.dominantHex() != null ? request.dominantHex() : "#6366F1");
        album.setFeatured(request.featured());

        EventAlbum saved = eventAlbumRepository.save(album);

        // Replace the stored cover asset only when it actually changed and it is
        // not shared with a photo (picked-from-album covers reuse the photo asset).
        if (previousCoverPublicId != null && !previousCoverPublicId.equals(newCoverPublicId)) {
            deleteAssetIfUnused(previousCoverPublicId);
        }

        return mapper.toEventAlbumResponse(reloadAlbum(saved.getId()));
    }

    public EventAlbumResponse uploadAlbumCover(UUID id, MultipartFile file) {
        EventAlbum album = eventAlbumRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", id));

        validateImageUpload(file);

        byte[] originalBytes;
        try {
            originalBytes = file.getBytes();
        } catch (IOException e) {
            throw new ExternalServiceException("Could not read the uploaded file", e);
        }

        ImageAnalysisService.AnalyzedImageMetadata analysis =
                imageAnalysisService.analyze(originalBytes, file.getOriginalFilename(), album.getDominatHex());

        ImageOptimizationService.OptimizedImage optimized = imageOptimizationService.optimize(
                originalBytes, file.getContentType(), file.getOriginalFilename());

        CloudinaryService.UploadResult uploadResult = cloudinaryService.uploadImage(
                optimized.bytes(), optimized.contentType(), optimized.filename(), "covers/" + album.getSlug());

        String previousCoverPublicId = album.getCoverPhotoPublicId();
        album.setCoverPhotoUrl(uploadResult.secureUrl());
        album.setCoverPhotoPublicId(uploadResult.publicId());
        album.setDominatHex(analysis.dominantHexPrimary());

        EventAlbum saved = eventAlbumRepository.save(album);

        if (previousCoverPublicId != null && !previousCoverPublicId.equals(uploadResult.publicId())) {
            deleteAssetIfUnused(previousCoverPublicId);
        }

        return mapper.toEventAlbumResponse(reloadAlbum(saved.getId()));
    }

    public CategoryResponse createCategory(CreateCategoryRequest request) {
        String slug = normalizeSlug(request.slug());
        if (categoryRepository.existsBySlug(slug)) {
            throw new ConflictException("A category with slug '" + slug + "' already exists");
        }

        Category category = Category.builder()
                .name(request.name().trim())
                .slug(slug)
                .description(request.description())
                .timeOfDay(request.timeOfDay())
                .defaultAmbientHex(request.defaultAmbientHex() != null ? request.defaultAmbientHex() : "#1E293B")
                .displayOrder(request.displayOrder() != null ? request.displayOrder() : 0)
                .build();

        return mapper.toCategoryResponse(categoryRepository.save(category));
    }

    public CategoryResponse updateCategory(UUID id, UpdateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        String slug = normalizeSlug(request.slug());
        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new ConflictException("A category with slug '" + slug + "' already exists");
        }

        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(request.description());
        category.setTimeOfDay(request.timeOfDay());
        category.setDefaultAmbientHex(
                request.defaultAmbientHex() != null ? request.defaultAmbientHex() : "#1E293B");
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);

        return mapper.toCategoryResponse(categoryRepository.save(category));
    }

    public PhotoResponse updatePhoto(UUID id, UpdatePhotoRequest request) {
        Photo photo = photoRepository.findByIdWithAssociations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", id));

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        EventAlbum album = null;
        if (request.eventAlbumId() != null) {
            album = eventAlbumRepository.findById(request.eventAlbumId())
                    .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", request.eventAlbumId()));
        }

        photo.setTitle(request.title());
        photo.setCaption(request.caption());
        photo.setCategory(category);
        photo.setEventAlbum(album);
        photo.setTimeOfDay(request.timeOfDay());
        photo.setFeatured(request.featured());
        photo.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);

        Photo saved = photoRepository.save(photo);
        // save() returns a managed copy whose associations are lazy proxies; with
        // open-in-view disabled the response must be mapped from an explicit fetch.
        return mapper.toPhotoResponse(reloadPhoto(saved.getId()));
    }

    /**
     * Rewrites {@code displayOrder} for every photo in an album so the stored
     * order matches the supplied list. Reusing the global {@code display_order}
     * column keeps the public gallery (which already sorts by it) in sync.
     */
    @Transactional
    public List<PhotoResponse> reorderAlbumPhotos(UUID albumId, List<UUID> photoIds) {
        eventAlbumRepository.findById(albumId)
                .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", albumId));

        List<UUID> distinct = photoIds.stream().distinct().toList();
        if (distinct.size() != photoIds.size()) {
            throw new IllegalArgumentException("Duplicate photo ids in reorder request");
        }

        List<Photo> albumPhotos = photoRepository.findByAlbumIdWithAssociations(albumId);
        Set<UUID> albumPhotoIds = albumPhotos.stream().map(Photo::getId).collect(Collectors.toSet());
        if (!albumPhotoIds.equals(new HashSet<>(distinct))) {
            throw new IllegalArgumentException("Order must list every photo in the album exactly once");
        }

        Map<UUID, Photo> byId = albumPhotos.stream()
                .collect(Collectors.toMap(Photo::getId, Function.identity()));
        for (int i = 0; i < distinct.size(); i++) {
            byId.get(distinct.get(i)).setDisplayOrder(i);
        }
        photoRepository.saveAll(albumPhotos);

        return photoRepository.findByAlbumIdWithAssociations(albumId)
                .stream()
                .map(mapper::toPhotoResponse)
                .toList();
    }

    public void deleteCategory(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (photoRepository.existsByCategoryId(id) || eventAlbumRepository.existsByCategoryId(id)) {
            throw new ConflictException(
                    "Category '" + category.getName() + "' still contains photos or albums. Remove or move them first.");
        }

        categoryRepository.delete(category);
    }

    public void deleteAlbum(UUID id) {
        EventAlbum album = eventAlbumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", id));

        if (album.getCoverPhotoPublicId() != null) {
            deleteAssetIfUnused(album.getCoverPhotoPublicId());
        }

        eventAlbumRepository.delete(album);
    }

    public void deletePhoto(UUID id) {
        Photo photo = photoRepository.findByIdWithAssociations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", id));

        // A photo can double as an album cover; once its asset is gone the cover
        // must not keep pointing at a dead URL.
        eventAlbumRepository.findByCoverPhotoPublicId(photo.getCloudinaryPublicId())
                .forEach(album -> {
                    album.setCoverPhotoUrl(null);
                    album.setCoverPhotoPublicId(null);
                    eventAlbumRepository.save(album);
                });

        cloudinaryService.deletePhoto(photo.getCloudinaryPublicId());
        photoRepository.delete(photo);
    }

    private void validateImageUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Only image uploads are allowed");
        }
    }

    private String normalizeSlug(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void deleteAssetIfUnused(String publicId) {
        if (!photoRepository.existsByCloudinaryPublicId(publicId)) {
            cloudinaryService.deletePhoto(publicId);
        }
    }

    /** Re-reads an album with its category joined so it can be mapped outside a transaction. */
    private EventAlbum reloadAlbum(UUID id) {
        return eventAlbumRepository.findByIdWithCategory(id)
                .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", id));
    }

    /** Re-reads a photo with its category and album joined so it can be mapped outside a transaction. */
    private Photo reloadPhoto(UUID id) {
        return photoRepository.findByIdWithAssociations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", id));
    }
}
