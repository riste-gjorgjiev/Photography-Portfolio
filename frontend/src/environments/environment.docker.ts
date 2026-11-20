export const environment = {
  production: true,
  // Served by nginx in the Docker image; `/api/` is proxied to the backend
  // container (see frontend/nginx.conf), so the URL stays same-origin.
  apiUrl: '/api/v1',
};
