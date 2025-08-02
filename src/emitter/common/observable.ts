import {
  IObservable,
  ISubscriber,
  ISubscription,
  OperatorFunction,
} from "common";
import { Emitter } from "emitter/emitter";

export class Observable<T> implements IObservable<T> {
  private source: Emitter<T>;

  constructor(source: Emitter<T>) {
    this.source = source;
  }

  public subscribe(callback: (value: T) => void): ISubscription {
    return this.source.subscribe(callback);
  }

  public subscribeOnce(callback: (value: T) => void): ISubscription {
    return this.source.subscribeOnce(callback);
  }

 public pipe<T,R>(operator: OperatorFunction<T,R>): IObservable<R> {
    return operator(this.source);

    // return this.source.pipe(operator);
  }

 
}
