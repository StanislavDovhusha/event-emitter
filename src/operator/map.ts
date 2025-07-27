import { IObservable, Operator } from "common";
import { Observable } from "../emitter/common/observer";

export function map<T, R>(project: (value: T) => R): Operator<T, R> {
  
  return (source: Observable<T>): IObservable<R> => {
    
  };
}
