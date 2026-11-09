import {Component, inject, input, output} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {AtmosphereService} from '../../../core/services/atmosphere.service';
import {PhotoResponse} from '../../../core/models/portfolio.models';

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
