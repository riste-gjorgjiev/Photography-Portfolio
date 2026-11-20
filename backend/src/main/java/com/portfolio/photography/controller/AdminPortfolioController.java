package com.portfolio.photography.controller;

import com.portfolio.photography.domain.enums.BookingStatus;
import com.portfolio.photography.dto.*;
import com.portfolio.photography.service.BookingService;
import com.portfolio.photography.service.PortfolioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminPortfolioController {

    private final PortfolioService portfolioService;
    private final BookingService bookingService;

    @PostMapping(value = "/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PhotoResponse> uploadPhoto(
            @RequestPart("file") MultipartFile file,
            @Valid @RequestPart("request") PhotoUploadRequest request) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioService.uploadPhoto(file, request));
    }

    @PostMapping("/albums")
    public ResponseEntity<EventAlbumResponse> createAlbum(
            @Valid @RequestBody CreateEventAlbumRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioService.createAlbum(request));
    }

    @PostMapping("/categories")
    public ResponseEntity<CategoryResponse> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioService.createCategory(request));
    }

    @PutMapping("/albums/{id}")
    public ResponseEntity<EventAlbumResponse> updateAlbum(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEventAlbumRequest request) {
        return ResponseEntity.ok(portfolioService.updateAlbum(id, request));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<CategoryResponse> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        return ResponseEntity.ok(portfolioService.updateCategory(id, request));
    }

    @PutMapping("/photos/{id}")
    public ResponseEntity<PhotoResponse> updatePhoto(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePhotoRequest request) {
        return ResponseEntity.ok(portfolioService.updatePhoto(id, request));
    }

    @PostMapping(value = "/albums/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EventAlbumResponse> uploadAlbumCover(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(portfolioService.uploadAlbumCover(id, file));
    }

    @PutMapping("/albums/{id}/photos/order")
    public ResponseEntity<List<PhotoResponse>> reorderAlbumPhotos(
            @PathVariable UUID id,
            @Valid @RequestBody ReorderAlbumPhotosRequest request) {
        return ResponseEntity.ok(portfolioService.reorderAlbumPhotos(id, request.photoIds()));
    }

    @DeleteMapping("/photos/{id}")
    public ResponseEntity<Void> deletePhoto(@PathVariable UUID id) {
        portfolioService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/albums/{id}")
    public ResponseEntity<Void> deleteAlbum(@PathVariable UUID id) {
        portfolioService.deleteAlbum(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        portfolioService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingInquiryResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @PatchMapping("/bookings/{id}/status")
    public ResponseEntity<BookingInquiryResponse> updateBookingStatus(
            @PathVariable UUID id,
            @RequestParam BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, status));
    }
}
