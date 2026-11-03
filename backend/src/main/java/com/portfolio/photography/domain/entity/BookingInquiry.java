package com.portfolio.photography.domain.entity;

import com.portfolio.photography.domain.enums.BookingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "booking_inquiries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingInquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "client_name", nullable = false, length = 120)
    private String clientName;

    @Column(name = "client_email", nullable = false, length = 120)
    private String clientEmail;

    @Column(name = "client_phone", length = 40)
    private String clientPhone;

    @Column(name = "event_name", nullable = false, length = 180)
    private String eventName;

    @Column(name = "event_type", nullable = false, length = 80)
    private String eventType;

    @Column(name = "venue_or_location", length = 180)
    private String venueOrLocation;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "budget_range",  length = 80)
    private String budgetRange;

    @Column(name = "project_details", columnDefinition = "TEXT")
    private String projectDetails;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private BookingStatus status = BookingStatus.NEW;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
