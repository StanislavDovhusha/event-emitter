import { BehaviorEventEmitter } from "./src/emitter/behavior-event-emitter";
import { EventEmitter } from "./src/emitter/event-emitter";
import { IObservable, ISubscription } from "./src/common";
import { map } from "./src/operator/map";

export default { EventEmitter, BehaviorEventEmitter, map };

export { EventEmitter, BehaviorEventEmitter, IObservable, ISubscription, map };
