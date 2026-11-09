package com.portfolio.photography.service;

import com.portfolio.photography.domain.entity.Category;
import com.portfolio.photography.domain.entity.EventAlbum;
import com.portfolio.photography.domain.entity.Photo;
import com.portfolio.photography.dto.*;
import com.portfolio.photography.exception.ResourceNotFoundException;
import com.portfolio.photography.repository.CategoryRepository;
import com.portfolio.photography.repository.EventAlbumRepositiry;
import com.portfolio.photography.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortfolioService {

    private final CategoryRepository categoryRepository;
    private final EventAlbumRepositiry eventAlbumRepository;
    private final PhotoRepository photoRepository;
    private final PortfolioMapper mapper;
    private final ImageAnalysisService imageAnalysisService;
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

    public PhotoResponse uploadPhoto(MultipartFile file, PhotoUploadRequest request) throws IOException {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        EventAlbum album = null;
        if (request.eventAlbumId() != null) {
            album = eventAlbumRepository.findById(request.eventAlbumId())
                    .orElseThrow(() -> new ResourceNotFoundException("EventAlbum", "id", request.eventAlbumId()));
        }

        String fallbackHex = category.getDefaultAmbientHex();
        ImageAnalysisService.AnalyzedImageMetadata analysis = imageAnalysisService.analyze(file, fallbackHex);

        CloudinaryService.UploadResult uploadResult = cloudinaryService.uploadPhoto(file, category.getSlug());

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

        EventAlbum album = EventAlbum.builder()
                .title(request.title())
                .slug(request.slug())
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

    public void deletePhoto(java.util.UUID id) {
        Photo photo = photoRepository.findByIdWithAssociations(id)
                .orElseThrow(() -> new ResourceNotFoundException("Photo", "id", id));
        cloudinaryService.deletePhoto(photo.getCloudinaryPublicId());
        photoRepository.delete(photo);
    }
}
