import {
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AtmosphereService } from '../../core/services/atmosphere.service';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';
import {
  EventAlbumResponse,
  PhotoResponse,
} from '../../core/models/portfolio.models';
import { PhotoCardComponent } from '../../shared/components/photo-card/photo-card.component';
import { LightboxModalComponent } from '../../shared/components/lightbox-modal/lightbox-modal.component';
import { EventAlbumCardComponent } from '../gallery/event-album-card.component';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=3200&q=85';
const LOCAL_HERO = '/hero/panorama-8k.webp';

/** Lerp damping factor per frame — lower = heavier, more cinematic camera head. */
const PAN_DAMPING = 0.04;
/** Max translate shift as a percentage of the container width (image is 135% wide). */
const PAN_MAX_SHIFT = 26;
/** Stop animating once the camera has effectively settled. */
const PAN_EPSILON = 0.0001;

type HeroMode = 'pan' | 'letterbox';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DecimalPipe,
    PhotoCardComponent,
    LightboxModalComponent,
    EventAlbumCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  readonly atmosphere = inject(AtmosphereService);
  private readonly api = inject(PortfolioApiService);
  private readonly router = inject(Router);

  // ─── Data Signals ──────────────────────────────────────────────
  readonly featuredAlbums = signal<EventAlbumResponse[]>([]);
  readonly featuredPhotos = signal<PhotoResponse[]>([]);
  readonly allPhotos = signal<PhotoResponse[]>([]);

  // ─── Hero Panorama State ───────────────────────────────────────
  /** Smoothed cursor position (0–1) actually rendered on screen. */
  readonly currentPanX = signal<number>(0.5);
  readonly heroMode = signal<HeroMode>('pan');
  readonly heroImgLoaded = signal(false);
  readonly heroImgSrc = signal(FALLBACK_HERO);
  readonly heroContainerRef = viewChild<ElementRef<HTMLElement>>('heroContainer');

  /** Raw cursor target (0–1). The RAF loop lerps towards this. */
  private targetPanX = 0.5;
  private rafId: number | null = null;
  private readonly destroyRef = inject(DestroyRef);

  // ─── Lightbox State ────────────────────────────────────────────
  readonly lightboxPhoto = signal<PhotoResponse | null>(null);
  readonly lightboxIndex = computed(() => {
    const photo = this.lightboxPhoto();
    if (!photo) return -1;
    return this.featuredPhotos().findIndex((p) => p.id === photo.id);
  });

  // ─── Derived ───────────────────────────────────────────────────
  /** Heavy, GPU-accelerated camera pan driven by the smoothed signal. */
  readonly panoTransform = computed(() => {
    const shift = (-this.currentPanX() * PAN_MAX_SHIFT).toFixed(3);
    return `translate3d(${shift}%, 0, 0)`;
  });

  readonly panPercent = computed(() => this.currentPanX() * 100);
  readonly heroMinimapPosition = computed(() => `${this.panPercent()}%`);

  readonly heroSectionClasses = computed(() => {
    const base = 'relative overflow-hidden rounded-3xl border border-white/10 mx-4 sm:mx-6 lg:mx-auto lg:mt-6 max-w-[1920px]';
    if (this.heroMode() === 'pan') {
      return `${base} h-[68vh] min-h-[460px]`;
    }
    return `${base} aspect-[4/1] h-auto`;
  });

  readonly gearList = [
    { label: 'Sony A7 IV', tag: 'Body' },
    { label: 'FE 24-70mm F2.8 GM II', tag: 'Zoom' },
    { label: 'FE 35mm F1.4 GM', tag: 'Prime' },
    { label: 'FE 200-600mm G OSS', tag: 'Telephoto' },
    { label: 'FE 14mm F1.8 GM', tag: 'Ultra-Wide' },
  ];

  readonly stackList = [
    { label: 'Java 21', tag: 'Runtime' },
    { label: 'Spring Boot 3.4.2', tag: 'Framework' },
    { label: 'Server-Side EXIF & HSB Color Extraction', tag: 'Pipeline' },
    { label: 'Angular 19 Signals', tag: 'Frontend' },
    { label: 'PostgreSQL 16', tag: 'Database' },
  ];

  constructor() {
    const tick = () => {
      const current = this.currentPanX();
      const diff = this.targetPanX - current;

      // Only write the signal while the camera is still travelling.
      // This keeps idle frames free of change-detection work.
      if (Math.abs(diff) > PAN_EPSILON) {
        this.currentPanX.set(current + diff * PAN_DAMPING);
      }

      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
    this.destroyRef.onDestroy(() => {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
      }
    });
  }

  ngOnInit(): void {
    // Try local panorama first; fall back to Unsplash on error
    const probe = new Image();
    probe.onload = () => {
      this.heroImgSrc.set(LOCAL_HERO);
      this.heroImgLoaded.set(true);
    };
    probe.onerror = () => {
      this.heroImgSrc.set(FALLBACK_HERO);
      this.heroImgLoaded.set(true);
    };
    probe.src = LOCAL_HERO;

    this.loadFeaturedData();
  }

  // ─── Hero Interactions ─────────────────────────────────────────

  onHeroMouseMove(event: MouseEvent): void {
    if (this.heroMode() !== 'pan') return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, relX / rect.width));
    this.targetPanX = pct;
  }

  toggleHeroMode(): void {
    this.heroMode.update((m) => (m === 'pan' ? 'letterbox' : 'pan'));
    if (this.heroMode() === 'letterbox') {
      // Ease the camera back to a composed centre without snapping.
      this.targetPanX = 0.5;
    }
  }

  // ─── Section 2: Duality Portals ───────────────────────────────

  onNightHover(): void {
    this.atmosphere.setAmbientColors('#FF007F', '#7928CA');
  }

  onDayHover(): void {
    this.atmosphere.setAmbientColors('#2D5A27', '#D4A373');
  }

  onPortalLeave(): void {
    this.atmosphere.resetAmbientColors();
  }

  selectNightPortal(): void {
    this.atmosphere.setLightingMode('NIGHT');
    this.router.navigate(['/explore']);
  }

  selectDayPortal(): void {
    this.atmosphere.setLightingMode('DAY');
    this.router.navigate(['/explore']);
  }

  // ─── Section 3: Album Strip ────────────────────────────────────

  selectAlbum(album: EventAlbumResponse): void {
    this.atmosphere.setLightingMode(album.timeOfDay);
    this.atmosphere.setActiveCategory(album.categorySlug);
    this.atmosphere.setActiveAlbum(album.slug, album.dominantHex);
    this.router.navigate(['/explore']);
  }

  viewAllAlbums(): void {
    this.router.navigate(['/explore']);
  }

  // ─── Section 4: Featured Photos / Lightbox ─────────────────────

  openLightbox(photo: PhotoResponse): void {
    this.lightboxPhoto.set(photo);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxPhoto.set(null);
    document.body.style.overflow = '';
  }

  // ─── Section 5: Bento ──────────────────────────────────────────

  toggleExifHud(): void {
    this.atmosphere.toggleExifHud();
  }

  // ─── Navigation helpers ────────────────────────────────────────

  goToExplore(): void {
    this.router.navigate(['/explore']);
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }

  // ─── Data Loading ──────────────────────────────────────────────

  private loadFeaturedData(): void {
    this.api.getAlbums().subscribe((albums) => {
      this.featuredAlbums.set(albums.filter((a) => a.featured));
    });

    this.api.getPhotos({ featuredOnly: true }).subscribe((photos) => {
      this.featuredPhotos.set(photos.slice(0, 6));
    });
  }
}
