import { IObservable, ISubscription } from "./common";
import { InternalObserver } from "./internal-observer";

export abstract class Emitter<T> {
  private observers: InternalObserver<T>[] = [];
  private counter = 0;

  public emit(value: T): void {
    for (const observer of this.observers) {
      observer.execute(value);
    }
  }

  public removeAll(): void {
    this.observers.forEach((item) => item.unsubscribe());
  }

  public subscribe(callback: (value: T) => void): ISubscription {
    return this.add(callback, false);
  }

  public subscribeOnce(callback: (value: T) => void): ISubscription {
    return this.add(callback, true);
  }

  public asObservable(): IObservable<T> {
    return {
      subscribe: this.subscribe.bind(this),
      subscribeOnce: this.subscribeOnce.bind(this),
    };
  }

  public hasSubscribers(): boolean {
    return this.getObservers().length > 0;
  }

  protected getObservers(): readonly InternalObserver<T>[] {
    return this.observers;
  }

  private add(callback: (value: T) => void, once: boolean): ISubscription {
    const id = ++this.counter;

    let observer!: InternalObserver<T>;

    const wrappedCallback = once
      ? (value: T) => {
          callback(value);
          observer.unsubscribe();
        }
      : callback;

    observer = new InternalObserver<T>(id, wrappedCallback, (removeId) => {
      this.observers = this.observers.filter((o) => o.getId() !== removeId);
    });

    this.observers.push(observer);
    return observer.toSubscription();
  }
}
