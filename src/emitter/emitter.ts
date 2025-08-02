import {
  IObservable,
  ISubscriber,
  ISubscription,
  OperatorFunction,
  // OperatorFunction,
} from "../common";
import { InternalObserver } from "./common/internal-observer";
import { Observable } from "./common/observable";

export abstract class Emitter<T> implements IObservable<T> {
  private observers: InternalObserver[] = [];
  private counter = 0;

  public emit(value: T): void {
    for (const observer of this.observers) {
      observer.execute(value);
    }
  }

  public unsubscribeAll(): void {
    this.observers.forEach((item) => item.unsubscribe());
  }

  public subscribe(callback: (value: T) => void): ISubscription {
    return this.add(callback, false);
  }

  public subscribeOnce(callback: (value: T) => void): ISubscription {
    return this.add(callback, true);
  }

  public asObservable(): Observable<T> {
    return new Observable<T>(this);
  }

  public pipe<R>(operator: OperatorFunction<T, R>): IObservable<R> {
    return operator(this);
  }

  public hasSubscribers(): boolean {
    return this.getObservers().length > 0;
  }

  protected getObservers(): readonly InternalObserver[] {
    return this.observers;
  }

  private add(callback: (value: T) => void, once: boolean): ISubscription {
    const id = ++this.counter;

    let observer!: InternalObserver;

    const wrappedCallback = once
      ? (value: T) => {
          callback(value);
          observer.unsubscribe();
        }
      : callback;

    observer = new InternalObserver(id, wrappedCallback, (removeId) => {
      this.observers = this.observers.filter((o) => o.getId() !== removeId);
    });

    this.observers.push(observer);
    return observer.toSubscription();
  }
}
