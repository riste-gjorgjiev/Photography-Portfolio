import {Component, input, output} from '@angular/core';
import {DatePipe, NgOptimizedImage} from '@angular/common';
import {EventAlbumResponse} from '../../core/models/portfolio.models';
import {UiIconComponent} from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-event-album-card',
  standalone: true,
  imports: [NgOptimizedImage, DatePipe, UiIconComponent],
  template: `
    <article
      class="group relative flex-shrink-0 w-72 sm:w-80 rounded-xl overflow-hidden cursor-pointer
             border transition-all duration-500 ease-out hover:scale-[1.03] hover:shadow-2xl"
      [style.border-color]="album().dominantHex + '66'"
      [style.box-shadow]="'0 0 20px ' + album().dominantHex + '22'"
      (click)="selected.emit(album())"
    >
      <!-- Cover Photo -->
      <div class="relative w-full h-48 overflow-hidden bg-white/5">
        @if (isDataUri(album().coverPhotoUrl)) {
          <img
            [src]="album().coverPhotoUrl!"
            [alt]="album().title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        } @else if (album().coverPhotoUrl) {
          <img
            [ngSrc]="album().coverPhotoUrl!"
            width="320"
            height="200"
            [alt]="album().title"
            class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            priority
          />
        } @else {
          <div class="w-full h-full flex items-center justify-center bg-white/5">
            <span class="text-white/30 font-mono text-xs">NO COVER</span>
          </div>
        }

        <!-- Category Badge -->
        <div
          class="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-white/90"
          [style.background]="album().dominantHex + 'CC'"
        >
          {{ album().categoryName }}
        </div>

        <!-- Featured Badge -->
        @if (album().featured) {
          <div class="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/80 text-white">
            <app-icon name="star" [size]="12" />
            Featured
          </div>
        }
      </div>

      <!-- Card Body -->
      <div class="p-4 bg-black/60 backdrop-blur-sm">
        <h3 class="text-sm font-semibold text-white/90 line-clamp-1 mb-1">
          {{ album().title }}
        </h3>

        <div class="flex items-center gap-2 text-[11px] font-mono text-white/50 mb-2">
          @if (album().venueName) {
            <span class="truncate">{{ album().venueName }}</span>
          }
          @if (album().location) {
            <span class="text-white/20">·</span>
            <span class="truncate">{{ album().location }}</span>
          }
        </div>

        @if (album().eventDate) {
          <div class="text-[10px] font-mono text-white/40">
            {{ album().eventDate | date:'mediumDate' }}
          </div>
        }
      </div>

      <!-- Bottom Glow Accent -->
      <div
        class="absolute bottom-0 left-0 right-0 h-[2px] transition-opacity duration-500 opacity-60 group-hover:opacity-100"
        [style.background]="'linear-gradient(90deg, transparent, ' + album().dominantHex + ', transparent)'"
      ></div>
    </article>
  `,
})
export class EventAlbumCardComponent {
  readonly album = input.required<EventAlbumResponse>();
  readonly selected = output<EventAlbumResponse>();

  isDataUri(url: string | null): boolean{
    return !!url && url.startsWith('data:');
  }
}
