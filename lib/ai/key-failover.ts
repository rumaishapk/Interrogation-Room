// Uses the first API key until its quota runs out, then the next one, and so on.
// No Gemini or Next.js imports, so it can be tested with fake clients.

type Options = {
  // Is this error "this key's quota is used up"? Only those cause a switch.
  isQuotaError: (err: unknown) => boolean;
  // After a key runs out, skip it for this long before trying it again.
  cooldownMs: number;
  now?: () => number; // replaceable in tests
  onSwitch?: (fromIndex: number, toIndex: number) => void;
};

export function createFailover<Client>(clients: Client[], options: Options) {
  const now = options.now ?? Date.now;
  // For each key: the time until which it's treated as exhausted (0 = available).
  const exhaustedUntil = clients.map(() => 0);

  return async function run<T>(call: (client: Client) => Promise<T>): Promise<T> {
    if (clients.length === 0) throw new Error("No API keys configured.");

    // Try available keys in order. If every key is cooling down, try them all anyway:
    // a quota may have reset early, and the caller should see the real error.
    const available = clients.map((_, i) => i).filter((i) => exhaustedUntil[i] <= now());
    const order = available.length > 0 ? available : clients.map((_, i) => i);

    let lastError: unknown;
    for (const [position, i] of order.entries()) {
      try {
        return await call(clients[i]);
      } catch (err) {
        if (!options.isQuotaError(err)) throw err; // other errors aren't fixed by another key
        exhaustedUntil[i] = now() + options.cooldownMs;
        lastError = err;
        const next = order[position + 1];
        if (next !== undefined) options.onSwitch?.(i, next);
      }
    }
    throw lastError;
  };
}
