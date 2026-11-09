import {Component, inject} from '@angular/core';
import {AtmosphereService} from '../../../core/services/atmosphere.service';

@Component({
  selector: 'app-ambient-backdrop',
  standalone: true,
  templateUrl: './ambient-backdrop.component.html',
  styleUrl: './ambient-backdrop.component.css',
})
export class AmbientBackdropComponent {
  private readonly atmosphere = inject(AtmosphereService);

  readonly ambientPrimaryHex = this.atmosphere.ambientPrimaryHex;
  readonly ambientSecondaryHex = this.atmosphere.ambientSecondaryHex;

  constructor() {
  }

}
