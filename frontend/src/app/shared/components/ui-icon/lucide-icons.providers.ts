import { importProvidersFrom } from '@angular/core';
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  GripVertical,
  ImagePlus,
  Images,
  Info,
  LucideAngularModule,
  Palette,
  Pencil,
  Save,
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
    GripVertical,
    ImagePlus,
    Images,
    Info,
    Palette,
    Pencil,
    Save,
    Star,
    TriangleAlert,
    Upload,
    X,
  }),
);
