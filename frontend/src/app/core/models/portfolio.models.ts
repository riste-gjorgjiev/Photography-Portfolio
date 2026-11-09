export type TimeOfDay = 'DAY' | 'NIGHT';
export type BookingStatus = 'NEW' | 'CONTACTED' | 'BOOKED' | 'ARCHIVED';

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timeOfDay: TimeOfDay;
  defaultAmbientHex: string;
  displayOrder: number;
}

export interface EventAlbumResponse {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  timeOfDay: TimeOfDay;
  venueName: string | null;
  location: string | null;
  eventDate: string | null;
  description: string | null;
  coverPhotoUrl: string | null;
  dominantHex: string;
  featured: boolean;
}

export interface ExifMetadataDto {
  cameraModel: string | null;
  lensModel: string | null;
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
  capturedAt: string | null;
}

export interface PhotoResponse {
  id: string;
  title: string | null;
  caption: string | null;
  cloudinaryPublicId: string;
  imageUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  timeOfDay: TimeOfDay;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  eventAlbumId: string | null;
  eventAlbumTitle: string | null;
  dominantHexPrimary: string;
  dominantHexSecondary: string;
  exif: ExifMetadataDto;
  featured: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface BookingInquiryRequest {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  eventName: string;
  eventType: string;
  venueOrLocation?: string;
  eventDate: string; // YYYY-MM-DD
  durationHours?: number;
  budgetRange?: string;
  projectDetails?: string;
}

export interface BookingInquiryResponse {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  eventName: string;
  eventType: string;
  venueOrLocation: string | null;
  eventDate: string | null;
  durationHours: number | null;
  budgetRange: string | null;
  projectDetails: string | null;
  status: BookingStatus;
  createdAt: string;
}

export interface PhotoUploadRequest {
  title: string | null;
  caption: string | null;
  categoryId: string;
  eventAlbumId: string | null;
  timeOfDayOverride: TimeOfDay | null;
  featured: boolean;
  displayOrder: number | null;
}

export interface CreateEventAlbumRequest {
  title: string;
  slug: string;
  categoryId: string;
  venueName: string | null;
  location: string | null;
  eventDate: string | null;
  description: string | null;
  coverPhotoUrl: string | null;
  dominantHex: string | null;
  featured: boolean;
}
