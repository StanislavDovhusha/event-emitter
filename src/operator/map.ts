import { IObservable, OperatorFunction } from "common";
import { Observable } from "../emitter/common/observable";
import { Emitter } from "emitter/emitter";

export function map<T, R>(
  project: <T, R>(value: T, index: number) => R
): OperatorFunction<T, R> {
  let index = 0;

  const wrapper: OperatorFunction<T, R> = (
    source: Emitter<T>
  ): IObservable<R> => {
    return createNewObservable<T, R>(source, project, index);
  };

  return wrapper;
}

function createNewObservable<T, R>(
  source: Emitter<T>,
  project: (value: T, index: number) => R,
  index: number
): IObservable<R> {
  return new Observable<R>({
    subscribe(callback: (value: R) => void) {
      return source.subscribe((value: T) => callback(project(value, index++)));
    },
    subscribeOnce(callback: (value: R) => void) {
      return source.subscribeOnce((value: T) =>
        callback(project(value, index++))
      );
    },
  });
}

// export default function map<T, R>(
//   project: (value: T, index: number) => R
// ): OperatorFunction<T, R> {
//   let index = -1;

//   const wrapper: OperatorFunction<T, R> = (
//     source: IObservable<T>,
//     res
//   ): IObservable<R> => {
//     res = project as any;
//     return new Observable<R>({
//       subscribe(callback: (value: R) => void) {
//         return source.subscribe((value: T) =>
//           callback(res(value, index++))
//         );
//       },
//       subscribeOnce(callback: (value: R) => void) {
//         return source.subscribeOnce((value: T) =>
//           callback(res(value, index++))
//         );
//       },
//       pipe(operator) {
//         return source.pipe(operator as any);
//       },
//     });
//   };

//   return wrapper;
// }
