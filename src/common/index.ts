import { Observable } from "emitter/common/observer";

export interface ISubscription {
  unsubscribe(): void;
}

export interface IObservable<T> {
  subscribe(callback: (value: T) => void): ISubscription;
  subscribeOnce(callback: (value: T) => void): ISubscription;
  pipe<R>(op1?: Operator<T, R>): Observable<R>;
 }

export type Operator<T, R> = (source: IObservable<T>) => IObservable<R>;