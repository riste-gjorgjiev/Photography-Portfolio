-- ============================================================================
-- V1__init_schema.sql
-- Core schema for "By Day / By Night" Photography Portfolio & Event Booking
-- ============================================================================

-- 1. CATEGORIES TABLE
CREATE TABLE categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) NOT NULL UNIQUE,
    description         TEXT,
    time_of_day         VARCHAR(10)  NOT NULL CHECK (time_of_day IN ('DAY', 'NIGHT')),
    default_ambient_hex VARCHAR(7)   NOT NULL DEFAULT '#1E293B',
    display_order       INTEGER      NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_time_of_day ON categories(time_of_day, display_order);

-- 2. EVENT ALBUMS TABLE (Groups photos from a specific club night, festival, or expedition)
CREATE TABLE event_albums (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title               VARCHAR(180) NOT NULL,
    slug                VARCHAR(180) NOT NULL UNIQUE,
    category_id         UUID         NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    venue_name          VARCHAR(150),
    location            VARCHAR(150),
    event_date          DATE,
    description         TEXT,
    cover_photo_url     TEXT,
    dominant_hex        VARCHAR(7)   NOT NULL DEFAULT '#6366F1',
    is_featured         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_event_albums_category ON event_albums(category_id);
CREATE INDEX idx_event_albums_date ON event_albums(event_date DESC);

-- 3. PHOTOS TABLE (Stores Cloudinary asset metadata, intrinsic dimensions, colour hexes & EXIF)
CREATE TABLE photos (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title                   VARCHAR(180),
    caption                 TEXT,
    cloudinary_public_id    VARCHAR(255) NOT NULL UNIQUE,
    image_url               TEXT         NOT NULL,
    width                   INTEGER      NOT NULL CHECK (width > 0),
    height                  INTEGER      NOT NULL CHECK (height > 0),
    aspect_ratio            NUMERIC(6,4) GENERATED ALWAYS AS (ROUND((width::NUMERIC / height::NUMERIC), 4)) STORED,
    time_of_day             VARCHAR(10)  NOT NULL CHECK (time_of_day IN ('DAY', 'NIGHT')),
    category_id             UUID         NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    event_album_id          UUID         REFERENCES event_albums(id) ON DELETE SET NULL,

    -- Dynamic Ambient Glow Colours (Approach B)
    dominant_hex_primary    VARCHAR(7)   NOT NULL DEFAULT '#3B82F6',
    dominant_hex_secondary  VARCHAR(7)   NOT NULL DEFAULT '#1D4ED8',

    -- Extracted EXIF Camera Metadata (Nullable for graceful fallback)
    camera_model            VARCHAR(120),
    lens_model              VARCHAR(150),
    focal_length            VARCHAR(30),
    aperture                VARCHAR(20),
    shutter_speed           VARCHAR(30),
    iso                     INTEGER,
    captured_at             TIMESTAMPTZ,

    is_featured             BOOLEAN      NOT NULL DEFAULT FALSE,
    display_order           INTEGER      NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_time_of_day ON photos(time_of_day, display_order);
CREATE INDEX idx_photos_category ON photos(category_id, display_order);
CREATE INDEX idx_photos_album ON photos(event_album_id, display_order);
CREATE INDEX idx_photos_featured ON photos(is_featured) WHERE is_featured = TRUE;

-- 4. BOOKING INQUIRIES TABLE (Event promoters & client leads)
CREATE TABLE booking_inquiries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name         VARCHAR(120) NOT NULL,
    client_email        VARCHAR(180) NOT NULL,
    client_phone        VARCHAR(40),
    event_name          VARCHAR(180) NOT NULL,
    event_type          VARCHAR(80)  NOT NULL, -- e.g. 'NIGHTCLUB', 'FESTIVAL', 'PRIVATE_EVENT', 'COMMERCIAL'
    venue_or_location   VARCHAR(180),
    event_date          DATE         NOT NULL,
    duration_hours      INTEGER,
    budget_range        VARCHAR(80),
    project_details     TEXT,
    status              VARCHAR(20)  NOT NULL DEFAULT 'NEW'
                        CHECK (status IN ('NEW', 'CONTACTED', 'BOOKED', 'ARCHIVED')),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_inquiries_status ON booking_inquiries(status, created_at DESC);

-- ============================================================================
-- SEED DATA: Initial "By Night" & "By Day" Categories
-- ============================================================================
INSERT INTO categories (name, slug, description, time_of_day, default_ambient_hex, display_order)
VALUES
    -- BY NIGHT
    ('Nightclubs & Raves', 'nightclubs-raves', 'High-energy crowd, DJ, and laser documentation from underground clubs and festivals.', 'NIGHT', '#FF007F', 1),
    ('Astrophotography', 'astrophotography', 'Long-exposure nightscapes, deep sky objects, and Milky Way compositions.', 'NIGHT', '#4F46E5', 2),
    ('Evening Events', 'evening-events', 'Concerts, gala dinners, and low-light cultural gatherings.', 'NIGHT', '#00E5FF', 3),

    -- BY DAY
    ('Wildlife', 'wildlife', 'Untamed fauna captured in their natural habitats with patience and long glass.', 'DAY', '#2D5A27', 1),
    ('Nature & Landscapes', 'nature-landscapes', 'Mountains, forests, and atmospheric golden-hour vistas.', 'DAY', '#D4A373', 2),
    ('Daytime Events', 'daytime-events', 'Outdoor festivals, sports, and sunlit documentary coverage.', 'DAY', '#F59E0B', 3);
