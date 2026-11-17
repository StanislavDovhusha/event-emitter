**English** | [Русский](https://github.com/StanislavDovhusha/event-emitter/blob/main/README.ru.md) | [Українська](https://github.com/StanislavDovhusha/event-emitter/blob/main/README.uk.md)

# Eonemitter

A minimal, fully-typed, and reactive event emitter for TypeScript and JavaScript.

This lightweight utility provides a simple yet powerful mechanism for handling events in a reactive style. It offers a fully type-safe API, supports multiple listeners, and integrates cleanly with observable patterns without any external dependencies.

## ✅ Features

- ✅ `EventEmitter` – basic event system for emitting and listening to events
- ✅ `BehaviorEventEmitter` – like `BehaviorSubject`,  emits the last value to new subscribers 
- ✅ RxJS-like operators – `filter`, `map`, `take`, `takeWhile` via `pipe()`
- ✅ Fully typed and lightweight

## 📦 Installation

```bash
npm install eonemitter
```

## 🚀 Quick Start

### ES Modules

```typeScript
import { EventEmitter, BehaviorEventEmitter } from 'eonemitter';

// Basic EventEmitter
const emitter = new EventEmitter<string>();

const subscription = emitter.subscribe((value) => {
  console.log(value); // Logs: 'Hello!'
});

emitter.emit('Hello!');
subscription.unsubscribe();

// BehaviorEventEmitter emits the latest value to new subscribers
const behaviorEmitter = new BehaviorEventEmitter<number>(0);

const subscription2 = behaviorEmitter.subscribe((value) => {
  console.log(value); // Logs: 0 immediately, then 777 repeatedly
});

setInterval(() => behaviorEmitter.emit(777), 100);
setTimeout(() => subscription2.unsubscribe(), 500);

```

### CommonJS

```typeScript
const { EventEmitter } = require('eonemitter');

const emitter = new EventEmitter<string>();
emitter.subscribe((value) => {
  console.log(value);
});

emitter.emit('Hi from CommonJS!');

```

### Operators

`asObservable()` returns an `Observable`. Operators are applied with `pipe()`:

```typeScript
import { EventEmitter, filter, map, take } from 'eonemitter';

const emitter = new EventEmitter<number>();

emitter
  .asObservable()
  .pipe(
    filter((value) => value > 5),
    map((value) => value * 2),
    take(3)
  )
  .subscribe((value) => console.log(value));

[1, 6, 2, 7, 8, 9].forEach((v) => emitter.emit(v)); // Logs: 12, 14, 16
```

### Migrating from `subscribeOnce`

`subscribeOnce` is **deprecated** (it still works exactly as before). Use `take(1)` instead:

```typeScript
// Before
emitter.subscribeOnce((value) => console.log(value));

// After
emitter.asObservable().pipe(take(1)).subscribe((value) => console.log(value));
```

## 📚 API

### EventEmitter

EventEmitter - a generic event emitter that allows subscribing to and emitting events of type T. Supports multiple subscribers and provides control over subscription lifecycles.

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Subscribes to all future events

subscribeOnce(callback: (value: T) => void): ISubscription
// @deprecated – use asObservable().pipe(take(1)).subscribe(callback) instead.
// Subscribes to only the next event, then automatically unsubscribes

asObservable(): Observable<T>
// Returns a read-only Observable (an IObservable<T>) that supports operators.

hasSubscribers(): boolean
// Returns true if there are any active subscribers.

emit(value: T): void
// Emits a new event to all current subscribers

unsubscribeAll(): void
// Removes all active subscribers

```
### BehaviorEventEmitter

BehaviorEventEmitter - extends EventEmitter by storing the most recent value. New subscribers will immediately receive the last emitted value upon subscribing.

```typeScript
getValue(): T
// Returns the most recently emitted value.

``` 

### IObservable 

IObservable - exposes a interface for subscribing to events 

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Subscribes to all future events.

subscribeOnce(callback: (value: T) => void): ISubscription
// @deprecated – use take(1) instead.
// Subscribes to the next emitted event only, then automatically unsubscribes.
```

### Observable

Observable - implements `IObservable<T>` and adds `pipe()`. Returned by `asObservable()` and by `pipe()` itself, so pipes can be chained.

```typeScript
pipe(...operators: OperatorFunction[]): Observable<R>
// Applies operators left to right and returns the resulting stream.
```

### Operators reference

```typeScript
filter(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>
// Emits only values for which predicate returns true.

map(project: (value: T, index: number) => R): OperatorFunction<T, R>
// Emits project(value) for each value.

take(count: number): OperatorFunction<T, T>
// Emits at most `count` values, then automatically unsubscribes from the source.
// take(0) and negative counts emit nothing; non-integer counts are rounded down;
// a non-number or NaN count throws a TypeError.

takeWhile(predicate: (value: T, index: number) => boolean, inclusive?: boolean): OperatorFunction<T, T>
// Emits values while predicate returns true. On the first value for which it returns false,
// automatically unsubscribes from the source. That value is not emitted unless inclusive is true.
```

```typeScript
emitter
  .asObservable()
  .pipe(takeWhile((value) => value < 3))
  .subscribe((value) => console.log(value));

[1, 2, 3, 1].forEach((v) => emitter.emit(v)); // Logs: 1, 2
```

- `index` is the zero-based position of the source value, counted per subscription.
- Errors thrown by `predicate` / `project` propagate to the caller of `emit()`, exactly like errors thrown by a regular subscriber.
- Each `subscribe()` on a derived stream creates exactly one subscription on the source emitter; unsubscribing (or `take` / `takeWhile` completing) removes it.

### ISubscription 

ISubscription - represents a subscription to an event stream. Used to manually unsubscribe when needed.

```typeScript
  unsubscribe(): void; 
  // Cancels the subscription.
```