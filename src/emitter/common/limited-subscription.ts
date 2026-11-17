import { ISubscription } from "../../common";

type SubscribeFn<T> = (callback: (value: T) => void) => ISubscription;

/**
 * Subscribes via `subscribe` and passes every value to `next` together with
 * a `close` function that ends the subscription early (completion).
 *
 * Guarantees:
 * - After `close()` no further values reach `next`, even on re-entrant emits
 *   made from inside `next`.
 * - `close()` releases the upstream subscription immediately, so calling it
 *   before delivering the last value releases the source even if the
 *   subscriber throws.
 * - Sources that deliver synchronously while subscribing (for example
 *   `BehaviorEventEmitter`) are released right after `subscribe` returns.
 * - The returned subscription's `unsubscribe` is idempotent.
 */
export function subscribeClosable<T>(
  subscribe: SubscribeFn<T>,
  next: (value: T, close: () => void) => void
): ISubscription {
  let closed = false;
  let upstream: ISubscription | undefined;

  const close = () => {
    if (closed) {
      return;
    }
    closed = true;
    if (upstream) {
      upstream.unsubscribe();
      upstream = undefined;
    }
  };

  const subscription = subscribe((value: T) => {
    if (!closed) {
      next(value, close);
    }
  });

  if (closed) {
    // Completed synchronously during subscribe().
    subscription.unsubscribe();
  } else {
    upstream = subscription;
  }

  return { unsubscribe: close };
}

/**
 * Subscribes via `subscribe` and forwards at most `count` values to
 * `callback`, then releases the upstream subscription.
 * `count <= 0` never subscribes to the source at all.
 */
export function subscribeWithLimit<T>(
  subscribe: SubscribeFn<T>,
  count: number,
  callback: (value: T) => void
): ISubscription {
  if (!(count > 0)) {
    return { unsubscribe: () => {} };
  }

  let seen = 0;
  return subscribeClosable<T>(subscribe, (value, close) => {
    seen++;
    if (seen >= count) {
      close();
    }
    callback(value);
  });
}
