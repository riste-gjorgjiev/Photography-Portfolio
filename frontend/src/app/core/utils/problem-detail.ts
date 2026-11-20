/**
 * Extracts a human-readable message from a Spring ProblemDetail error response.
 */
export function problemDetail(err: unknown, fallback: string): string {
  const status = (err as { status?: number } | null)?.status;
  if (status === 401 || status === 403) {
    return 'Authentication failed. Please sign in again.';
  }
  const problem = (err as { error?: { detail?: string; title?: string } } | null)?.error;
  return problem?.detail || problem?.title || fallback;
}
