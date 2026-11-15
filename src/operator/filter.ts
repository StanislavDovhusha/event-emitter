import { IObservable, OperatorFunction } from "../common";
import { Observable } from "../emitter/common/observable";

/**
 * Emits only the source values for which `predicate` returns `true`.
 *
 * `index` is the zero-based number of the source value, counted per
 * subscription. An exception thrown by `predicate` propagates to the caller
 * of `emit()`, exactly like an exception thrown by a regular subscriber.
 *
 * @example
 * emitter.asObservable()
 *   .pipe(filter((value) => value > 10))
 *   .subscribe((value) => console.log(value));
 */
export function filter<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): OperatorFunction<T, S>;
export function filter<T>(
  predicate: (value: T, index: number) => boolean
): OperatorFunction<T, T>;
export function filter<T>(
  predicate: (value: T, index: number) => boolean
): OperatorFunction<T, T> {
  if (typeof predicate !== "function") {
    throw new TypeError("filter: predicate must be a function");
  }

  return (source: IObservable<T>): Observable<T> =>
    new Observable<T>((callback) => {
      let index = 0;
      return source.subscribe((value: T) => {
        if (predicate(value, index++)) {
          callback(value);
        }
      });
    });
}
