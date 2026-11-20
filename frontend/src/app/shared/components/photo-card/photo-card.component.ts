import {Component, computed, inject, input, output} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {AtmosphereService} from '../../../core/services/atmosphere.service';
import {PhotoResponse} from '../../../core/models/portfolio.models';

/** Photos at 2:1 or wider are treated as panoramas. */
const PANORAMA_RATIO = 2;

@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './photo-card.component.html',
  styleUrl: './photo-card.component.css',
})
export class PhotoCardComponent {
  readonly atmosphere = inject(AtmosphereService);

  readonly photo = input.required<PhotoResponse>();
  readonly photoSelected = output<PhotoResponse>();

  readonly isPanorama = computed(() => {
    const {width, height} = this.photo();
    return height > 0 && width / height >= PANORAMA_RATIO;
  });

  readonly panoramaLabel = computed(() => {
    const {width, height} = this.photo();
    return height > 0 ? `Panorama · ${(width / height).toFixed(1)}:1` : 'Panorama';
  });

  /**
   * Panorama cards are cropped to 2:1 in the grid so they keep the masonry
   * rhythm instead of becoming full-width bands (or thin slivers). The lightbox
   * always shows the uncropped image.
   */
  readonly displayAspectRatio = computed(() => {
    const {width, height} = this.photo();
    if (height <= 0) return `${width || 1} / 1`;
    return width / height > PANORAMA_RATIO
      ? `${PANORAMA_RATIO} / 1`
      : `${width} / ${height}`;
  });

  readonly imageSizes =
    '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw';

  isHovered = false;

  get isDataUri(): boolean {
    return this.photo().imageUrl.startsWith('data:');
  }

  get showExifHud(): boolean {
    return this.isHovered || this.atmosphere.exifHudEnabled();
  }

  onEnter(): void {
    this.isHovered = true;
    this.atmosphere.setAmbientColors(
      this.photo().dominantHexPrimary,
      this.photo().dominantHexSecondary,
    );
  }

  onLeave(): void {
    this.isHovered = false;
    this.atmosphere.resetAmbientColors();
  }

  onClick(): void {
    this.photoSelected.emit(this.photo());
  }
}
