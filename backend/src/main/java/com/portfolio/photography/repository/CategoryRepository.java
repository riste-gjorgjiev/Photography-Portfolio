package com.portfolio.photography.repository;

import com.portfolio.photography.domain.entity.Category;
import com.portfolio.photography.domain.enums.TimeOfDay;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findAllByOrderByTimeOfDayAscDisplayOrderAsc();
    List<Category> findByTimeOfDayOrderByDisplayOrderAsc(TimeOfDay timeOfDay);
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
