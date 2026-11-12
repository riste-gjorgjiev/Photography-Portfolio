import {computed, Injectable, signal} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _username = signal<string>('');
  private readonly _password = signal<string>('');

  readonly username = this._username.asReadonly();
  readonly password = this._password.asReadonly();

  readonly isAuthenticated = computed(() =>
    this._username().trim().length > 0 && this._password().trim().length > 0,
  );

  readonly authHeader = computed(() => {
    const encoded = btoa(`${this._username()}:${this._password()}`);
    return `Basic ${encoded}`;
  });

  readonly connectionLabel = computed<'ready' | 'missing'>(() =>
    this.isAuthenticated() ? 'ready' : 'missing',
  );

  setUsername(value: string): void {
    this._username.set(value);
  }

  setPassword(value: string): void {
    this._password.set(value);
  }
}
