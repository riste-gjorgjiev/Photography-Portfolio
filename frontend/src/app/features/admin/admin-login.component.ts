import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PortfolioApiService } from '../../core/services/portfolio-api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css',
})
export class AdminLoginComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(PortfolioApiService);
  readonly auth = inject(AuthService);

  readonly loggingIn = signal(false);
  readonly loginError = signal<string | null>(null);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  onLogin(): void {
    const user = this.auth.username().trim();
    const pass = this.auth.password().trim();
    if (!user || !pass || this.loggingIn()) return;

    this.loggingIn.set(true);
    this.loginError.set(null);

    this.api.getBookings().subscribe({
      next: () => {
        this.loggingIn.set(false);
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.loggingIn.set(false);
        console.error('Login error:', err);
        if (err.status === 401 || err.status === 403) {
          this.loginError.set('Invalid credentials. Please check your username and password.');
        } else if (err.status === 0) {
          this.loginError.set('Cannot reach the backend. Is it running on localhost:8080?');
        } else {
          this.loginError.set('Connection failed. Please try again.');
        }
      },
    });
  }
}
