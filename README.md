# Eonemitter

A minimal, fully-typed, and reactive event emitter for TypeScript and JavaScript.

This lightweight utility provides a simple yet powerful mechanism for handling events in a reactive style. It offers a fully type-safe API, supports multiple listeners, and integrates cleanly with observable patterns without any external dependencies.

## ✅ Features

- ✅ `EventEmitter` – basic event system for emitting and listening to events
- ✅ `BehaviorEventEmitter` – like `BehaviorSubject`,  emits the last value to new subscribers 
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
const behaviorEmitter = new BehaviorEventEmitter<number>();

const subscription2 = behaviorEmitter.subscribe((value) => {
  console.log(value); // Logs: 777 repeatedly
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

## 📚 API

### EventEmitter

EventEmitter - a generic event emitter that allows subscribing to and emitting events of type T. Supports multiple subscribers and provides control over subscription lifecycles.

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Subscribes to all future events

subscribeOnce(callback: (value: T) => void): ISubscription
// Subscribes to only the next event, then automatically unsubscribes

asObservable(): IObservable<T> 
// Returns a read-only observable interface to this emitter.

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
// Subscribes to the next emitted event only, then automatically unsubscribes.
```

### ISubscription 

ISubscription - represents a subscription to an event stream. Used to manually unsubscribe when needed.

```typeScript
  unsubscribe(): void; 
  // Cancels the subscription.
```