interface ISubscription {
  unsubscribe(): void;
}
interface IObservable<T> {
  subscribe(callback: (value: T) => void): ISubscription;
  subscribeOnce(callback: (value: T) => void): ISubscription;
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
  subscribe(callback: (value: T) => void): ISubscription;
  subscribeOnce(callback: (value: T) => void): ISubscription;
  asObservable(): IObservable<T>;
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
  subscribeOnce(callback: (value: T) => void): ISubscription;
  private sendLatest;
}

declare const _default: {
  EventEmitter: typeof EventEmitter;
  BehaviorEventEmitter: typeof BehaviorEventEmitter;
};

export {
  BehaviorEventEmitter,
  EventEmitter,
  type IObservable,
  type ISubscription,
  _default as default,
};
