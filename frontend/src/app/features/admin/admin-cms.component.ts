import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';
import { AtmosphereService } from '../../core/services/atmosphere.service';
import { AuthService } from '../../core/services/auth.service';
import {
  BookingInquiryResponse,
  BookingStatus,
  CategoryResponse,
  CreateCategoryRequest,
  CreateEventAlbumRequest,
  EventAlbumResponse,
  PhotoResponse,
  PhotoUploadRequest,
  TimeOfDay,
} from '../../core/models/portfolio.models';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

type AdminTab = 'photos' | 'albums' | 'categories' | 'bookings';

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, UiIconComponent],
  templateUrl: './admin-cms.component.html',
  styleUrl: './admin-cms.component.css',
})
export class AdminCmsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortfolioApiService);
  private readonly atmosphere = inject(AtmosphereService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly activeTab = signal<AdminTab>('photos');

  readonly categories = signal<CategoryResponse[]>([]);
  readonly albums = signal<EventAlbumResponse[]>([]);
  readonly allPhotos = signal<PhotoResponse[]>([]);
  readonly bookings = signal<BookingInquiryResponse[]>([]);

  readonly selectedFile = signal<File | null>(null);
  readonly localPreviewUrl = signal<string | null>(null);
  readonly uploading = signal(false);
  readonly lastUploadedPhoto = signal<PhotoResponse | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly deleteConfirmId = signal<string | null>(null);

  readonly albumSubmitting = signal(false);
  readonly albumError = signal<string | null>(null);
  readonly albumSuccess = signal<string | null>(null);
  readonly deleteConfirmAlbumId = signal<string | null>(null);

  readonly categorySubmitting = signal(false);
  readonly categoryError = signal<string | null>(null);
  readonly categorySuccess = signal<string | null>(null);
  readonly deleteConfirmCategoryId = signal<string | null>(null);

  readonly bookingFilter = signal<BookingStatus | 'ALL'>('ALL');

  readonly statusFilters: readonly (BookingStatus | 'ALL')[] = [
    'ALL',
    'NEW',
    'CONTACTED',
    'BOOKED',
    'ARCHIVED',
  ];

  readonly photoForm = this.fb.group({
    title: [''],
    caption: [''],
    timeOfDayOverride: ['NIGHT' as TimeOfDay],
    categoryId: ['', Validators.required],
    eventAlbumId: [null as string | null],
    featured: [false],
    displayOrder: [0],
  });

  readonly albumForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    categoryId: ['', Validators.required],
    venueName: [''],
    location: [''],
    eventDate: [''],
    description: [''],
    coverPhotoUrl: [''],
    dominantHex: ['#6366F1', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    featured: [false],
  });

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.maxLength(100), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: [''],
    timeOfDay: ['NIGHT' as TimeOfDay, Validators.required],
    defaultAmbientHex: ['#6366F1', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    displayOrder: [0],
  });


  readonly filteredBookings = computed(() => {
    const filter = this.bookingFilter();
    if (filter === 'ALL') return this.bookings();
    return this.bookings().filter((b) => b.status === filter);
  });

  readonly bookingCounts = computed<Record<BookingStatus | 'ALL', number>>(() => {
    const all = this.bookings();
    return {
      ALL: all.length,
      NEW: all.filter((b) => b.status === 'NEW').length,
      CONTACTED: all.filter((b) => b.status === 'CONTACTED').length,
      BOOKED: all.filter((b) => b.status === 'BOOKED').length,
      ARCHIVED: all.filter((b) => b.status === 'ARCHIVED').length,
    };
  });

  readonly fileSizeMB = computed(() => {
    const file = this.selectedFile();
    if (!file) return null;
    return (file.size / (1024 * 1024)).toFixed(2);
  });

  readonly nightCategories = computed(() =>
    this.categories().filter((c) => c.timeOfDay === 'NIGHT'),
  );

  readonly dayCategories = computed(() =>
    this.categories().filter((c) => c.timeOfDay === 'DAY'),
  );


  ngOnInit(): void {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.loadCategories();
    this.loadAlbums();
    this.loadPhotos();
    this.loadBookings();

    // Auto-slugify album title
    this.albumForm.controls.title.valueChanges.subscribe((title) => {
      if (title && !this.albumForm.controls.slug.dirty) {
        this.albumForm.controls.slug.setValue(this.slugify(title));
      }
    });

    // Auto-slugify category name
    this.categoryForm.controls.name.valueChanges.subscribe((name) => {
      if (name && !this.categoryForm.controls.slug.dirty) {
        this.categoryForm.controls.slug.setValue(this.slugify(name));
      }
    });
  }


  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectFile(files[0]);
    }
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectFile(input.files[0]);
    }
  }

  private selectFile(file: File): void {
    if (!file.type.startsWith('image/')) return;
    this.selectedFile.set(file);
    this.lastUploadedPhoto.set(null);
    this.uploadError.set(null);

    const reader = new FileReader();
    reader.onload = () => this.localPreviewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearSelectedFile(): void {
    this.selectedFile.set(null);
    this.localPreviewUrl.set(null);
  }

  uploadPhoto(): void {
    const file = this.selectedFile();
    if (!file || this.photoForm.invalid || this.uploading()) return;

    this.uploading.set(true);
    this.uploadError.set(null);
    this.lastUploadedPhoto.set(null);

    const raw = this.photoForm.getRawValue();
    const metadata: PhotoUploadRequest = {
      title: raw.title?.trim() || null,
      caption: raw.caption?.trim() || null,
      categoryId: raw.categoryId!,
      eventAlbumId: raw.eventAlbumId || null,
      timeOfDayOverride: raw.timeOfDayOverride as TimeOfDay,
      featured: raw.featured ?? false,
      displayOrder: raw.displayOrder ?? 0,
    };

    this.api.uploadPhoto(file, metadata).subscribe({
      next: (response) => {
        this.uploading.set(false);
        this.lastUploadedPhoto.set(response);
        this.allPhotos.update((photos) => [response, ...photos]);
        this.clearSelectedFile();
        this.photoForm.reset({ timeOfDayOverride: 'NIGHT', featured: false, displayOrder: 0 });
      },
      error: (err) => {
        this.uploading.set(false);
        console.error('Photo upload error:', err);
        if (err.status === 401 || err.status === 403) {
          this.uploadError.set('Authentication failed. Please check your credentials in the top bar.');
        } else {
          const problem = err.error;
          this.uploadError.set(
            problem?.detail || problem?.title || 'Upload failed. Check the browser console for details.',
          );
        }
      },
    });
  }

  confirmDeletePhoto(id: string): void {
    this.deleteConfirmId.set(id);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  executeDeletePhoto(): void {
    const id = this.deleteConfirmId();
    if (!id) return;

    this.api.deletePhoto(id).subscribe({
      next: () => {
        this.allPhotos.update((photos) => photos.filter((p) => p.id !== id));
        this.deleteConfirmId.set(null);
      },
      error: (err) => {
        console.error('Photo delete error:', err);
        this.deleteConfirmId.set(null);
      },
    });
  }

  previewPhotoAmbient(photo: PhotoResponse): void {
    this.atmosphere.setAmbientColors(photo.dominantHexPrimary, photo.dominantHexSecondary);
  }


  createAlbum(): void {
    if (this.albumForm.invalid || this.albumSubmitting()) return;

    this.albumSubmitting.set(true);
    this.albumError.set(null);
    this.albumSuccess.set(null);

    const raw = this.albumForm.getRawValue();
    const request: CreateEventAlbumRequest = {
      title: raw.title!.trim(),
      slug: raw.slug!.trim(),
      categoryId: raw.categoryId!,
      venueName: raw.venueName?.trim() || null,
      location: raw.location?.trim() || null,
      eventDate: raw.eventDate || null,
      description: raw.description?.trim() || null,
      coverPhotoUrl: raw.coverPhotoUrl?.trim() || null,
      dominantHex: raw.dominantHex || '#6366F1',
      featured: raw.featured ?? false,
    };

    this.api.createAlbum(request).subscribe({
      next: (album) => {
        this.albumSubmitting.set(false);
        this.albums.update((existing) => [album, ...existing]);
        this.albumSuccess.set(`Album "${album.title}" created!`);
        this.albumForm.reset({ dominantHex: '#6366F1', featured: false });
      },
      error: (err) => {
        this.albumSubmitting.set(false);
        console.error('Album creation error:', err);
        if (err.status === 401 || err.status === 403) {
          this.albumError.set('Authentication failed. Please check your credentials in the top bar.');
        } else {
          const problem = err.error;
          this.albumError.set(
            problem?.detail || problem?.title || 'Failed to create album. Check the browser console for details.',
          );
        }
      },
    });
  }

  confirmDeleteAlbum(id: string): void {
    this.deleteConfirmAlbumId.set(id);
  }

  cancelDeleteAlbum(): void {
    this.deleteConfirmAlbumId.set(null);
  }

  executeDeleteAlbum(): void {
    const id = this.deleteConfirmAlbumId();
    if (!id) return;

    this.albumError.set(null);
    this.api.deleteAlbum(id).subscribe({
      next: () => {
        this.albums.update((albums) => albums.filter((a) => a.id !== id));
        this.allPhotos.update((photos) =>
          photos.map((p) =>
            p.eventAlbumId === id ? { ...p, eventAlbumId: null, eventAlbumTitle: null } : p,
          ),
        );
        this.deleteConfirmAlbumId.set(null);
      },
      error: (err) => {
        console.error('Album delete error:', err);
        this.albumError.set(this.problemDetail(err, 'Failed to delete album.'));
        this.deleteConfirmAlbumId.set(null);
      },
    });
  }

  createCategory(): void {
    if (this.categoryForm.invalid || this.categorySubmitting()) return;

    this.categorySubmitting.set(true);
    this.categoryError.set(null);
    this.categorySuccess.set(null);

    const raw = this.categoryForm.getRawValue();
    const request: CreateCategoryRequest = {
      name: raw.name!.trim(),
      slug: raw.slug!.trim(),
      description: raw.description?.trim() || null,
      timeOfDay: raw.timeOfDay as TimeOfDay,
      defaultAmbientHex: raw.defaultAmbientHex || '#1E293B',
      displayOrder: raw.displayOrder ?? 0,
    };

    this.api.createCategory(request).subscribe({
      next: (category) => {
        this.categorySubmitting.set(false);
        this.categories.update((existing) =>
          [...existing, category].sort(
            (a, b) =>
              a.timeOfDay.localeCompare(b.timeOfDay) || a.displayOrder - b.displayOrder,
          ),
        );
        this.categorySuccess.set(`Category "${category.name}" created!`);
        this.categoryForm.reset({
          timeOfDay: 'NIGHT',
          defaultAmbientHex: '#6366F1',
          displayOrder: 0,
        });
      },
      error: (err) => {
        this.categorySubmitting.set(false);
        console.error('Category creation error:', err);
        this.categoryError.set(this.problemDetail(err, 'Failed to create category.'));
      },
    });
  }

  confirmDeleteCategory(id: string): void {
    this.deleteConfirmCategoryId.set(id);
  }

  cancelDeleteCategory(): void {
    this.deleteConfirmCategoryId.set(null);
  }

  executeDeleteCategory(): void {
    const id = this.deleteConfirmCategoryId();
    if (!id) return;

    this.categoryError.set(null);
    this.api.deleteCategory(id).subscribe({
      next: () => {
        this.categories.update((categories) => categories.filter((c) => c.id !== id));
        this.deleteConfirmCategoryId.set(null);
      },
      error: (err) => {
        console.error('Category delete error:', err);
        this.categoryError.set(this.problemDetail(err, 'Failed to delete category.'));
        this.deleteConfirmCategoryId.set(null);
      },
    });
  }

  setBookingFilter(status: BookingStatus | 'ALL'): void {
    this.bookingFilter.set(status);
  }

  updateBookingStatus(id: string, status: BookingStatus): void {
    this.api.updateBookingStatus(id, status).subscribe({
      next: (updated) => {
        this.bookings.update((list) =>
          list.map((b) => (b.id === updated.id ? updated : b)),
        );
      },
      error: (err) => {
        console.error('Booking status update error:', err);
      },
    });
  }

  signOut(): void {
    this.auth.setUsername('');
    this.auth.setPassword('');
    this.router.navigate(['/admin']);
  }

  //HELPERS
  private loadCategories(): void {
    this.api.getCategories().subscribe((cats) => this.categories.set(cats));
  }

  private loadAlbums(): void {
    this.api.getAlbums().subscribe((albums) => this.albums.set(albums));
  }

  private loadPhotos(): void {
    this.api.getPhotos().subscribe((photos) => this.allPhotos.set(photos));
  }

  private loadBookings(): void {
    this.api.getBookings().subscribe({
      next: (bookings) => this.bookings.set(bookings),
      error: (err) => {
        console.error('Failed to load bookings:', err);
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/admin']);
        }
      },
    });
  }

  private problemDetail(err: any, fallback: string): string {
    if (err?.status === 401 || err?.status === 403) {
      return 'Authentication failed. Please sign in again.';
    }
    const problem = err?.error;
    return problem?.detail || problem?.title || fallback;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
