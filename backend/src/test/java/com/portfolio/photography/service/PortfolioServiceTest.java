package com.portfolio.photography.service;

import com.portfolio.photography.domain.entity.EventAlbum;
import com.portfolio.photography.domain.entity.Category;
import com.portfolio.photography.domain.entity.Photo;
import com.portfolio.photography.domain.enums.TimeOfDay;
import com.portfolio.photography.dto.PhotoResponse;
import com.portfolio.photography.dto.PortfolioMapper;
import com.portfolio.photography.repository.CategoryRepository;
import com.portfolio.photography.repository.EventAlbumRepositiry;
import com.portfolio.photography.repository.PhotoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortfolioServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private EventAlbumRepositiry eventAlbumRepository;

    @Mock
    private PhotoRepository photoRepository;

    @Mock
    private ImageAnalysisService imageAnalysisService;

    @Mock
    private ImageOptimizationService imageOptimizationService;

    @Mock
    private CloudinaryService cloudinaryService;

    @Spy
    private PortfolioMapper mapper = new PortfolioMapper();

    @InjectMocks
    private PortfolioService portfolioService;

    @Test
    void reorderAlbumPhotos_assignsDisplayOrderFromListPosition() {
        UUID albumId = UUID.randomUUID();
        Photo second = photo(albumId, 0);
        Photo first = photo(albumId, 1);
        UUID firstId = first.getId();
        UUID secondId = second.getId();

        when(eventAlbumRepository.findById(albumId)).thenReturn(Optional.of(new EventAlbum()));
        when(photoRepository.findByAlbumIdWithAssociations(albumId))
                .thenReturn(List.of(second, first))   // initial read
                .thenReturn(List.of(first, second));  // read after save

        List<PhotoResponse> result = portfolioService.reorderAlbumPhotos(
                albumId, List.of(firstId, secondId));

        assertThat(first.getDisplayOrder()).isZero();
        assertThat(second.getDisplayOrder()).isEqualTo(1);
        assertThat(result).extracting(PhotoResponse::id).containsExactly(firstId, secondId);
        verify(photoRepository).saveAll(any());
    }

    @Test
    void reorderAlbumPhotos_withUnknownPhoto_throwsBadRequest() {
        UUID albumId = UUID.randomUUID();
        Photo only = photo(albumId, 0);

        when(eventAlbumRepository.findById(albumId)).thenReturn(Optional.of(new EventAlbum()));
        when(photoRepository.findByAlbumIdWithAssociations(albumId)).thenReturn(List.of(only));

        assertThatThrownBy(() -> portfolioService.reorderAlbumPhotos(
                albumId, List.of(only.getId(), UUID.randomUUID())))
                .isInstanceOf(IllegalArgumentException.class);

        verify(photoRepository, never()).saveAll(any());
    }

    @Test
    void reorderAlbumPhotos_withDuplicateIds_throwsBadRequest() {
        UUID albumId = UUID.randomUUID();
        Photo only = photo(albumId, 0);

        when(eventAlbumRepository.findById(albumId)).thenReturn(Optional.of(new EventAlbum()));

        assertThatThrownBy(() -> portfolioService.reorderAlbumPhotos(
                albumId, List.of(only.getId(), only.getId())))
                .isInstanceOf(IllegalArgumentException.class);

        verify(photoRepository, never()).saveAll(any());
    }

    private Photo photo(UUID albumId, int order) {
        Category category = new Category();
        category.setId(UUID.randomUUID());
        category.setName("Nightlife");
        category.setSlug("nightlife");
        category.setTimeOfDay(TimeOfDay.NIGHT);

        Photo photo = new Photo();
        photo.setId(UUID.randomUUID());
        photo.setDisplayOrder(order);
        photo.setTimeOfDay(TimeOfDay.NIGHT);
        photo.setCategory(category);
        photo.setCloudinaryPublicId("pub-" + UUID.randomUUID());
        photo.setImageUrl("https://cdn.example.com/" + UUID.randomUUID() + ".jpg");
        EventAlbum album = new EventAlbum();
        album.setId(albumId);
        photo.setEventAlbum(album);
        return photo;
    }
}
