import { BehaviorEventEmitter } from "./src/emitter/behavior-event-emitter";
import { EventEmitter } from "./src/emitter/event-emitter";
import { Observable } from "./src/emitter/common/observable";
import { IObservable, ISubscription, OperatorFunction } from "./src/common";
import { filter } from "./src/operator/filter";
import { map } from "./src/operator/map";
import { take } from "./src/operator/take";

export default { EventEmitter, BehaviorEventEmitter, Observable, filter, map, take };

export {
  EventEmitter,
  BehaviorEventEmitter,
  Observable,
  IObservable,
  ISubscription,
  OperatorFunction,
  filter,
  map,
  take,
};
