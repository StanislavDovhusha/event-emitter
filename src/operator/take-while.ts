import { IObservable, OperatorFunction } from "../common";
import { Observable } from "../emitter/common/observable";
import { subscribeClosable } from "../emitter/common/limited-subscription";

/**
 * Emits source values while `predicate` returns `true`. On the first value
 * for which it returns `false`, automatically unsubscribes from the source;
 * that value is not delivered unless `inclusive` is `true`.
 *
 * `index` is the zero-based number of the source value, counted per
 * subscription. An exception thrown by `predicate` propagates to the caller
 * of `emit()`, exactly like an exception thrown by a regular subscriber,
 * and the subscription stays active.
 *
 * @example
 * emitter.asObservable()
 *   .pipe(takeWhile((value) => value < 10))
 *   .subscribe((value) => console.log(value));
 */
export function takeWhile<T, S extends T>(
  predicate: (value: T, index: number) => value is S,
  inclusive?: false
): OperatorFunction<T, S>;
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive?: boolean
): OperatorFunction<T, T>;
export function takeWhile<T>(
  predicate: (value: T, index: number) => boolean,
  inclusive: boolean = false
): OperatorFunction<T, T> {
  if (typeof predicate !== "function") {
    throw new TypeError("takeWhile: predicate must be a function");
  }

  return (source: IObservable<T>): Observable<T> =>
    new Observable<T>((callback) => {
      let index = 0;
      return subscribeClosable<T>(
        (inner) => source.subscribe(inner),
        (value, close) => {
          if (predicate(value, index++)) {
            callback(value);
            return;
          }
          close();
          if (inclusive) {
            callback(value);
          }
        }
      );
    });
}
