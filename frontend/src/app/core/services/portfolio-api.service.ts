import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {
  BookingInquiryRequest, BookingInquiryResponse, BookingStatus,
  CategoryResponse, CreateCategoryRequest, CreateEventAlbumRequest,
  EventAlbumResponse,
  PhotoResponse, PhotoUploadRequest,
  TimeOfDay,
  UpdateCategoryRequest, UpdateEventAlbumRequest, UpdatePhotoRequest,
} from '../models/portfolio.models';
import {Observable} from 'rxjs';
import {AuthService} from './auth.service';
import {environment} from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PortfolioApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = environment.apiUrl;

  getCategories(timeOfDay?: TimeOfDay): Observable<CategoryResponse[]> {
    const params = this.buildParams({ timeOfDay })
    return this.http.get<CategoryResponse[]>(`${this.baseUrl}/public/categories`, { params });
  }

  getAlbums(timeOfDay?: TimeOfDay, categorySlug?: string): Observable<EventAlbumResponse[]> {
    const params = this.buildParams({ timeOfDay, categorySlug })
    return this.http.get<EventAlbumResponse[]>(`${this.baseUrl}/public/albums`, { params });
  }

  getAlbumsBySlug(slug: string): Observable<EventAlbumResponse> {
    return this.http.get<EventAlbumResponse>(`${this.baseUrl}/public/albums/${encodeURIComponent(slug)}`);
  }

  getPhotos(filters: {
    timeOfDay?: TimeOfDay;
    categorySlug?: string;
    albumSlug?: string;
    featuredOnly?: boolean;
  } = {}): Observable<PhotoResponse[]> {
    const params = this.buildParams(filters);
    return this.http.get<PhotoResponse[]>(`${this.baseUrl}/public/photos`, { params });
  }

  createBooking(request: BookingInquiryRequest): Observable<BookingInquiryResponse> {
    return this.http.post<BookingInquiryResponse>(
      `${this.baseUrl}/public/bookings`,
      request
    );
  }

  //ADMIN ENDPOINTS

  private get adminHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: this.auth.authHeader() });
  }

  uploadPhoto(file: File, metadata: PhotoUploadRequest): Observable<PhotoResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append(
      'request',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    return this.http.post<PhotoResponse>(`${this.baseUrl}/admin/photos`, formData, {
      headers: this.adminHeaders,
    });
  }

  createAlbum(request: CreateEventAlbumRequest): Observable<EventAlbumResponse> {
    return this.http.post<EventAlbumResponse>(
      `${this.baseUrl}/admin/albums`,
      request,
      { headers: this.adminHeaders },
    );
  }

  createCategory(request: CreateCategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(
      `${this.baseUrl}/admin/categories`,
      request,
      { headers: this.adminHeaders },
    );
  }

  updateAlbum(id: string, request: UpdateEventAlbumRequest): Observable<EventAlbumResponse> {
    return this.http.put<EventAlbumResponse>(
      `${this.baseUrl}/admin/albums/${encodeURIComponent(id)}`,
      request,
      { headers: this.adminHeaders },
    );
  }

  updateCategory(id: string, request: UpdateCategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(
      `${this.baseUrl}/admin/categories/${encodeURIComponent(id)}`,
      request,
      { headers: this.adminHeaders },
    );
  }

  updatePhoto(id: string, request: UpdatePhotoRequest): Observable<PhotoResponse> {
    return this.http.put<PhotoResponse>(
      `${this.baseUrl}/admin/photos/${encodeURIComponent(id)}`,
      request,
      { headers: this.adminHeaders },
    );
  }

  uploadAlbumCover(id: string, file: File): Observable<EventAlbumResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.http.post<EventAlbumResponse>(
      `${this.baseUrl}/admin/albums/${encodeURIComponent(id)}/cover`,
      formData,
      { headers: this.adminHeaders },
    );
  }

  deletePhoto(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/admin/photos/${encodeURIComponent(id)}`,
      { headers: this.adminHeaders },
    );
  }

  deleteAlbum(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/admin/albums/${encodeURIComponent(id)}`,
      { headers: this.adminHeaders },
    );
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/admin/categories/${encodeURIComponent(id)}`,
      { headers: this.adminHeaders },
    );
  }

  getBookings(status?: BookingStatus): Observable<BookingInquiryResponse[]> {
    const params = this.buildParams({ status });
    return this.http.get<BookingInquiryResponse[]>(
      `${this.baseUrl}/admin/bookings`,
      { params, headers: this.adminHeaders },
    );
  }

  updateBookingStatus(id: string, status: BookingStatus): Observable<BookingInquiryResponse> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<BookingInquiryResponse>(
      `${this.baseUrl}/admin/bookings/${encodeURIComponent(id)}/status`,
      null,
      { params, headers: this.adminHeaders },
    );
  }

  private buildParams(
    query: Record<string, string | number | boolean | null | undefined>,
  ): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null&& value !== undefined){
        params = params.set(key, String(value));
      }
    }
    return params;
  }
}
