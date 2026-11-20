import {
  Component,
  ElementRef,
  HostListener,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

/**
 * Dark-theme modal shell used by the admin edit dialogs.
 *
 * Rendered conditionally by the parent (`@if`), so the Escape listener only
 * exists while the dialog is open. Backdrop clicks close it; clicks inside the
 * panel are stopped.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [UiIconComponent],
  template: `
    <div
      class="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      (click)="closed.emit()"
    >
      <div
        #panel
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        class="my-auto w-full rounded-2xl border border-white/10 bg-[#111116] shadow-2xl focus:outline-none"
        [class]="wide() ? 'max-w-3xl' : 'max-w-xl'"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/10">
          <div>
            <h2 class="text-lg font-display font-light text-white/90">{{ title() }}</h2>
            @if (subtitle(); as sub) {
              <p class="text-[11px] font-mono text-white/35 mt-1">{{ sub }}</p>
            }
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="w-7 h-7 shrink-0 rounded-full bg-white/5 hover:bg-white/15 text-white/50 hover:text-white/80 flex items-center justify-center transition-colors"
            title="Close"
          >
            <app-icon name="x" [size]="14" />
          </button>
        </div>

        <div class="px-6 py-5">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly wide = input<boolean>(false);

  readonly closed = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect(() => this.panel()?.nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
