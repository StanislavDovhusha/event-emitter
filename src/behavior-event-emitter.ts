import { Emitter } from "./emitter";
import { ISubscription } from "./common";

export class BehaviorEventEmitter<T> extends Emitter<T> {
  private value: T;

  constructor(value: T) {
    super();
    this.value = value;
  }

  public getValue(): T | undefined {
    return this.value;
  }

  public emit(value: T): void {
    this.value = value;
    super.emit(value);
  }

  public subscribe(callback: (value: T) => void): ISubscription {
    const sub = super.subscribe(callback);
    this.sendLatest(callback);
    return sub;
  }

  public subscribeOnce(callback: (value: T) => void): ISubscription {
    const value = this.getValue();
    if (value !== undefined) {
      callback(value);
      return { unsubscribe: () => {} };
    }
    return super.subscribeOnce(callback);
  }

  private sendLatest(callback: (value: T) => void): void {
    const value = this.getValue();
    if (value !== undefined) {
      callback(value);
    }
  }
}
