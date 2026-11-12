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
      import('./features/booking/booking.component').then((m) => m.BookingComponent),
    title: 'Book Me for an Event',
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/admin-login.component').then((m) => m.AdminLoginComponent),
    title: 'Admin Login',
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./features/admin/admin-cms.component').then((m) => m.AdminCmsComponent),
    title: 'Admin CMS Studio',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
