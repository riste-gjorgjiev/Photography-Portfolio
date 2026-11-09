import { Component, computed, effect, inject, signal } from '@angular/core';
import { EventAlbumCardComponent } from './event-album-card.component';
import { LightboxModalComponent } from '../../shared/components/lightbox-modal/lightbox-modal.component';
import { PhotoCardComponent } from '../../shared/components/photo-card/photo-card.component';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';
import { AtmosphereService } from '../../core/services/atmosphere.service';
import { CategoryResponse, EventAlbumResponse, PhotoResponse } from '../../core/models/portfolio.models';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    EventAlbumCardComponent,
    PhotoCardComponent,
    LightboxModalComponent,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css',
})
export class GalleryComponent {
  private readonly api = inject(PortfolioApiService);
  readonly atmosphere = inject(AtmosphereService);

  readonly categories = signal<CategoryResponse[]>([]);
  readonly albums = signal<EventAlbumResponse[]>([]);
  readonly photos = signal<PhotoResponse[]>([]);

  readonly lightboxPhoto = signal<PhotoResponse | null>(null);

  readonly lightboxIndex = computed(() => {
    const photo = this.lightboxPhoto();
    if (!photo) return -1;
    return this.filteredPhotos().findIndex((p) => p.id === photo.id);
  });

  readonly filteredCategories = computed(() => {
    const mode = this.atmosphere.lightingMode();
    if (mode === 'ALL') return this.categories();
    return this.categories().filter((c) => c.timeOfDay === mode);
  });

  readonly filteredAlbums = computed(() => {
    const mode = this.atmosphere.lightingMode();
    const categorySlug = this.atmosphere.activeCategorySlug();
    let result = this.albums();
    if (mode !== 'ALL') {
      result = result.filter((a) => a.timeOfDay === mode);
    }
    if (categorySlug) {
      result = result.filter((a) => a.categorySlug === categorySlug);
    }
    return result;
  });

  readonly filteredPhotos = computed(() => {
    const mode = this.atmosphere.lightingMode();
    const categorySlug = this.atmosphere.activeCategorySlug();
    const albumSlug = this.atmosphere.activeAlbumSlug();
    let result = this.photos();
    if (mode !== 'ALL') {
      result = result.filter((p) => p.timeOfDay === mode);
    }
    if (categorySlug) {
      result = result.filter((p) => p.categorySlug === categorySlug);
    }
    if (albumSlug) {
      // Find the active album
      const activeAlbum = this.albums().find((a) => a.slug === albumSlug);
      if (activeAlbum) {
        // Filter photos by album ID OR by category if album has no photos assigned
        result = result.filter((p) => 
          p.eventAlbumId === activeAlbum.id || 
          (p.eventAlbumId === null && p.categorySlug === activeAlbum.categorySlug)
        );
      }
    }
    return result;
  });

  readonly activeAlbumSlug = this.atmosphere.activeAlbumSlug;

  readonly activeAlbum = computed(() => {
    const slug = this.atmosphere.activeAlbumSlug();
    if (!slug) return null;
    return this.albums().find((a) => a.slug === slug) ?? null;
  });

  /**
   * FIX: Reactively reload data when lighting mode changes.
   * This effect watches the lightingMode signal and fetches fresh data
   * whenever the user switches between NIGHT/DAY/ALL.
   */
  constructor() {
    effect(() => {
      // Read the signal to subscribe to changes
      const mode = this.atmosphere.lightingMode();
      this.loadDataForMode(mode);
    });
  }

  selectAlbum(album: EventAlbumResponse): void {
    this.atmosphere.setActiveAlbum(album.slug, album.dominantHex);
    document.getElementById('photo-grid')?.scrollIntoView({ behavior: 'smooth' });
  }

  clearAlbumFilter(): void {
    this.atmosphere.setActiveAlbum(null);
    this.atmosphere.resetAmbientColors();
  }

  openLightbox(photo: PhotoResponse): void {
    this.lightboxPhoto.set(photo);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxPhoto.set(null);
    document.body.style.overflow = '';
  }

  /**
   * FIX: Load data for a specific mode.
   * Called by the effect whenever the mode changes.
   */
  private loadDataForMode(mode: string): void {
    const timeOfDay = mode === 'ALL' ? undefined : mode as 'DAY' | 'NIGHT';

    this.api.getCategories(timeOfDay).subscribe((cats) => this.categories.set(cats));
    this.api.getAlbums(timeOfDay).subscribe((albums) => this.albums.set(albums));
    this.api.getPhotos({ timeOfDay }).subscribe((photos) => this.photos.set(photos));
  }
}
