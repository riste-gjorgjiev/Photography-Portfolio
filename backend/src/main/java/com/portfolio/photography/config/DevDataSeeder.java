package com.portfolio.photography.config;

import com.portfolio.photography.domain.entity.Category;
import com.portfolio.photography.domain.entity.EventAlbum;
import com.portfolio.photography.domain.entity.Photo;
import com.portfolio.photography.domain.enums.TimeOfDay;
import com.portfolio.photography.repository.CategoryRepository;
import com.portfolio.photography.repository.EventAlbumRepositiry;
import com.portfolio.photography.repository.PhotoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Opt-in sample content for the {@code dev} profile so a freshly migrated local
 * database is not empty. Seeds only a completely empty database and runs in a
 * single transaction, so a failed or interrupted start never leaves partial
 * rows that break the next one. Never active in production (default profile).
 *
 * <p>Enabled by {@code SPRING_PROFILES_ACTIVE=dev} — {@code scripts/dev.sh} sets
 * it automatically. Images use picsum.photos URLs with varying aspect ratios,
 * including an ultrawide frame for testing the gallery layout.
 */
@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DevDataSeeder implements ApplicationRunner {

    private final CategoryRepository categoryRepository;
    private final EventAlbumRepositiry eventAlbumRepository;
    private final PhotoRepository photoRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Only ever seed a totally empty database; never touch real content.
        if (categoryRepository.count() > 0
                || eventAlbumRepository.count() > 0
                || photoRepository.count() > 0) {
            return;
        }

        Category nightlife = categoryRepository.save(Category.builder()
                .name("Nightlife")
                .slug("nightlife-demo")
                .description("Demo nightlife content for local development")
                .timeOfDay(TimeOfDay.NIGHT)
                .defaultAmbientHex("#7928CA")
                .displayOrder(0)
                .build());

        Category daytime = categoryRepository.save(Category.builder()
                .name("Daytime Events")
                .slug("daytime-events-demo")
                .description("Demo daytime content for local development")
                .timeOfDay(TimeOfDay.DAY)
                .defaultAmbientHex("#00E5FF")
                .displayOrder(1)
                .build());

        EventAlbum album = eventAlbumRepository.save(EventAlbum.builder()
                .title("Demo Warehouse Session")
                .slug("demo-warehouse-session")
                .category(nightlife)
                .venueName("Local Demo Venue")
                .location("Skopje")
                .eventDate(LocalDate.now().minusMonths(1))
                .description("Sample album seeded by the dev profile.")
                .coverPhotoUrl(picsum(1015, 1920, 1080))
                .dominatHex("#FF007F")
                .featured(true)
                .build());

        // Varied ratios (portrait, square, landscape, ultrawide) so the masonry
        // layout and the album reordering UI have something realistic to show.
        List<int[]> shots = List.of(
                new int[]{1015, 1920, 1080},
                new int[]{1025, 1280, 1920},
                new int[]{1031, 1600, 1600},
                new int[]{1035, 2400, 1000},
                new int[]{1043, 1600, 1067},
                new int[]{1050, 1200, 1600}
        );

        for (int i = 0; i < shots.size(); i++) {
            int[] shot = shots.get(i);
            photoRepository.save(Photo.builder()
                    .title("Demo shot " + (i + 1))
                    .caption("Seeded locally by the dev profile.")
                    .cloudinaryPublicId("dev-seed/" + shot[0])
                    .imageUrl(picsum(shot[0], shot[1], shot[2]))
                    .width(shot[1])
                    .height(shot[2])
                    .timeOfDay(i % 2 == 0 ? TimeOfDay.NIGHT : TimeOfDay.DAY)
                    .category(i % 2 == 0 ? nightlife : daytime)
                    .eventAlbum(album)
                    .dominantHexPrimary(i % 2 == 0 ? "#FF007F" : "#00E5FF")
                    .dominantHexSecondary(i % 2 == 0 ? "#7928CA" : "#1D4ED8")
                    .featured(i < 3)
                    .displayOrder(i)
                    .build());
        }

        log.info("Seeded local dev content: 2 categories, 1 album, {} photos", shots.size());
    }

    private String picsum(int id, int width, int height) {
        return "https://picsum.photos/id/%d/%d/%d".formatted(id, width, height);
    }
}
