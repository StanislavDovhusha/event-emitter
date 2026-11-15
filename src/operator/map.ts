import { IObservable, OperatorFunction } from "../common";
import { Observable } from "../emitter/common/observable";

/**
 * Emits the result of applying `project` to each source value.
 *
 * `index` is the zero-based number of the source value, counted per
 * subscription. An exception thrown by `project` propagates to the caller
 * of `emit()`, exactly like an exception thrown by a regular subscriber.
 *
 * @example
 * emitter.asObservable()
 *   .pipe(map((value) => value * 2))
 *   .subscribe((value) => console.log(value));
 */
export function map<T, R>(
  project: (value: T, index: number) => R
): OperatorFunction<T, R> {
  if (typeof project !== "function") {
    throw new TypeError("map: project must be a function");
  }

  return (source: IObservable<T>): Observable<R> =>
    new Observable<R>((callback) => {
      let index = 0;
      return source.subscribe((value: T) => {
        callback(project(value, index++));
      });
    });
}
