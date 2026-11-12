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
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=3200&q=85';
const LOCAL_HERO = '/hero/panorama-8k.webp';

const PAN_DAMPING = 0.04;
const PAN_MAX_SHIFT = 26;
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
    UiIconComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  readonly atmosphere = inject(AtmosphereService);
  private readonly api = inject(PortfolioApiService);
  private readonly router = inject(Router);

  readonly featuredAlbums = signal<EventAlbumResponse[]>([]);
  readonly featuredPhotos = signal<PhotoResponse[]>([]);
  readonly allPhotos = signal<PhotoResponse[]>([]);

  readonly currentPanX = signal<number>(0.5);
  readonly heroMode = signal<HeroMode>('pan');
  readonly heroImgLoaded = signal(false);
  readonly heroImgSrc = signal(FALLBACK_HERO);
  readonly heroContainerRef = viewChild<ElementRef<HTMLElement>>('heroContainer');

  private targetPanX = 0.5;
  private rafId: number | null = null;
  private readonly destroyRef = inject(DestroyRef);

  readonly lightboxPhoto = signal<PhotoResponse | null>(null);
  readonly lightboxIndex = computed(() => {
    const photo = this.lightboxPhoto();
    if (!photo) return -1;
    return this.featuredPhotos().findIndex((p) => p.id === photo.id);
  });

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
    { label: 'Canon 6D Mark II', tag: 'Body' },
    { label: 'EF 28-105mm F3.5-4.5', tag: 'Zoom' },
    { label: 'EF 50mm F1.8', tag: 'Prime' },
    { label: 'EF 70-300mm F4-5.6 IS USM', tag: 'Telephoto' },
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


  selectAlbum(album: EventAlbumResponse): void {
    this.atmosphere.setLightingMode(album.timeOfDay);
    this.atmosphere.setActiveCategory(album.categorySlug);
    this.atmosphere.setActiveAlbum(album.slug, album.dominantHex);
    this.router.navigate(['/explore']);
  }

  viewAllAlbums(): void {
    this.router.navigate(['/explore']);
  }


  openLightbox(photo: PhotoResponse): void {
    this.lightboxPhoto.set(photo);
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.lightboxPhoto.set(null);
    document.body.style.overflow = '';
  }

  toggleExifHud(): void {
    this.atmosphere.toggleExifHud();
  }


  goToExplore(): void {
    this.router.navigate(['/explore']);
  }

  goToBooking(): void {
    this.router.navigate(['/booking']);
  }


  private loadFeaturedData(): void {
    this.api.getAlbums().subscribe((albums) => {
      this.featuredAlbums.set(albums.filter((a) => a.featured));
    });

    this.api.getPhotos({ featuredOnly: true }).subscribe((photos) => {
      this.featuredPhotos.set(photos.slice(0, 6));
    });
  }
}
