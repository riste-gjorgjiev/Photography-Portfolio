package com.portfolio.photography.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.photography.dto.BookingInquiryRequest;
import com.portfolio.photography.dto.BookingInquiryResponse;
import com.portfolio.photography.dto.CategoryResponse;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PublicPortfolioController.class)
@TestPropertySource(properties = {
        "portfolio.cors.allowed-origins=http://localhost:4200",
        "portfolio.cloudinary.cloud-name=demo"
})
@AutoConfigureMockMvc(addFilters = false)
class PublicPortfolioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PortfolioService portfolioService;

    @MockBean
    private BookingService bookingService;

    @Test
    void getCategories_returnsOkWithEmptyList() throws Exception {
        when(portfolioService.getCategories(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/public/categories"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void getCategories_withTimeOfDayFilter_returnsOk() throws Exception {
        CategoryResponse cat = new CategoryResponse(
                UUID.randomUUID(),
                "Wildlife",
                "wildlife",
                "Wildlife photography",
                com.portfolio.photography.domain.enums.TimeOfDay.DAY,
                "#2D5A27",
                1
        );
        when(portfolioService.getCategories("DAY")).thenReturn(List.of(cat));

        mockMvc.perform(get("/api/v1/public/categories").param("timeOfDay", "DAY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Wildlife"))
                .andExpect(jsonPath("$[0].slug").value("wildlife"));
    }

    @Test
    void createBooking_withValidRequest_returnsCreated() throws Exception {
        BookingInquiryRequest request = new BookingInquiryRequest(
                "Alex Promoter",
                "alex@example.com",
                "+389 70 123 456",
                "Club Epicenter Halloween",
                "NIGHTCLUB",
                "Club Epicenter, Skopje",
                LocalDate.now().plusDays(30),
                8,
                "€200",
                "Need full coverage of the event"
        );

        BookingInquiryResponse response = new BookingInquiryResponse(
                UUID.randomUUID(),
                request.clientName(),
                request.clientEmail(),
                request.clientPhone(),
                request.eventName(),
                request.eventType(),
                request.venueOrLocation(),
                request.eventDate(),
                request.durationHours(),
                request.budgetRange(),
                request.projectDetails(),
                com.portfolio.photography.domain.enums.BookingStatus.NEW,
                java.time.Instant.now()
        );

        when(bookingService.createBooking(any(BookingInquiryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/public/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clientName").value("Alex Promoter"))
                .andExpect(jsonPath("$.status").value("NEW"));
    }

    @Test
    void createBooking_withMissingRequiredFields_returnsBadRequest() throws Exception {
        // Missing clientName, clientEmail, eventName, eventType, eventDate
        String invalidJson = """
                {
                  "clientPhone": "+389 70 123 456",
                  "venueOrLocation": "Club Epicenter"
                }
                """;

        mockMvc.perform(post("/api/v1/public/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void createBooking_withInvalidEmail_returnsBadRequest() throws Exception {
        BookingInquiryRequest request = new BookingInquiryRequest(
                "Alex Promoter",
                "not-an-email",  // Invalid email
                null,
                "Club Epicenter",
                "NIGHTCLUB",
                null,
                LocalDate.now().plusDays(30),
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/public/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }
}
