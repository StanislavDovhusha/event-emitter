# Event Emitter

A minimal, fully-typed, and reactive event emitter for TypeScript and JavaScript.

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

## API

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Subscribes to all future events

subscribeOnce(callback: (value: T) => void): ISubscription
// Subscribes to only the next event, then automatically unsubscribes

emit(value: T): void
// Emits a new event to all current subscribers

unsubscribeAll(): void
// Removes all active subscribers

getValue(): T
// (Only available in BehaviorEventEmitter) Returns the most recent emitted value

```