import { Routes } from '@angular/router';
import { GalleryComponent } from './features/gallery/gallery.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Photography Portfolio — Drawing With Light',
  },
  {
    path: 'explore',
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
