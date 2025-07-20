# Event Emitter

Minimal, type-safe, reactive event emitter for TypeScript and JavaScript.

## Features

- ✅ `EventEmitter` – basic event system
- ✅ `BehaviorEventEmitter` – like `BehaviorSubject`, emits last value to new subscribers
- ✅ `subscribe`, `subscribeOnce`, `unsubscribe`
- ✅ Fully typed and lightweight

## Installation

```bash
npm install eonemitter
```

## Usage
```typeScript
import { EventEmitter, BehaviorEventEmitter } from 'eonemitter';

const emitter = new EventEmitter<string>();
const sub = emitter.subscribe(value => console.log(value));

emitter.emit('Hello!');
sub.unsubscribe();
```

## API

```typeScript
subscribe(callback)
subscribeOnce(callback)
emit(value)
removeAll()
getValue() (only in BehaviorEventEmitter)
```