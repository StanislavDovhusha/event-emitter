import { ISubscription } from "../../common";
import { InternalObserver } from "./internal-observer";
import { Observable } from "./observable";

export abstract class Emitter<T> {
  private observers: InternalObserver<T>[] = [];
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

  /**
   * Subscribes to the next value only, then automatically unsubscribes.
   *
   * @deprecated Use `take(1)` instead, e.g.
   * `emitter.asObservable().pipe(take(1)).subscribe(callback)`.
   */
  public subscribeOnce(callback: (value: T) => void): ISubscription {
    return this.add(callback, true);
  }

  /**
   * Returns a read-only view of this emitter that supports operators
   * via `pipe()` (e.g. `filter`, `map`, `take`). It is still an `IObservable<T>`.
   */
  public asObservable(): Observable<T> {
    return new Observable<T>(
      this.subscribe.bind(this),
      this.subscribeOnce.bind(this)
    );
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
