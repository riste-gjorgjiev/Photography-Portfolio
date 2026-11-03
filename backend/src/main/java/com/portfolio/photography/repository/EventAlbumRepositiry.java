package com.portfolio.photography.repository;

import com.portfolio.photography.domain.entity.EventAlbum;
import com.portfolio.photography.domain.enums.TimeOfDay;
import org.hibernate.validator.constraints.ParameterScriptAssert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventAlbumRepositiry extends JpaRepository<EventAlbum, UUID> {

    @Query("""
            SELECT a FROM EventAlbum a
            JOIN FETCH a.category c
            WHERE (:timeOfDay IS NULL OR c.timeOfDay = :timeOfDay)
            AND (:categorySlug IS NULL OR c.slug = :categorySlug)
            ORDER BY a.eventDate DESC NULLS LAST, a.createdAt DESC
            """)
    List<EventAlbum> findFilteredAlbums(
            @Param("timeOfDay") TimeOfDay timeOfDay,
            @Param("categorySlug") String categorySlug
    );

    @Query("SELECT a FROM EventAlbum a JOIN FETCH a.category WHERE a.slug = :slug")
    Optional<EventAlbum> findBySlugWithCategory(@Param("slug") String slug);
}
