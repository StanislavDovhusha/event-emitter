export interface ISubscription {
  unsubscribe(): void;
}

export interface ISubscriber<T> {
  subscribe(callback: (value: T) => void): ISubscription;
  subscribeOnce(callback: (value: T) => void): ISubscription;
}

export interface IObservable<T> extends ISubscriber<T> {
  pipe<R>(operator: OperatorFunction<T, R>): IObservable<R>;
}

export type OperatorFunction<T, R> = (source: IObservable<T>) => IObservable<R>;
