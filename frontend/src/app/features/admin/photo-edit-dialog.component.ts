import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';
import {
  CategoryResponse,
  EventAlbumResponse,
  PhotoResponse,
  TimeOfDay,
  UpdatePhotoRequest,
} from '../../core/models/portfolio.models';
import { problemDetail } from '../../core/utils/problem-detail';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-photo-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, UiIconComponent],
  templateUrl: './photo-edit-dialog.component.html',
})
export class PhotoEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortfolioApiService);

  readonly photo = input.required<PhotoResponse>();
  readonly categories = input.required<CategoryResponse[]>();
  readonly albums = input.required<EventAlbumResponse[]>();

  readonly saved = output<PhotoResponse>();
  readonly cancelled = output<void>();

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    title: ['', [Validators.maxLength(100)]],
    caption: [''],
    categoryId: ['', Validators.required],
    eventAlbumId: [null as string | null],
    timeOfDay: ['NIGHT' as TimeOfDay, Validators.required],
    featured: [false],
    displayOrder: [0],
  });

  ngOnInit(): void {
    const photo = this.photo();
    this.form.patchValue(
      {
        title: photo.title ?? '',
        caption: photo.caption ?? '',
        categoryId: photo.categoryId,
        eventAlbumId: photo.eventAlbumId,
        timeOfDay: photo.timeOfDay,
        featured: photo.featured,
        displayOrder: photo.displayOrder,
      },
      { emitEvent: false },
    );
  }

  save(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const request: UpdatePhotoRequest = {
      title: raw.title?.trim() || null,
      caption: raw.caption?.trim() || null,
      categoryId: raw.categoryId!,
      eventAlbumId: raw.eventAlbumId || null,
      timeOfDay: raw.timeOfDay as TimeOfDay,
      featured: raw.featured ?? false,
      displayOrder: raw.displayOrder ?? 0,
    };

    this.api.updatePhoto(this.photo().id, request).subscribe({
      next: (photo) => {
        this.submitting.set(false);
        this.saved.emit(photo);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Photo update error:', err);
        this.error.set(problemDetail(err, 'Failed to update photo.'));
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
