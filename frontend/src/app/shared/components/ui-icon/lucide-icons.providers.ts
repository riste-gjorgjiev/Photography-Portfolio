import { importProvidersFrom } from '@angular/core';
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Info,
  LucideAngularModule,
  Palette,
  Star,
  TriangleAlert,
  Upload,
  X,
} from 'lucide-angular';

/**
 * Registers the Lucide icon set used by {@link UiIconComponent} at application
 * bootstrap. Providers must be global — standalone component `imports` rejects
 * the `ModuleWithProviders` returned by `LucideAngularModule.pick`.
 */
export const lucideIconProviders = importProvidersFrom(
  LucideAngularModule.pick({
    ArrowRight,
    Camera,
    Check,
    ChevronLeft,
    ChevronRight,
    Circle,
    Info,
    Palette,
    Star,
    TriangleAlert,
    Upload,
    X,
  }),
);
