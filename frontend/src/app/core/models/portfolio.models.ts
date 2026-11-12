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

export const EVENT_TYPES = [
  { value: 'NIGHTCLUB', label: 'Nightclub / Rave Coverage', ambientHex: '#FF007F' },
  { value: 'FESTIVAL', label: 'Festival / Multi-Stage', ambientHex: '#7928CA' },
  { value: 'EVENING_EVENT', label: 'Corporate / Evening Event', ambientHex: '#00E5FF' },
  { value: 'WILDLIFE_PRINT', label: 'Wildlife / Fine Art Print', ambientHex: '#2D5A27' },
  { value: 'PRIVATE_SHOOT', label: 'Private / Editorial Shoot', ambientHex: '#D4A373' },
  { value: 'OTHER', label: 'Other / Custom', ambientHex: '#6B7280' },
] as const;

export type EventTypeValue = (typeof EVENT_TYPES)[number]['value'];

export const BUDGET_RANGES = [
  '< €300',
  '€300 – €600',
  '€600 – €1,200',
  '€1,200+ / Custom',
] as const;


export const CATEGORY_TO_EVENT_TYPE: Record<string, string> = {
  'nightclubs-raves': 'NIGHTCLUB',
  'astrophotography': 'PRIVATE_SHOOT',
  'evening-events': 'EVENING_EVENT',
  'wildlife': 'WILDLIFE_PRINT',
  'nature-landscapes': 'WILDLIFE_PRINT',
  'daytime-events': 'FESTIVAL',
};
