import {
  Component,
  computed,
  effect,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { PhotoResponse } from '../../../core/models/portfolio.models';
import { AtmosphereService } from '../../../core/services/atmosphere.service';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

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

  readonly sidebarOpen = signal(true);

  readonly copiedHex = signal<string | null>(null);

  readonly hasPrev = computed(() => this.currentIndex() > 0);

  readonly hasNext = computed(() => this.currentIndex() < this.allPhotos().length - 1);

  readonly photoJson = computed(() => JSON.stringify(this.photo(), null, 2));

  readonly aspectRatioPercent = computed(() => {
    const p = this.photo();
    return ((p.width / p.height) * 100).toFixed(1);
  });

  constructor() {
    effect(() => {
      const p = this.photo();
      this.atmosphere.setAmbientColors(p.dominantHexPrimary, p.dominantHexSecondary);
    });
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
