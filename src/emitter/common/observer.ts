import { IObservable, ISubscription, Operator } from "../../common";

export class Observable<T> implements IObservable<T> {
  operators: Operator<any, any> [] = [];

  constructor(private source: Observable<any>) {}

  subscribe(callback: (value: T) => void): ISubscription {
    return this.source.subscribe(callback);
  }

  subscribeOnce(callback: (value: T) => void): ISubscription {
    return this.source.subscribeOnce(callback);
  }

  pipe<R>(...operators: Operator<any, any>[]): Observable<R> {
    this.operators = operators;

    return operators.reduce((prev, op) => {
      if (op) {
        return new Observable<R>(op(prev) as any);
      } else {
        return prev;
      }
    }, this as any);
  }

  lift<R>(operators?: Operator<T, R>[]): IObservable<R> {
    const observable = new Observable<R>({} as any);
    observable.source = this;
    observable.operators = operators || [];
    return observable;
  }
}
