import { IObservable, OperatorFunction } from "../common";
import { Observable } from "../emitter/common/observable";
import { subscribeWithLimit } from "../emitter/common/limited-subscription";

/**
 * Emits at most `count` source values, then automatically unsubscribes from
 * the source. No values are delivered after the limit is reached.
 *
 * - `take(0)` and negative counts emit nothing and never subscribe to the source.
 * - Non-integer counts are rounded down (`take(2.7)` behaves like `take(2)`).
 * - `take(Infinity)` never completes.
 * - A non-number or `NaN` count throws a `TypeError`.
 *
 * `take(1)` is the recommended replacement for the deprecated `subscribeOnce`.
 *
 * @example
 * emitter.asObservable()
 *   .pipe(take(1))
 *   .subscribe((value) => console.log(value));
 */
export function take<T>(count: number): OperatorFunction<T, T> {
  if (typeof count !== "number" || count !== count) {
    throw new TypeError(
      "take: count must be a number, received " + String(count)
    );
  }
  const limit = Math.floor(count);

  return (source: IObservable<T>): Observable<T> =>
    new Observable<T>((callback) =>
      subscribeWithLimit<T>(
        (inner) => source.subscribe(inner),
        limit,
        callback
      )
    );
}
