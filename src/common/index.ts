export interface ISubscription {
  unsubscribe(): void;
}

export interface IObservable<T> {
  subscribe(callback: (value: T) => void): ISubscription;
  subscribeOnce(callback: (value: T) => void): ISubscription;
}
