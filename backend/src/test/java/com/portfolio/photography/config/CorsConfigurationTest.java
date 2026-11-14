package com.portfolio.photography.config;

import com.portfolio.photography.controller.PublicPortfolioController;
import com.portfolio.photography.service.BookingService;
import com.portfolio.photography.service.PortfolioService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicPortfolioController.class)
@AutoConfigureMockMvc
@Import(SecurityConfig.class)
@TestPropertySource(properties = {
        "portfolio.cors.allowed-origins=http://localhost:4200",
        "portfolio.cloudinary.cloud-name=demo"
})
class CorsConfigurationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PortfolioService portfolioService;

    @MockBean
    private BookingService bookingService;

    @Test
    void preflightFromProductionSubdomain_isAllowed() throws Exception {
        mockMvc.perform(options("/api/v1/public/categories")
                        .header(HttpHeaders.ORIGIN, "https://photos.riste-gjorgjiev.dev")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "https://photos.riste-gjorgjiev.dev"));
    }

    @Test
    void preflightFromConfiguredLocalhostOrigin_isAllowed() throws Exception {
        mockMvc.perform(options("/api/v1/public/categories")
                        .header(HttpHeaders.ORIGIN, "http://localhost:4200")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(
                        HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "http://localhost:4200"));
    }

    @Test
    void preflightFromUnknownOrigin_isRejected() throws Exception {
        mockMvc.perform(options("/api/v1/public/categories")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }
}
