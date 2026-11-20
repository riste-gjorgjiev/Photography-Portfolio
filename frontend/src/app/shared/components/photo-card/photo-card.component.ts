import {Component, computed, inject, input, output} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {AtmosphereService} from '../../../core/services/atmosphere.service';
import {PhotoResponse} from '../../../core/models/portfolio.models';

/** 21:9 and wider is treated as ultrawide / panorama. */
const ULTRAWIDE_RATIO = 2.4;

@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './photo-card.component.html',
  styleUrl: './photo-card.component.css',
  host: {
    '[class.photo-card--ultrawide]': 'isUltrawide()',
  },
})
export class PhotoCardComponent {
  readonly atmosphere = inject(AtmosphereService);

  readonly photo = input.required<PhotoResponse>();
  readonly photoSelected = output<PhotoResponse>();

  readonly isUltrawide = computed(() => {
    const {width, height} = this.photo();
    return height > 0 && width / height >= ULTRAWIDE_RATIO;
  });

  /** Column width in the masonry, or the full viewport for a spanning card. */
  readonly imageSizes = computed(() =>
    this.isUltrawide()
      ? '100vw'
      : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  );

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
