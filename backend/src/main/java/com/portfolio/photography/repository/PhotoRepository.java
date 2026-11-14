package com.portfolio.photography.repository;

import com.portfolio.photography.domain.entity.Photo;
import com.portfolio.photography.domain.enums.TimeOfDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PhotoRepository extends JpaRepository<Photo, UUID> {

    boolean existsByCategoryId(UUID categoryId);

    @Query("""
            SELECT p FROM Photo p
            JOIN FETCH p.category c
            LEFT JOIN FETCH p.eventAlbum a
            WHERE (:timeOfDay IS NULL OR p.timeOfDay = :timeOfDay)
            AND (:categorySlug IS NULL OR c.slug = :categorySlug)
            AND (:albumSlug IS NULL OR a.slug = :albumSlug)
            AND (:featuredOnly = false OR p.featured = true)
            ORDER BY p.displayOrder ASC, p.createdAt DESC
            """)
    List<Photo> findFilteredPhotos(
            @Param("timeOfDay") TimeOfDay timeOfDay,
            @Param("categorySlug") String categorySlug,
            @Param("albumSlug") String albumSlug,
            @Param("featuredOnly") boolean featuredOnly
    );

    @Query("""
            SELECT p FROM Photo p
            JOIN FETCH p.category
            LEFT JOIN FETCH p.eventAlbum
            WHERE p.id = :id
            """)
    Optional<Photo> findByIdWithAssociations(@Param("id") UUID id);
}
