import {
  computed,
  effect,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TimeOfDay } from '../models/portfolio.models';

export type LightingMode = TimeOfDay | 'ALL';

interface CanvasTokens {
  base: string;
  surface: string;
  text: string;
}

const CANVAS_TOKENS: Record<LightingMode, CanvasTokens> = {
  NIGHT: { base: '#070709', surface: '#111116', text: '#F4F4F6' },
  ALL: { base: '#070709', surface: '#111116', text: '#F4F4F6' },
  DAY: { base: '#141619', surface: '#1E2024', text: '#F9F8F6' },
};

const DEFAULT_AMBIENT_PRIMARY = '#3B82F6';
const DEFAULT_AMBIENT_SECONDARY = '#1D4ED8';

@Injectable({ providedIn: 'root' })
export class AtmosphereService {
  private readonly document = inject(DOCUMENT);

  private readonly _lightingMode = signal<LightingMode>('NIGHT');
  private readonly _activeCategorySlug = signal<string | null>(null);
  private readonly _activeAlbumSlug = signal<string | null>(null);
  private readonly _ambientPrimaryHex = signal<string>(DEFAULT_AMBIENT_PRIMARY);
  private readonly _ambientSecondaryHex = signal<string>(DEFAULT_AMBIENT_SECONDARY);
  private readonly _exifHudEnabled = signal<boolean>(true);

  readonly lightingMode = this._lightingMode.asReadonly();
  readonly activeCategorySlug = this._activeCategorySlug.asReadonly();
  readonly activeAlbumSlug = this._activeAlbumSlug.asReadonly();
  readonly ambientPrimaryHex = this._ambientPrimaryHex.asReadonly();
  readonly ambientSecondaryHex = this._ambientSecondaryHex.asReadonly();
  readonly exifHudEnabled = this._exifHudEnabled.asReadonly();

  readonly canvasTokens = computed<CanvasTokens>(
    () => CANVAS_TOKENS[this._lightingMode()],
  );

  readonly isDayMode = computed(() => this._lightingMode() === 'DAY');
  readonly isNightMode = computed(() => this._lightingMode() === 'NIGHT');

  constructor() {
    effect(() => this.applyCssVariables());
  }

  setLightingMode(mode: LightingMode): void {
    this._lightingMode.set(mode);
    this._activeCategorySlug.set(null);
    this._activeAlbumSlug.set(null);
  }

  setActiveCategory(slug: string | null, ambientHex?: string): void {
    this._activeCategorySlug.set(slug);
    // FIX: Changing category must clear any active album filter.
    // Otherwise photos stay filtered by an album belonging to the old
    // category, which makes the grid appear "stuck" or empty.
    this._activeAlbumSlug.set(null);
    if (ambientHex){
      this._ambientPrimaryHex.set(ambientHex);
    }
  }

  setActiveAlbum(slug: string | null, ambientHex?: string): void {
    this._activeAlbumSlug.set(slug);
    if (ambientHex){
      this._ambientPrimaryHex.set(ambientHex);
    }
  }

  resetAmbientColors(): void {
    this._ambientPrimaryHex.set(DEFAULT_AMBIENT_PRIMARY);
    this._ambientSecondaryHex.set(DEFAULT_AMBIENT_SECONDARY);
  }

  toggleExifHud(): void {
    this._exifHudEnabled.update((enabled) => !enabled);
  }

  setExifHudEnabled(enabled: boolean): void {
    this._exifHudEnabled.set(enabled);
  }

  setAmbientColors(primary: string, secondary: string): void {
    this._ambientPrimaryHex.set(primary);
    this._ambientSecondaryHex.set(secondary);
  }

  private applyCssVariables(): void {
    const root = this.document.documentElement;
    const tokens = this.canvasTokens();

    root.style.setProperty('--ambient-primary', this._ambientPrimaryHex())
    root.style.setProperty('--ambient-secondary', this._ambientSecondaryHex())
    root.style.setProperty('--bg-base', tokens.base);
    root.style.setProperty('--bg-surface', tokens.surface);
    root.style.setProperty('--text-primary', tokens.text);
    root.style.setProperty('--lighting-mode', this._lightingMode());
  }

}
