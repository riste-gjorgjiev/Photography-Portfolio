package com.portfolio.photography.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.photography.domain.enums.TimeOfDay;
import com.portfolio.photography.dto.CategoryResponse;
import com.portfolio.photography.dto.CreateCategoryRequest;
import com.portfolio.photography.exception.ConflictException;
import com.portfolio.photography.service.BookingService;
import com.portfolio.photography.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
