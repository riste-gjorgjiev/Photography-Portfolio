package com.portfolio.photography.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.photography.domain.enums.TimeOfDay;
import com.portfolio.photography.dto.CategoryResponse;
import com.portfolio.photography.dto.CreateCategoryRequest;
import com.portfolio.photography.dto.EventAlbumResponse;
import com.portfolio.photography.dto.PhotoResponse;
import com.portfolio.photography.dto.ReorderAlbumPhotosRequest;
import com.portfolio.photography.dto.UpdateCategoryRequest;
import com.portfolio.photography.dto.UpdateEventAlbumRequest;
import com.portfolio.photography.exception.ConflictException;
import com.portfolio.photography.exception.ResourceNotFoundException;
import com.portfolio.photography.service.BookingService;
import com.portfolio.photography.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminPortfolioController.class)
@TestPropertySource(properties = {
        "portfolio.cors.allowed-origins=http://localhost:4200",
        "portfolio.cloudinary.cloud-name=demo"
})
@AutoConfigureMockMvc(addFilters = false)
class AdminPortfolioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PortfolioService portfolioService;

    @MockBean
    private BookingService bookingService;

    @Test
    void createCategory_withValidRequest_returnsCreated() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest(
                "Street",
                "street",
                "Documentary street photography",
                TimeOfDay.DAY,
                "#D4A373",
                1
        );

        CategoryResponse response = new CategoryResponse(
                UUID.randomUUID(),
                request.name(),
                request.slug(),
                request.description(),
                request.timeOfDay(),
                request.defaultAmbientHex(),
                request.displayOrder()
        );

        when(portfolioService.createCategory(any(CreateCategoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Street"))
                .andExpect(jsonPath("$.slug").value("street"));
    }

    @Test
    void createCategory_withDuplicateSlug_returnsConflict() throws Exception {
        CreateCategoryRequest request = new CreateCategoryRequest(
                "Street",
                "street",
                null,
                TimeOfDay.DAY,
                "#D4A373",
                1
        );

        when(portfolioService.createCategory(any(CreateCategoryRequest.class)))
                .thenThrow(new ConflictException("A category with slug 'street' already exists"));

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflict"));
    }

    @Test
    void deleteCategory_returnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/admin/categories/{id}", id))
                .andExpect(status().isNoContent());
    }

    @Test
    void updateCategory_withValidRequest_returnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        UpdateCategoryRequest request = new UpdateCategoryRequest(
                "Street",
                "street",
                "Documentary street photography",
                TimeOfDay.DAY,
                "#D4A373",
                2
        );

        CategoryResponse response = new CategoryResponse(
                id,
                request.name(),
                request.slug(),
                request.description(),
                request.timeOfDay(),
                request.defaultAmbientHex(),
                request.displayOrder()
        );

        when(portfolioService.updateCategory(eq(id), any(UpdateCategoryRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/admin/categories/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.name").value("Street"))
                .andExpect(jsonPath("$.displayOrder").value(2));
    }

    @Test
    void updateCategory_withDuplicateSlug_returnsConflict() throws Exception {
        UUID id = UUID.randomUUID();
        UpdateCategoryRequest request = new UpdateCategoryRequest(
                "Street",
                "street",
                null,
                TimeOfDay.DAY,
                "#D4A373",
                0
        );

        when(portfolioService.updateCategory(eq(id), any(UpdateCategoryRequest.class)))
                .thenThrow(new ConflictException("A category with slug 'street' already exists"));

        mockMvc.perform(put("/api/v1/admin/categories/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflict"));
    }

    @Test
    void updateCategory_whenMissing_returnsNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        UpdateCategoryRequest request = new UpdateCategoryRequest(
                "Street",
                "street",
                null,
                TimeOfDay.DAY,
                "#D4A373",
                0
        );

        when(portfolioService.updateCategory(eq(id), any(UpdateCategoryRequest.class)))
                .thenThrow(new ResourceNotFoundException("Category", "id", id));

        mockMvc.perform(put("/api/v1/admin/categories/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateAlbum_withValidRequest_returnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        UpdateEventAlbumRequest request = new UpdateEventAlbumRequest(
                "Subzero Warehouse Rave",
                "subzero-warehouse-rave",
                categoryId,
                "Subzero",
                "Skopje",
                LocalDate.of(2025, 12, 31),
                "New description",
                "https://cdn.example.com/cover.jpg",
                "portfolio/covers/subzero/abc",
                "#FF007F",
                true
        );

        EventAlbumResponse response = new EventAlbumResponse(
                id,
                request.title(),
                request.slug(),
                categoryId,
                "Nightlife",
                "nightlife",
                TimeOfDay.NIGHT,
                request.venueName(),
                request.location(),
                request.eventDate(),
                request.description(),
                request.coverPhotoUrl(),
                request.coverPhotoPublicId(),
                request.dominantHex(),
                request.featured()
        );

        when(portfolioService.updateAlbum(eq(id), any(UpdateEventAlbumRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/admin/albums/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.title").value("Subzero Warehouse Rave"))
                .andExpect(jsonPath("$.coverPhotoUrl").value("https://cdn.example.com/cover.jpg"))
                .andExpect(jsonPath("$.featured").value(true));
    }

    @Test
    void updateAlbum_withDuplicateSlug_returnsConflict() throws Exception {
        UUID id = UUID.randomUUID();
        UpdateEventAlbumRequest request = new UpdateEventAlbumRequest(
                "Subzero Warehouse Rave",
                "subzero-warehouse-rave",
                UUID.randomUUID(),
                null,
                null,
                null,
                null,
                null,
                null,
                "#6366F1",
                false
        );

        when(portfolioService.updateAlbum(eq(id), any(UpdateEventAlbumRequest.class)))
                .thenThrow(new ConflictException("An album with slug 'subzero-warehouse-rave' already exists"));

        mockMvc.perform(put("/api/v1/admin/albums/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void uploadAlbumCover_withImage_returnsOk() throws Exception {
        UUID id = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file", "cover.jpg", "image/jpeg", "image-bytes".getBytes());

        EventAlbumResponse response = new EventAlbumResponse(
                id, "Album", "album", UUID.randomUUID(), "Nightlife", "nightlife", TimeOfDay.NIGHT,
                null, null, null, null, "data:image/jpeg;base64,abc", "local-cover", "#FF007F", false);

        when(portfolioService.uploadAlbumCover(eq(id), any())).thenReturn(response);

        mockMvc.perform(multipart("/api/v1/admin/albums/{id}/cover", id).file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.coverPhotoUrl").value("data:image/jpeg;base64,abc"));
    }

    @Test
    void reorderAlbumPhotos_withValidRequest_returnsOk() throws Exception {
        UUID albumId = UUID.randomUUID();
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();

        PhotoResponse first = new PhotoResponse(
                firstId, "First", null, "pub-1", "https://cdn.example.com/1.jpg",
                1000, 800, null, TimeOfDay.NIGHT, UUID.randomUUID(), "Nightlife", "nightlife",
                albumId, "Album", "#FF007F", "#7928CA", null, false, 0, null);
        PhotoResponse second = new PhotoResponse(
                secondId, "Second", null, "pub-2", "https://cdn.example.com/2.jpg",
                1000, 800, null, TimeOfDay.NIGHT, UUID.randomUUID(), "Nightlife", "nightlife",
                albumId, "Album", "#FF007F", "#7928CA", null, false, 1, null);

        when(portfolioService.reorderAlbumPhotos(eq(albumId), any()))
                .thenReturn(List.of(first, second));

        mockMvc.perform(put("/api/v1/admin/albums/{id}/photos/order", albumId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReorderAlbumPhotosRequest(
                                List.of(firstId, secondId)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(firstId.toString()))
                .andExpect(jsonPath("$[0].displayOrder").value(0))
                .andExpect(jsonPath("$[1].displayOrder").value(1));
    }

    @Test
    void reorderAlbumPhotos_withEmptyList_returnsBadRequest() throws Exception {
        UUID albumId = UUID.randomUUID();

        mockMvc.perform(put("/api/v1/admin/albums/{id}/photos/order", albumId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"photoIds\": []}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteAlbum_returnsNoContent() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/admin/albums/{id}", id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteCategory_whenStillInUse_returnsConflict() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ConflictException("Category still contains photos or albums"))
                .when(portfolioService).deleteCategory(id);

        mockMvc.perform(delete("/api/v1/admin/categories/{id}", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title").value("Conflict"));
    }

    @Test
    void unmappedAdminEndpoint_returnsNotFound() throws Exception {
        mockMvc.perform(post("/api/v1/admin/not-a-real-endpoint"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }
}
