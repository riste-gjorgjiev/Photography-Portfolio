import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AtmosphereService, LightingMode} from '../../../core/services/atmosphere.service';
import {PortfolioApiService} from '../../../core/services/portfolio-api.service';
import {CategoryResponse} from '../../../core/models/portfolio.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})

export class NavbarComponent implements OnInit {
  private readonly atmosphere = inject(AtmosphereService);
  private readonly api = inject(PortfolioApiService);

  readonly lightingMode = this.atmosphere.lightingMode;
  readonly activeCategorySlug = this.atmosphere.activeCategorySlug;
  readonly ambientPrimaryHex = this.atmosphere.ambientPrimaryHex;
  readonly ambientSecondaryHex = this.atmosphere.ambientSecondaryHex;

  readonly categories = signal<CategoryResponse[]>([]);

  ngOnInit(): void {
    this.loadCategories();
  }

  setLightingMode(mode: LightingMode): void {
    this.atmosphere.setLightingMode(mode);
    this.loadCategories();
  }

  setActiveCategory(slug: string, ambientHex: string): void {
    this.atmosphere.setActiveCategory(slug, ambientHex);
  }

  clearActiveCategory(): void {
    this.atmosphere.setActiveCategory(null);
    this.atmosphere.resetAmbientColors();
  }

  private loadCategories(): void {
    const mode = this.lightingMode();
    const timeOfDay = mode === 'ALL' ? undefined : mode;
    this.api.getCategories(timeOfDay).subscribe((cats) => this.categories.set(cats));
  }

}
