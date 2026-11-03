package com.portfolio.photography.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

public record BookingInquiryRequest(
        @NotBlank @Size(max = 120) String clientName,
        @NotBlank @Email @Size(max = 100) String clientEmail,
        @Size(max = 40) String clientPhone,
        @NotBlank @Size(max = 100) String eventName,
        @NotBlank @Size(max = 80) String eventType,
        @Size(max = 180) String venueOrLocation,
        @NotNull @FutureOrPresent(message = "Event date must be today or in the future")
        LocalDate eventDate,
        @Min(1) Integer durationHours,
        @Size(max = 200) String budgetRange,
        @Size(max = 3000) String projectDetails
) {
}
