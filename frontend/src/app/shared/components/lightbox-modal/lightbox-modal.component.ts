import {
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PhotoResponse } from '../../../core/models/portfolio.models';
import { AtmosphereService } from '../../../core/services/atmosphere.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

@Component({
  selector: 'app-lightbox-modal',
  standalone: true,
  imports: [NgOptimizedImage, DatePipe, UiIconComponent],
  templateUrl: './lightbox-modal.component.html',
  styleUrl: './lightbox-modal.component.css',
})
export class LightboxModalComponent {
  private readonly atmosphere = inject(AtmosphereService);
  private readonly router = inject(Router);

  readonly photo = input.required<PhotoResponse>();
  readonly allPhotos = input.required<PhotoResponse[]>();
  readonly currentIndex = input.required<number>();

  readonly closed = output<void>();
  readonly navigate = output<PhotoResponse>();

  readonly activeTab = signal<'telemetry' | 'inspector'>('telemetry');

  private readonly isDesktop = signal(this.prefersDesktop());

  readonly sidebarOpen = signal(this.prefersDesktop());

  readonly copiedHex = signal<string | null>(null);

  readonly hasPrev = computed(() => this.currentIndex() > 0);

  readonly hasNext = computed(() => this.currentIndex() < this.allPhotos().length - 1);

  readonly photoJson = computed(() => JSON.stringify(this.photo(), null, 2));

  readonly aspectRatioPercent = computed(() => {
    const p = this.photo();
    return ((p.width / p.height) * 100).toFixed(1);
  });

  // ── Zoom / pan ────────────────────────────────────────────────────────────
  readonly stageRef = viewChild<ElementRef<HTMLElement>>('stage');

  readonly maxZoom = MAX_ZOOM;
  readonly zoom = signal(MIN_ZOOM);
  readonly pan = signal({x: 0, y: 0});
  readonly dragging = signal(false);

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  readonly imageTransform = computed(
    () => `translate(${this.pan().x}px, ${this.pan().y}px) scale(${this.zoom()})`,
  );

  private panOrigin = {x: 0, y: 0, panX: 0, panY: 0};

  constructor() {
    effect(() => {
      const p = this.photo();
      this.atmosphere.setAmbientColors(p.dominantHexPrimary, p.dominantHexSecondary);
      // A new photo always starts fitted to the stage.
      this.resetZoom();
    });
  }


  @HostListener('window:resize')
  handleResize(): void {
    const desktop = this.prefersDesktop();
    if (desktop === this.isDesktop()) return;
    this.isDesktop.set(desktop);
    this.sidebarOpen.set(desktop);
  }

  private prefersDesktop(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 640px)').matches;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        this.goToPrev();
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.goToNext();
        event.preventDefault();
        break;
      case 'Escape':
        this.onClose();
        event.preventDefault();
        break;
      case '+':
      case '=':
        this.zoomIn();
        event.preventDefault();
        break;
      case '-':
      case '_':
        this.zoomOut();
        event.preventDefault();
        break;
      case '0':
        this.resetZoom();
        event.preventDefault();
        break;
    }
  }

  goToPrev(): void {
    if (!this.hasPrev()) return;
    const prev = this.allPhotos()[this.currentIndex() - 1];
    this.navigate.emit(prev);
  }

  goToNext(): void {
    if (!this.hasNext()) return;
    const next = this.allPhotos()[this.currentIndex() + 1];
    this.navigate.emit(next);
  }

  onClose(): void {
    this.closed.emit();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  zoomIn(): void {
    this.setZoom(this.zoom() + 0.5);
  }

  zoomOut(): void {
    this.setZoom(this.zoom() - 0.5);
  }

  toggleZoom(): void {
    this.setZoom(this.zoom() > MIN_ZOOM ? MIN_ZOOM : 2);
  }

  resetZoom(): void {
    this.zoom.set(MIN_ZOOM);
    this.pan.set({x: 0, y: 0});
    this.dragging.set(false);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.setZoom(this.zoom() * Math.exp(-event.deltaY * 0.002));
  }

  onPanStart(event: PointerEvent): void {
    if (this.zoom() <= MIN_ZOOM) return;
    if ((event.target as HTMLElement).tagName !== 'IMG') return;
    event.preventDefault();
    this.dragging.set(true);
    this.panOrigin = {
      x: event.clientX,
      y: event.clientY,
      panX: this.pan().x,
      panY: this.pan().y,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPanMove(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.clampPan(
      this.panOrigin.panX + event.clientX - this.panOrigin.x,
      this.panOrigin.panY + event.clientY - this.panOrigin.y,
    );
  }

  onPanEnd(event: PointerEvent): void {
    if (!this.dragging()) return;
    this.dragging.set(false);
    const el = event.currentTarget as HTMLElement;
    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
  }

  private setZoom(value: number): void {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));
    this.zoom.set(next);
    if (next <= MIN_ZOOM) {
      this.pan.set({x: 0, y: 0});
    } else {
      this.clampPan(this.pan().x, this.pan().y);
    }
  }

  private clampPan(x: number, y: number): void {
    const stage = this.stageRef()?.nativeElement;
    const zoom = this.zoom();
    if (!stage || zoom <= MIN_ZOOM) {
      this.pan.set({x: 0, y: 0});
      return;
    }
    const rect = stage.getBoundingClientRect();
    const maxX = (rect.width * (zoom - 1)) / 2;
    const maxY = (rect.height * (zoom - 1)) / 2;
    this.pan.set({
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    });
  }


  copyHex(hex: string): void {
    navigator.clipboard.writeText(hex).then(() => {
      this.copiedHex.set(hex);
      setTimeout(() => this.copiedHex.set(null), 1500);
    });
  }

  bookSimilarShoot(): void {
    // Navigate to booking page with pre-filled category/event type
    const photo = this.photo();
    this.onClose();
    this.router.navigate(['/booking'], {
      queryParams: {
        eventType: photo.categorySlug,
        eventName: photo.eventAlbumTitle || photo.categoryName,
      },
    });
  }
}
