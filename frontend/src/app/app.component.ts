import {Component, inject, OnInit} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {AmbientBackdropComponent} from './shared/components/ambient-backdrop/ambient-backdrop.component';
import {NavbarComponent} from './shared/components/navbar/navbar.component';
import {TechBadgeFooterComponent} from './shared/components/tech-badge-footer/tech-badge-footer.component';
import {AtmosphereService} from './core/services/atmosphere.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AmbientBackdropComponent, NavbarComponent, TechBadgeFooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  private readonly atmosphere = inject(AtmosphereService);

  ngOnInit(): void {
    this.atmosphere.setLightingMode('NIGHT');
  }
}
