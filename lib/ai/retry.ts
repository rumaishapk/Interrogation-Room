// Runs `fn`. If it fails with a temporary error, waits and tries again.
// Each wait is longer than the last ("backoff"), giving a busy service time to recover.
// No Gemini or Next.js imports, so it can be unit-tested with a fake `fn`.

type RetryOptions = {
  // Decides which errors are worth retrying. Permanent errors (e.g. a wrong API key) are not.
  isTemporary: (err: unknown) => boolean;
  // How long to wait before each retry. [3000, 8000] = up to 2 retries.
  delaysMs: number[];
  onRetry?: (err: unknown, delayMs: number) => void;
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  for (let retry = 0; ; retry++) {
    try {
      return await fn();
    } catch (err) {
      const delayMs = options.delaysMs[retry];
      // Give up on a permanent error, or once every retry has been used.
      if (!options.isTemporary(err) || delayMs === undefined) throw err;
      options.onRetry?.(err, delayMs);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
