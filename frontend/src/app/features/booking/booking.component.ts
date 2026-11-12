import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';
import { AtmosphereService } from '../../core/services/atmosphere.service';
import {
  BookingInquiryResponse,
  CATEGORY_TO_EVENT_TYPE,
  EVENT_TYPES,
} from '../../core/models/portfolio.models';
import { UiIconComponent } from '../../shared/components/ui-icon/ui-icon.component';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiIconComponent],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css',
})
export class BookingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PortfolioApiService);
  private readonly atmosphere = inject(AtmosphereService);
  private readonly route = inject(ActivatedRoute);

  readonly eventTypes = EVENT_TYPES;

  readonly submitting = signal(false);
  readonly submitted = signal<BookingInquiryResponse | null>(null);
  readonly serverError = signal<string | null>(null);

  // Budget slider state
  readonly budgetSliderValue = signal(100);
  readonly isCustomBudget = signal(false);
  readonly customBudgetValue = signal('');

  // Custom event type state
  readonly customEventTypeText = signal('');

  readonly form = this.fb.group({
    clientName: ['', [Validators.required, Validators.maxLength(120)]],
    clientEmail: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    clientPhone: [''],
    eventName: ['', [Validators.required, Validators.maxLength(100)]],
    eventType: ['', [Validators.required]],
    venueOrLocation: [''],
    eventDate: ['', [Validators.required]],
    durationHours: [null as number | null, [Validators.min(1), Validators.max(72)]],
    budgetRange: ['€100'],
    projectDetails: ['', [Validators.maxLength(3000)]],
  });

  ngOnInit(): void {
    this.prefillFormQueryParams();
  }

  // ─── Event Type ──────────────────────────────────────────────────

  selectEventType(value: string, ambientHex: string): void {
    this.form.controls.eventType.setValue(value);
    this.atmosphere.setAmbientColors(ambientHex, ambientHex);
    if (value !== 'OTHER') {
      this.customEventTypeText.set('');
    }
  }

  onCustomEventTypeInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customEventTypeText.set(value);
    this.form.controls.eventType.setValue(value);
  }

  isEventTypeSelected(value: string): boolean {
    return this.form.controls.eventType.value === value;
  }

  // ─── Budget Slider ───────────────────────────────────────────────

  onBudgetSliderInput(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.budgetSliderValue.set(value);
    if (!this.isCustomBudget()) {
      this.form.controls.budgetRange.setValue(`€${value}`);
    }
  }

  toggleCustomBudget(): void {
    this.isCustomBudget.update((v) => !v);
    if (!this.isCustomBudget()) {
      this.form.controls.budgetRange.setValue(`€${this.budgetSliderValue()}`);
    } else {
      this.form.controls.budgetRange.setValue('');
    }
  }

  onCustomBudgetInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.customBudgetValue.set(value);
    this.form.controls.budgetRange.setValue(value ? `€${value} (custom)` : '');
  }

  // ─── Submission ──────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();

    const isoDate = this.parseDateDDMMYYYY(raw.eventDate!);
    if (!isoDate) {
      this.serverError.set('Please enter a valid date in dd/mm/yyyy format.');
      return;
    }

    this.submitting.set(true);
    this.serverError.set(null);

    this.api
      .createBooking({
        clientName: raw.clientName!.trim(),
        clientEmail: raw.clientEmail!.trim(),
        clientPhone: raw.clientPhone?.trim() || undefined,
        eventName: raw.eventName!.trim(),
        eventType: raw.eventType!,
        venueOrLocation: raw.venueOrLocation?.trim() || undefined,
        eventDate: isoDate,
        durationHours: raw.durationHours ?? undefined,
        budgetRange: raw.budgetRange || undefined,
        projectDetails: raw.projectDetails?.trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.submitted.set(response);
          this.atmosphere.resetAmbientColors();
        },
        error: (err) => {
          this.submitting.set(false);
          console.error('Booking submission error:', err);
          const problem = err.error;
          this.serverError.set(
            problem?.detail || problem?.title || 'Something went wrong. Please try again.',
          );
        },
      });
  }

  resetForm(): void {
    this.submitted.set(null);
    this.serverError.set(null);
    this.form.reset();
    this.form.controls.budgetRange.setValue('€100');
    this.budgetSliderValue.set(100);
    this.isCustomBudget.set(false);
    this.customBudgetValue.set('');
    this.customEventTypeText.set('');
    this.atmosphere.resetAmbientColors();
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  private parseDateDDMMYYYY(value: string): string | null {
    const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return null;
    const [, day, month, year] = match;
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2100) return null;
    return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
  }

  private prefillFormQueryParams(): void {
    const qp = this.route.snapshot.queryParamMap;
    const rawEventType = qp.get('eventType');
    const eventName = qp.get('eventName');

    if (rawEventType) {
      const mapped = CATEGORY_TO_EVENT_TYPE[rawEventType];
      if (mapped) {
        this.form.controls.eventType.setValue(mapped);
        const hex = this.eventTypes.find((t) => t.value === mapped)?.ambientHex;
        if (hex) this.atmosphere.setAmbientColors(hex, hex);
      }
    }

    if (eventName) {
      this.form.controls.eventName.setValue(eventName);
      const currentDetails = this.form.controls.projectDetails.value || '';
      const prefillNote = `Interested in a shoot similar to "${eventName}"...`;
      this.form.controls.projectDetails.setValue(
        currentDetails ? `${currentDetails}\n${prefillNote}` : prefillNote,
      );
    }
  }
}
