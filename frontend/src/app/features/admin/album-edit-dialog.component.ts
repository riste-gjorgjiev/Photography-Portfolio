import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
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
   * Authoritative local ordering, stored as photo ids. Keeping only ids means a
   * parent update (e.g. a re-sorted `allPhotos`) refreshes the photo data
   * without ever overwriting the order the admin just set.
   */
  private readonly localOrderIds = signal<string[]>([]);

  readonly orderedPhotos = computed<PhotoResponse[]>(() => {
    const byId = new Map(this.albumPhotos().map((photo) => [photo.id, photo]));
    return this.localOrderIds()
      .map((id) => byId.get(id))
      .filter((photo): photo is PhotoResponse => photo !== undefined);
  });

  /** Id of the tile currently being dragged, used to dim the rest of the grid. */
  readonly draggingId = signal<string | null>(null);

  readonly ordering = signal(false);
  readonly orderError = signal<string | null>(null);
  readonly orderSaved = signal<string | null>(null);

  constructor() {
    // Reconcile the local order with the incoming photos only when the *set*
    // changes (photo added/removed). An unchanged set keeps the local order, so
    // a save or an unrelated parent refresh can never make tiles jump back.
    effect(() => {
      const incomingIds = this.albumPhotos().map((photo) => photo.id);
      const current = this.localOrderIds();
      const sameSet =
        current.length === incomingIds.length &&
        incomingIds.every((id) => current.includes(id));
      if (sameSet) return;

      const kept = current.filter((id) => incomingIds.includes(id));
      const added = incomingIds.filter((id) => !kept.includes(id));
      this.localOrderIds.set([...kept, ...added]);
    });
  }

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
    this.localOrderIds.set(this.albumPhotos().map((photo) => photo.id));
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

  onDragStarted(id: string): void {
    this.draggingId.set(id);
  }

  onDragEnded(): void {
    this.draggingId.set(null);
  }

  onDrop(event: CdkDragDrop<PhotoResponse[]>): void {
    this.draggingId.set(null);
    if (this.ordering() || event.previousIndex === event.currentIndex) return;

    const previousIds = this.localOrderIds();
    const nextIds = [...previousIds];
    moveItemInArray(nextIds, event.previousIndex, event.currentIndex);
    this.localOrderIds.set(nextIds);
    this.persistOrder(previousIds);
  }

  private persistOrder(previousIds: string[]): void {
    const albumId = this.album().id;
    const currentIds = this.localOrderIds();

    this.ordering.set(true);
    this.orderError.set(null);
    this.orderSaved.set(null);

    this.api.reorderAlbumPhotos(albumId, currentIds).subscribe({
      next: (photos) => {
        this.ordering.set(false);
        this.orderSaved.set('Order saved.');
        // Trust the server's canonical result (sorted by displayOrder).
        this.localOrderIds.set(photos.map((photo) => photo.id));
        this.orderChanged.emit(photos);
      },
      error: (err) => {
        this.ordering.set(false);
        this.localOrderIds.set(previousIds);
        console.error('Album photo reorder error:', err);
        this.orderError.set(problemDetail(err, 'Failed to save the new photo order.'));
      },
    });
  }

  retryOrder(): void {
    if (this.ordering()) return;
    this.persistOrder(this.localOrderIds());
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
