package com.portfolio.photography.controller;

import com.portfolio.photography.dto.*;
import com.portfolio.photography.service.BookingService;
import com.portfolio.photography.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicPortfolioController {

    private final PortfolioService portfolioService;
    private final BookingService bookingService;

    @GetMapping("/categories")
    public ResponseEntity<List<CategoryResponse>> getCategories(
            @RequestParam(required = false) String timeOfDay) {
        return ResponseEntity.ok(portfolioService.getCategories(timeOfDay));
    }

    @GetMapping("/albums")
    public ResponseEntity<List<EventAlbumResponse>> getAlbums(
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String categorySlug) {
        return ResponseEntity.ok(portfolioService.getAlbums(timeOfDay, categorySlug));
    }

    @GetMapping("/albums/{slug}")
    public ResponseEntity<EventAlbumResponse> getAlbumBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(portfolioService.getAlbumBySlug(slug));
    }

    @GetMapping("/photos")
    public ResponseEntity<List<PhotoResponse>> getPhotos(
            @RequestParam(required = false) String timeOfDay,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) String albumSlug,
            @RequestParam(required = false) Boolean featuredOnly) {
        return ResponseEntity.ok(portfolioService.getPhotos(timeOfDay, categorySlug, albumSlug, featuredOnly));
    }

    @PostMapping("/bookings")
    public ResponseEntity<BookingInquiryResponse> createBooking(
            @Valid @RequestBody BookingInquiryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }
}
