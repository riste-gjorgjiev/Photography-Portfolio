-- ============================================================================
-- V3__remove_seed_sample_data.sql
-- Removes the demo albums, photos, and categories created by V1/V2 so the CMS
-- starts empty and the owner can build their own portfolio.
-- Do not edit V1/V2: they have already been applied by Flyway.
-- ============================================================================

-- Photos reference albums and categories with ON DELETE RESTRICT, so remove
-- the seeded photos first.
DELETE FROM photos
WHERE cloudinary_public_id LIKE 'seed-%';

-- Albums reference categories with ON DELETE RESTRICT, so remove the seeded
-- albums next. Photos attached to these albums are detached via ON DELETE SET NULL.
DELETE FROM event_albums
WHERE slug IN (
    'subzero-warehouse-rave',
    'pelister-alpine-nocturne',
    'balkan-highland-fauna'
);

-- Finally remove the seeded categories.
DELETE FROM categories
WHERE slug IN (
    'nightclubs-raves',
    'astrophotography',
    'evening-events',
    'wildlife',
    'nature-landscapes',
    'daytime-events'
);
