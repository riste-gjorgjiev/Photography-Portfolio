import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';
import {
  CATEGORY_TO_EVENT_TYPE,
  CategoryResponse,
  TimeOfDay,
  UpdateCategoryRequest,
} from '../../core/models/portfolio.models';
import { problemDetail } from '../../core/utils/problem-detail';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-category-edit-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent, UiIconComponent],
  templateUrl: './category-edit-dialog.component.html',
})
export class CategoryEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortfolioApiService);

  readonly category = input.required<CategoryResponse>();
  readonly saved = output<CategoryResponse>();
  readonly cancelled = output<void>();

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.maxLength(100),
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      ],
    ],
    description: [''],
    timeOfDay: ['NIGHT' as TimeOfDay, Validators.required],
    defaultAmbientHex: ['#1E293B', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    displayOrder: [0],
  });

  ngOnInit(): void {
    const category = this.category();
    this.form.patchValue(
      {
        name: category.name,
        slug: category.slug,
        description: category.description ?? '',
        timeOfDay: category.timeOfDay,
        defaultAmbientHex: category.defaultAmbientHex,
        displayOrder: category.displayOrder,
      },
      { emitEvent: false },
    );
  }

  /** True when renaming the slug would break the booking prefill mapping. */
  breaksBookingPrefill(): boolean {
    const original = this.category().slug;
    return (
      this.form.controls.slug.value !== original &&
      Object.prototype.hasOwnProperty.call(CATEGORY_TO_EVENT_TYPE, original)
    );
  }

  save(): void {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.error.set(null);

    const raw = this.form.getRawValue();
    const request: UpdateCategoryRequest = {
      name: raw.name!.trim(),
      slug: raw.slug!.trim(),
      description: raw.description?.trim() || null,
      timeOfDay: raw.timeOfDay as TimeOfDay,
      defaultAmbientHex: raw.defaultAmbientHex || '#1E293B',
      displayOrder: raw.displayOrder ?? 0,
    };

    this.api.updateCategory(this.category().id, request).subscribe({
      next: (category) => {
        this.submitting.set(false);
        this.saved.emit(category);
      },
      error: (err) => {
        this.submitting.set(false);
        console.error('Category update error:', err);
        this.error.set(problemDetail(err, 'Failed to update category.'));
      },
    });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
