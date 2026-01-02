/**
 * Fetch with Timeout Utility
 *
 * Wraps native fetch with AbortController-based timeout.
 * Scalable: Single AbortController per request, GC'd immediately after completion.
 */

// Default timeout from environment or 30 seconds
const DEFAULT_TIMEOUT_MS = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || "30000",
  10
);

/**
 * Custom error class for timeout errors
 */
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

/**
 * Fetch wrapper with timeout support using AbortController.
 * Efficient: One AbortController per request, minimal overhead.
 *
 * @param input - URL or Request object
 * @param init - Fetch options
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves to Response or rejects with TimeoutError
 */
export async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1],
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();

  // Set up timeout using AbortController
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    // Check if this was an abort due to timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    // Clean up timer immediately - prevents memory leaks
    clearTimeout(timeoutId);
  }
}
