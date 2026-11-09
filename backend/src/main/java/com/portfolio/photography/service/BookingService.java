package com.portfolio.photography.service;

import com.portfolio.photography.domain.entity.BookingInquiry;
import com.portfolio.photography.domain.enums.BookingStatus;
import com.portfolio.photography.dto.BookingInquiryRequest;
import com.portfolio.photography.dto.BookingInquiryResponse;
import com.portfolio.photography.dto.PortfolioMapper;
import com.portfolio.photography.exception.ResourceNotFoundException;
import com.portfolio.photography.repository.BookingInquiryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingInquiryRepository bookingInquiryRepository;
    private final PortfolioMapper mapper;

    public BookingInquiryResponse createBooking(BookingInquiryRequest request) {
        BookingInquiry inquiry = BookingInquiry.builder()
                .clientName(request.clientName())
                .clientEmail(request.clientEmail())
                .clientPhone(request.clientPhone())
                .eventName(request.eventName())
                .eventType(request.eventType())
                .venueOrLocation(request.venueOrLocation())
                .eventDate(request.eventDate())
                .durationHours(request.durationHours())
                .budgetRange(request.budgetRange())
                .projectDetails(request.projectDetails())
                .build();

        BookingInquiry saved = bookingInquiryRepository.save(inquiry);
        return mapper.toBookingInquiryResponse(saved);
    }

    public List<BookingInquiryResponse> getAllBookings() {
        return bookingInquiryRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(mapper::toBookingInquiryResponse)
                .toList();
    }

    public BookingInquiryResponse updateBookingStatus(UUID id, BookingStatus status) {
        BookingInquiry inquiry = bookingInquiryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BookingInquiry", "id", id));
        inquiry.setStatus(status);
        BookingInquiry saved = bookingInquiryRepository.save(inquiry);
        return mapper.toBookingInquiryResponse(saved);
    }
}
