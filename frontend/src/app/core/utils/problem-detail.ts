/**
 * Extracts a human-readable message from a Spring ProblemDetail error response.
 */
export function problemDetail(err: unknown, fallback: string): string {
  const status = (err as { status?: number } | null)?.status;

  if (status === 401 || status === 403) {
    return 'Authentication failed. Please sign in again.';
  }
  // status 0 = the browser never got a usable response: offline, CORS-rejected
  // preflight, or the API is down/restarting behind its proxy.
  if (status === 0) {
    return 'Could not reach the API. It may be restarting or not yet deployed with this '
      + 'endpoint — check the browser console for the exact network/CORS error.';
  }
  const problem = (err as { error?: { detail?: string; title?: string } } | null)?.error;
  return problem?.detail || problem?.title || fallback;
}
