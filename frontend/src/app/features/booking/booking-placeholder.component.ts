import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-booking-placeholder',
  standalone: true,
  template: `
    <section class="max-w-2xl mx-auto px-4 py-16">
      <h1 class="text-2xl font-light text-white/90 mb-4">📸 Book a Shoot</h1>
      <p class="text-sm text-white/50 mb-6">
        The full booking form is coming in Phase 5. In the meantime, here's what
        the lightbox pre-filled:
      </p>

      @if (eventType || eventName) {
        <div class="p-4 rounded-lg bg-white/5 border border-white/10 font-mono text-sm">
          @if (eventType) {
            <p class="text-white/60">Event Type: <span class="text-white/90">{{ eventType }}</span></p>
          }
          @if (eventName) {
            <p class="text-white/60 mt-1">Event Name: <span class="text-white/90">{{ eventName }}</span></p>
          }
        </div>
      } @else {
        <p class="text-sm text-white/30 font-mono">No pre-filled parameters.</p>
      }
    </section>
  `,
})
export class BookingPlaceholderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  eventType: string | null = null;
  eventName: string | null = null;

  ngOnInit(): void {
    this.eventType = this.route.snapshot.queryParamMap.get('eventType');
    this.eventName = this.route.snapshot.queryParamMap.get('eventName');
  }
}
