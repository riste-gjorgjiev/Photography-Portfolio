import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

/**
 * Shared inline-SVG icon wrapper around Lucide.
 *
 * Icons inherit `currentColor`, so colour is driven by `text-*` utilities on
 * the host. Size defaults to 20px; pass `[size]` for anything larger/smaller.
 * The icon set is registered globally in {@link lucideIconProviders}.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <lucide-icon
      [name]="name()"
      [size]="size()"
      [strokeWidth]="strokeWidth()"
      [attr.aria-hidden]="true"
    />
  `,
  styles: [':host { display: inline-flex; align-items: center; justify-content: center; }'],
})
export class UiIconComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(20);
  readonly strokeWidth = input<number>(1.75);
}
