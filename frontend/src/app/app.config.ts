import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { IMAGE_LOADER } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { lucideIconProviders } from './shared/components/ui-icon/lucide-icons.providers';
import { portfolioImageLoader } from './core/utils/image-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    { provide: IMAGE_LOADER, useValue: portfolioImageLoader },
    lucideIconProviders,
  ]
};
