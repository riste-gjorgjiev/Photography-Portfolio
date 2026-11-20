import { Component, OnInit, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';
import {
  CategoryResponse,
  EventAlbumResponse,
  PhotoResponse,
  UpdateEventAlbumRequest,
} from '../../core/models/portfolio.models';
import { problemDetail } from '../../core/utils/problem-detail';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

const MAX_COVER_SIZE_BYTES = 25 * 1024 * 1024;

@Component({
  selector: 'app-album-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, DragDropModule, ModalComponent, UiIconComponent],
  templateUrl: './album-edit-dialog.component.html',
})
export class AlbumEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortfolioApiService);

  readonly album = input.required<EventAlbumResponse>();
  readonly categories = input.required<CategoryResponse[]>();
  readonly photos = input.required<PhotoResponse[]>();

  readonly saved = output<EventAlbumResponse>();
  readonly coverChanged = output<EventAlbumResponse>();
  readonly orderChanged = output<PhotoResponse[]>();
  readonly cancelled = output<void>();

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  readonly coverUrl = signal<string | null>(null);
  readonly coverPublicId = signal<string | null>(null);
  readonly uploadingCover = signal(false);
  readonly coverError = signal<string | null>(null);

  readonly albumPhotos = computed(() =>
    this.photos().filter((photo) => photo.eventAlbumId === this.album().id),
  );

  /**
   * Working copy of the album's photos that the drag-and-drop rearranges. It is
   * seeded from {@link albumPhotos} and re-synced whenever the incoming photos
   * change (e.g. a new upload adds a photo), without clobbering a pending drag.
   */
  readonly orderedPhotos = linkedSignal(() => this.albumPhotos());

  readonly ordering = signal(false);
  readonly orderError = signal<string | null>(null);
  readonly orderSaved = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    categoryId: ['', Validators.required],
    venueName: [''],
    location: [''],
    eventDate: [''],
    description: [''],
    dominantHex: ['#6366F1', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    featured: [false],
  });

  ngOnInit(): void {
    const album = this.album();
    this.form.patchValue(
      {
        title: album.title,
        slug: album.slug,
        categoryId: album.categoryId,
        venueName: album.venueName ?? '',
        location: album.location ?? '',
        eventDate: album.eventDate ?? '',
        description: album.description ?? '',
        dominantHex: album.dominantHex,
        featured: album.featured,
      },
      { emitEvent: false },
    );
    this.coverUrl.set(album.coverPhotoUrl);
    this.coverPublicId.set(album.coverPhotoPublicId);
  }

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.coverError.set('Only image files can be used as a cover.');
      return;
    }
    if (file.size > MAX_COVER_SIZE_BYTES) {
      this.coverError.set(
        `Cover image is too large (${(file.size / 1048576).toFixed(1)} MB). Maximum is 25 MB.`,
      );
      return;
    }

    this.uploadingCover.set(true);
    this.coverError.set(null);
    this.success.set(null);

    this.api.uploadAlbumCover(this.album().id, file).subscribe({
      next: (album) => {
        this.uploadingCover.set(false);
        this.coverUrl.set(album.coverPhotoUrl);
        this.coverPublicId.set(album.coverPhotoPublicId);
        this.form.controls.dominantHex.setValue(album.dominantHex);
        this.success.set('Cover image uploaded. Dominant color extracted from the new cover.');
        this.coverChanged.emit(album);
      },
      error: (err) => {
        this.uploadingCover.set(false);
        console.error('Album cover upload error:', err);
        this.coverError.set(problemDetail(err, 'Failed to upload the cover image.'));
      },
    });
  }

  onDrop(event: CdkDragDrop<PhotoResponse[]>): void {
    if (this.ordering()) return;
    if (event.previousIndex === event.currentIndex) return;

    this.orderedPhotos.update((photos) => {
      const reordered = [...photos];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      return reordered;
    });
    this.persistOrder();
  }

  private persistOrder(): void {
    const albumId = this.album().id;
    const previous = this.albumPhotos();
    const current = this.orderedPhotos();

    this.ordering.set(true);
    this.orderError.set(null);
    this.orderSaved.set(null);

    this.api
      .reorderAlbumPhotos(
        albumId,
        current.map((photo) => photo.id),
      )
      .subscribe({
        next: (photos) => {
          this.ordering.set(false);
          this.orderSaved.set('Order saved.');
          this.orderChanged.emit(photos);
        },
        error: (err) => {
          this.ordering.set(false);
          this.orderedPhotos.set(previous);
          console.error('Album photo reorder error:', err);
          this.orderError.set(problemDetail(err, 'Failed to save the new photo order.'));
        },
      });
  }

  usePhotoAsCover(photo: PhotoResponse): void {
    this.coverUrl.set(photo.imageUrl);
    this.coverPublicId.set(photo.cloudinaryPublicId);
    this.form.controls.dominantHex.setValue(photo.dominantHexPrimary);
    this.coverError.set(null);
    this.success.set('Existing photo selected as cover. Save changes to apply.');
  }

  removeCover(): void {
    this.coverUrl.set(null);
    this.coverPublicId.set(null);
    this.success.set('Cover will be removed when you save.');
  }

  save(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const request: UpdateEventAlbumRequest = {
      title: raw.title!.trim(),
      slug: raw.slug!.trim(),
      categoryId: raw.categoryId!,
      venueName: raw.venueName?.trim() || null,
      location: raw.location?.trim() || null,
      eventDate: raw.eventDate || null,
      description: raw.description?.trim() || null,
      coverPhotoUrl: this.coverUrl(),
      coverPhotoPublicId: this.coverPublicId(),
      dominantHex: raw.dominantHex || '#6366F1',
      featured: raw.featured ?? false,
    };

    this.api.updateAlbum(this.album().id, request).subscribe({
      next: (album) => {
        this.submitting.set(false);
        this.saved.emit(album);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Album update error:', err);
        this.error.set(problemDetail(err, 'Failed to update album.'));
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
