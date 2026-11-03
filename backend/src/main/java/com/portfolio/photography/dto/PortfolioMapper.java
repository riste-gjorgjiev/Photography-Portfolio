package com.portfolio.photography.dto;

import com.portfolio.photography.domain.entity.BookingInquiry;
import com.portfolio.photography.domain.entity.Category;
import com.portfolio.photography.domain.entity.EventAlbum;
import com.portfolio.photography.domain.entity.Photo;
import lombok.val;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PortfolioMapper {
    public CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getDescription(),
                category.getTimeOfDay(),
                category.getDefaultAmbientHex(),
                category.getDisplayOrder()
        );
    }

    public EventAlbumResponse toEventAlbumResponse(EventAlbum eventAlbum) {
        Category category = eventAlbum.getCategory();
        return new EventAlbumResponse(
                eventAlbum.getId(),
                eventAlbum.getTitle(),
                eventAlbum.getSlug(),
                category.getId(),
                category.getName(),
                category.getSlug(),
                category.getTimeOfDay(),
                eventAlbum.getVenueName(),
                eventAlbum.getLocation(),
                eventAlbum.getEventDate(),
                eventAlbum.getDescription(),
                eventAlbum.getCoverPhotoUrl(),
                eventAlbum.getDominatHex(),
                eventAlbum.isFeatured()
        );
    }

    public PhotoResponse toPhotoResponse(Photo photo) {
        Category category = photo.getCategory();
        EventAlbum album = photo.getEventAlbum();

        BigDecimal ratio = photo.getAspectRatio();
        if (ratio == null && photo.getWidth() != null && photo.getHeight() != null && photo.getHeight() > 0) {
            ratio = BigDecimal.valueOf(photo.getWidth())
                    .divide(BigDecimal.valueOf(photo.getHeight()), 4, RoundingMode.HALF_UP);
        }
        ExifMetadataDto exif = new ExifMetadataDto(
                photo.getCameraModel(),
                photo.getLensModel(),
                photo.getFocalLength(),
                photo.getAperture(),
                photo.getShutterSpeed(),
                photo.getIso(),
                photo.getCapturedAt()
        );

        return new PhotoResponse(
                photo.getId(),
                photo.getTitle(),
                photo.getCaption(),
                photo.getCloudinaryPublicId(),
                photo.getImageUrl(),
                photo.getWidth(),
                photo.getHeight(),
                ratio,
                photo.getTimeOfDay(),
                category.getId(),
                category.getName(),
                category.getSlug(),
                album != null ? album.getId() : null,
                album != null ? album.getTitle() : null,
                photo.getDominantHexPrimary(),
                photo.getDominantHexSecondary(),
                exif,
                photo.isFeatured(),
                photo.getDisplayOrder(),
                photo.getCreatedAt()
        );

    }
    public BookingInquiryResponse toBookingInquiryResponse(BookingInquiry bookingInquiry){
        return new BookingInquiryResponse(
                bookingInquiry.getId(),
                bookingInquiry.getClientName(),
                bookingInquiry.getClientEmail(),
                bookingInquiry.getClientPhone(),
                bookingInquiry.getEventName(),
                bookingInquiry.getEventType(),
                bookingInquiry.getVenueOrLocation(),
                bookingInquiry.getEventDate(),
                bookingInquiry.getDurationHours(),
                bookingInquiry.getBudgetRange(),
                bookingInquiry.getProjectDetails(),
                bookingInquiry.getStatus(),
                bookingInquiry.getCreatedAt()
        );
    }
}
