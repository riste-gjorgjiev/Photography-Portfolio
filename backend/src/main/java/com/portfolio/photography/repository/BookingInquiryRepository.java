package com.portfolio.photography.repository;

import com.portfolio.photography.domain.entity.BookingInquiry;
import com.portfolio.photography.domain.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BookingInquiryRepository extends JpaRepository<BookingInquiry, UUID> {
    List<BookingInquiry> findAllByOrderByCreatedAtDesc();
    List<BookingInquiry> findByStatusOrderByCreatedAtDesc(BookingStatus status);

}
