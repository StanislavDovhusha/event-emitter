interface ISubscription {
  unsubscribe(): void;
}
interface IObservable<T> {
  subscribe(callback: (value: T) => void): ISubscription;
  /**
   * Subscribes to the next value only, then automatically unsubscribes.
   *
   * @deprecated Use `take(1)` instead, e.g.
   * `emitter.asObservable().pipe(take(1)).subscribe(callback)`.
   */
  subscribeOnce(callback: (value: T) => void): ISubscription;
}

/**
 * A function that takes a source stream and returns a derived stream.
 * Used with `Observable.pipe()`.
 */
type OperatorFunction<T, R> = (source: IObservable<T>) => IObservable<R>;

type SubscribeFunction<T> = (callback: (value: T) => void) => ISubscription;

/**
 * A read-only stream of values. Operators are applied via `pipe()`.
 *
 * `subscribe` and `subscribeOnce` are own, pre-bound properties, so they can
 * be safely destructured: `const { subscribe } = emitter.asObservable();`
 */
declare class Observable<T> implements IObservable<T> {
  /** Subscribes to all future values of this stream. */
  readonly subscribe: (callback: (value: T) => void) => ISubscription;
  /**
   * Subscribes to the next value only, then automatically unsubscribes.
   *
   * @deprecated Use `take(1)` instead, e.g. `observable.pipe(take(1)).subscribe(callback)`.
   */
  readonly subscribeOnce: (callback: (value: T) => void) => ISubscription;
  constructor(
    subscribe: SubscribeFunction<T>,
    subscribeOnce?: SubscribeFunction<T>
  );
  /** Composes operators left to right into a new stream. */
  pipe(): Observable<T>;
  pipe<A>(op1: OperatorFunction<T, A>): Observable<A>;
  pipe<A, B>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>
  ): Observable<B>;
  pipe<A, B, C>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>
  ): Observable<C>;
  pipe<A, B, C, D>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>
  ): Observable<D>;
  pipe<A, B, C, D, E>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>
  ): Observable<E>;
  pipe<A, B, C, D, E, F>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>,
    op6: OperatorFunction<E, F>
  ): Observable<F>;
  pipe(...operators: OperatorFunction<any, any>[]): Observable<unknown>;
}

declare class InternalObserver<T> {
  private readonly id;
  private readonly callback;
  private readonly onUnsubscribe;
  constructor(
    id: number,
    callback: (value: T) => void,
    onUnsubscribe: (id: number) => void
  );
  getId(): number;
  execute(value: T): void;
  unsubscribe(): void;
  toSubscription(): ISubscription;
}

declare abstract class Emitter<T> {
  private observers;
  private counter;
  emit(value: T): void;
  removeAll(): void;
  /** Removes all active subscribers. */
  unsubscribeAll(): void;
  subscribe(callback: (value: T) => void): ISubscription;
  /**
   * Subscribes to the next value only, then automatically unsubscribes.
   *
   * @deprecated Use `take(1)` instead, e.g.
   * `emitter.asObservable().pipe(take(1)).subscribe(callback)`.
   */
  subscribeOnce(callback: (value: T) => void): ISubscription;
  /**
   * Returns a read-only view of this emitter that supports operators
   * via `pipe()` (e.g. `filter`, `map`, `take`). It is still an `IObservable<T>`.
   */
  asObservable(): Observable<T>;
  hasSubscribers(): boolean;
  protected getObservers(): readonly InternalObserver<T>[];
  private add;
}

declare class EventEmitter<T> extends Emitter<T> {}

declare class BehaviorEventEmitter<T> extends Emitter<T> {
  private value;
  constructor(value: T);
  getValue(): T | undefined;
  emit(value: T): void;
  subscribe(callback: (value: T) => void): ISubscription;
  /**
   * Delivers the current value immediately if it is defined, otherwise waits
   * for the next emitted value, then automatically unsubscribes.
   *
   * @deprecated Use `take(1)` instead, e.g.
   * `emitter.asObservable().pipe(take(1)).subscribe(callback)`.
   */
  subscribeOnce(callback: (value: T) => void): ISubscription;
  private sendLatest;
}

/**
 * Emits only the source values for which `predicate` returns `true`.
 * `index` is the zero-based number of the source value, per subscription.
 * Errors thrown by `predicate` propagate to the caller of `emit()`.
 */
declare function filter<T, S extends T>(
  predicate: (value: T, index: number) => value is S
): OperatorFunction<T, S>;
declare function filter<T>(
  predicate: (value: T, index: number) => boolean
): OperatorFunction<T, T>;

/**
 * Emits the result of applying `project` to each source value.
 * `index` is the zero-based number of the source value, per subscription.
 * Errors thrown by `project` propagate to the caller of `emit()`.
 */
declare function map<T, R>(
  project: (value: T, index: number) => R
): OperatorFunction<T, R>;

/**
 * Emits at most `count` source values, then automatically unsubscribes from
 * the source. `take(0)` and negative counts emit nothing; non-integer counts
 * are rounded down; a non-number or `NaN` count throws a `TypeError`.
 *
 * `take(1)` is the recommended replacement for the deprecated `subscribeOnce`.
 */
declare function take<T>(count: number): OperatorFunction<T, T>;

declare const _default: {
  EventEmitter: typeof EventEmitter;
  BehaviorEventEmitter: typeof BehaviorEventEmitter;
  Observable: typeof Observable;
  filter: typeof filter;
  map: typeof map;
  take: typeof take;
};

export {
  BehaviorEventEmitter,
  EventEmitter,
  Observable,
  filter,
  map,
  take,
  type IObservable,
  type ISubscription,
  type OperatorFunction,
  _default as default,
};
