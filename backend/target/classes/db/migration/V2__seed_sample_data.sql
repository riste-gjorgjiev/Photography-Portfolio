-- ============================================================================
-- V2__seed_sample_data.sql
-- Seeds sample Event Albums and Photos (Nightlife, Astro, Wildlife, Nature)
-- so Phase 4 (Gallery Grid, Ambient Engine & Lightbox) can be tested live.
-- ============================================================================

-- 1. SEED SAMPLE EVENT ALBUMS
INSERT INTO event_albums (title, slug, category_id, venue_name, location, event_date, description, cover_photo_url, dominant_hex, is_featured)
VALUES
    (
        'Subzero Warehouse Rave',
        'subzero-warehouse-rave',
        (SELECT id FROM categories WHERE slug = 'nightclubs-raves'),
        'Kraftwerk Hall',
        'Skopje',
        '2026-10-24',
        'Peak-hour laser arrays, heavy industrial basslines, and crowd energy from 1 AM to sunrise.',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
        '#FF007F',
        TRUE
    ),
    (
        'Pelister Alpine Nocturne',
        'pelister-alpine-nocturne',
        (SELECT id FROM categories WHERE slug = 'astrophotography'),
        'Pelister National Park',
        'Baba Mountain',
        '2026-08-14',
        'Bortle 2 dark-sky expedition tracking the Milky Way core above glacial mountain lakes at 2,200m.',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80',
        '#4F46E5',
        TRUE
    ),
    (
        'Balkan Lynx & Highland Fauna',
        'balkan-highland-fauna',
        (SELECT id FROM categories WHERE slug = 'wildlife'),
        'Mavrovo Reserve',
        'Western Highlands',
        '2026-09-19',
        'Early morning patience with a 400mm telephoto prime in mist-covered beech and fir forests.',
        'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1600&q=80',
        '#2D5A27',
        TRUE
    );

-- 2. SEED SAMPLE PHOTOS WITH EXIF & AMBIENT HEX PALETTES
INSERT INTO photos (
    title, caption, cloudinary_public_id, image_url, width, height,
    time_of_day, category_id, event_album_id,
    dominant_hex_primary, dominant_hex_secondary,
    camera_model, lens_model, focal_length, aperture, shutter_speed, iso, captured_at,
    is_featured, display_order
)
VALUES
    -- NIGHT: Nightclubs & Raves (2 photos)
    (
        'Mainstage Strobe Ignition',
        '3 AM drop captured right from the FOH booth as magenta and cyan lasers cut through the haze.',
        'seed-nightclub-01',
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=85',
        1600, 1067, 'NIGHT',
        (SELECT id FROM categories WHERE slug = 'nightclubs-raves'),
        (SELECT id FROM event_albums WHERE slug = 'subzero-warehouse-rave'),
        '#FF007F', '#7928CA',
        'Sony A7 IV', 'FE 24-70mm F2.8 GM II', '24 mm', 'f/2.8', '1/200 sec', 6400, '2026-10-24T02:58:00Z',
        TRUE, 1
    ),
    (
        'Booth Silhouette & Crowd Hands',
        'Backlit DJ booth during the closing techno set.',
        'seed-nightclub-02',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85',
        1600, 1067, 'NIGHT',
        (SELECT id FROM categories WHERE slug = 'nightclubs-raves'),
        (SELECT id FROM event_albums WHERE slug = 'subzero-warehouse-rave'),
        '#00E5FF', '#3B82F6',
        'Sony A7 IV', 'FE 35mm F1.4 GM', '35 mm', 'f/1.4', '1/250 sec', 3200, '2026-10-24T04:15:00Z',
        TRUE, 2
    ),

    -- NIGHT: Astrophotography (1 photo)
    (
        'Galactic Core Over Ridge',
        'Stacked 20-second exposures under crystal-clear alpine skies.',
        'seed-astro-01',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=85',
        1600, 1067, 'NIGHT',
        (SELECT id FROM categories WHERE slug = 'astrophotography'),
        (SELECT id FROM event_albums WHERE slug = 'pelister-alpine-nocturne'),
        '#6366F1', '#0EA5E9',
        'Sony A7 IV', 'FE 14mm F1.8 GM', '14 mm', 'f/1.8', '20 sec', 3200, '2026-08-14T23:40:00Z',
        TRUE, 3
    ),

    -- DAY: Wildlife (2 photos)
    (
        'Canopy Gaze at First Light',
        'Spotted right as golden-hour sunbeams broke through the dense morning fog.',
        'seed-wildlife-01',
        'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1200&q=85',
        1200, 1500, 'DAY',
        (SELECT id FROM categories WHERE slug = 'wildlife'),
        (SELECT id FROM event_albums WHERE slug = 'balkan-highland-fauna'),
        '#2D5A27', '#15803D',
        'Sony A7 IV', 'FE 200-600mm F5.6-6.3 G OSS', '600 mm', 'f/6.3', '1/1000 sec', 1600, '2026-09-19T06:42:00Z',
        TRUE, 4
    ),
    (
        'Highland Red Stag in Amber Grass',
        'Low-angle telephoto compression during the autumn rut.',
        'seed-wildlife-02',
        'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=1200&q=85',
        1200, 1600, 'DAY',
        (SELECT id FROM categories WHERE slug = 'wildlife'),
        (SELECT id FROM event_albums WHERE slug = 'balkan-highland-fauna'),
        '#D97706', '#78350F',
        'Sony A7 IV', 'FE 200-600mm F5.6-6.3 G OSS', '400 mm', 'f/5.6', '1/800 sec', 800, '2026-09-19T07:18:00Z',
        TRUE, 5
    ),

    -- DAY: Nature & Landscapes (1 photo)
    (
        'Misty Pine Valley Sunburst',
        'Golden hour rays illuminating the valley floor after an overnight rainstorm.',
        'seed-nature-01',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=85',
        1600, 1067, 'DAY',
        (SELECT id FROM categories WHERE slug = 'nature-landscapes'),
        NULL,
        '#D4A373', '#065F46',
        'Sony A7 IV', 'FE 24-70mm F2.8 GM II', '50 mm', 'f/8.0', '1/125 sec', 100, '2026-09-20T06:55:00Z',
        TRUE, 6
    );