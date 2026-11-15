export interface ISubscription {
  unsubscribe(): void;
}

export interface IObservable<T> {
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
export type OperatorFunction<T, R> = (source: IObservable<T>) => IObservable<R>;
