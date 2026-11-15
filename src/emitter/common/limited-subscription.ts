import { ISubscription } from "../../common";

type SubscribeFn<T> = (callback: (value: T) => void) => ISubscription;

/**
 * Subscribes via `subscribe` and forwards at most `count` values to
 * `callback`, then releases the upstream subscription.
 *
 * Guarantees:
 * - `callback` is never invoked more than `count` times, even on re-entrant
 *   emits made from inside `callback`.
 * - The upstream subscription is released before the last value is
 *   delivered, so it is released even if `callback` throws.
 * - Sources that deliver synchronously while subscribing (for example
 *   `BehaviorEventEmitter`) are released right after `subscribe` returns.
 * - `count <= 0` never subscribes to the source at all.
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
    if (closed) {
      return;
    }
    seen++;
    if (seen >= count) {
      close();
    }
    callback(value);
  });

  if (closed) {
    // The limit was reached synchronously during subscribe().
    subscription.unsubscribe();
  } else {
    upstream = subscription;
  }

  return { unsubscribe: close };
}
