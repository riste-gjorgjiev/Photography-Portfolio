package com.portfolio.photography.dto;

import com.portfolio.photography.domain.enums.BookingStatus;
import com.portfolio.photography.domain.enums.TimeOfDay;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BookingInquiryResponse(
        UUID id,
        String clientName,
        String clientEmail,
        String clientPhone,
        String eventName,
        String eventType,
        String venueOrLocation,
        LocalDate eventDate,
        Integer durationHours,
        String budgetRange,
        String projectDetails,
        BookingStatus status,
        Instant createdAt
) {
}
