-- Track the storage public id of an album's cover image so replaced covers can
-- be cleaned up and so "use an existing photo as cover" can be recorded.
ALTER TABLE event_albums ADD COLUMN cover_photo_public_id VARCHAR(255);
