import { Routes } from '@angular/router';
import { GalleryComponent } from './features/gallery/gallery.component';

export const routes: Routes = [
  {
    path: '',
    component: GalleryComponent,
    title: 'Photography Portfolio — Gallery',
  },
  {
    path: 'booking',
    loadComponent: () =>
      import('./features/booking/booking-placeholder.component').then(
        (m) => m.BookingPlaceholderComponent,
      ),
    title: 'Book a Shoot',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
