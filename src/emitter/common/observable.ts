import { IObservable, ISubscription, OperatorFunction } from "../../common";
import { subscribeWithLimit } from "./limited-subscription";

export type SubscribeFunction<T> = (
  callback: (value: T) => void
) => ISubscription;

/**
 * A read-only stream of values. Operators are applied via `pipe()`.
 *
 * `subscribe` and `subscribeOnce` are own, pre-bound properties, so they can
 * be safely destructured: `const { subscribe } = emitter.asObservable();`
 */
export class Observable<T> implements IObservable<T> {
  /** Subscribes to all future values of this stream. */
  public readonly subscribe: (callback: (value: T) => void) => ISubscription;

  /**
   * Subscribes to the next value only, then automatically unsubscribes.
   *
   * @deprecated Use `take(1)` instead, e.g. `observable.pipe(take(1)).subscribe(callback)`.
   */
  public readonly subscribeOnce: (
    callback: (value: T) => void
  ) => ISubscription;

  constructor(
    subscribe: SubscribeFunction<T>,
    subscribeOnce?: SubscribeFunction<T>
  ) {
    this.subscribe = subscribe;
    this.subscribeOnce =
      subscribeOnce ||
      ((callback: (value: T) => void) =>
        subscribeWithLimit(subscribe, 1, callback));
  }

  /** Composes operators left to right into a new stream. */
  public pipe(): Observable<T>;
  public pipe<A>(op1: OperatorFunction<T, A>): Observable<A>;
  public pipe<A, B>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>
  ): Observable<B>;
  public pipe<A, B, C>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>
  ): Observable<C>;
  public pipe<A, B, C, D>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>
  ): Observable<D>;
  public pipe<A, B, C, D, E>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>
  ): Observable<E>;
  public pipe<A, B, C, D, E, F>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>
  ): Observable<F>;
  public pipe(...operators: OperatorFunction<any, any>[]): Observable<unknown>;
  public pipe(...operators: OperatorFunction<any, any>[]): Observable<any> {
    return toObservable(
      operators.reduce<IObservable<any>>((prev, op) => op(prev), this)
    );
  }
}

/** Wraps any `IObservable` into an `Observable`, reusing it when possible. */
export function toObservable<T>(source: IObservable<T>): Observable<T> {
  if (source instanceof Observable) {
    return source;
  }
  return new Observable<T>(
    (callback) => source.subscribe(callback),
    (callback) => source.subscribeOnce(callback)
  );
}
