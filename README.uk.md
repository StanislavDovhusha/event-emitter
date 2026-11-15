[English](README.md) | [Русский](README.ru.md) | **Українська**

# Eonemitter

Мінімалістичний, повністю типізований реактивний емітер подій для TypeScript і JavaScript.

Ця легка утиліта надає простий, але потужний механізм обробки подій у реактивному стилі. Вона пропонує повністю типобезпечний API, підтримує кількох підписників і добре поєднується з патерном Observable, не потребуючи зовнішніх залежностей.

## ✅ Можливості

- ✅ `EventEmitter` – базова система для надсилання та прослуховування подій
- ✅ `BehaviorEventEmitter` – аналог `BehaviorSubject`, віддає останнє значення новим підписникам
- ✅ Оператори в стилі RxJS – `filter`, `map`, `take` через `pipe()`
- ✅ Повна типізація та малий розмір

## 📦 Встановлення

```bash
npm install eonemitter
```

## 🚀 Швидкий старт

### ES-модулі

```typeScript
import { EventEmitter, BehaviorEventEmitter } from 'eonemitter';

// Базовий EventEmitter
const emitter = new EventEmitter<string>();

const subscription = emitter.subscribe((value) => {
  console.log(value); // Виведе: 'Hello!'
});

emitter.emit('Hello!');
subscription.unsubscribe();

// BehaviorEventEmitter віддає останнє значення новим підписникам
const behaviorEmitter = new BehaviorEventEmitter<number>(0);

const subscription2 = behaviorEmitter.subscribe((value) => {
  console.log(value); // Одразу виведе 0, потім 777 багаторазово
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

### Оператори

`asObservable()` повертає `Observable`. Оператори застосовуються через `pipe()`:

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

[1, 6, 2, 7, 8, 9].forEach((v) => emitter.emit(v)); // Виведе: 12, 14, 16
```

### Перехід із `subscribeOnce`

`subscribeOnce` **застарів** (deprecated), але продовжує працювати точно так само, як раніше. Замість нього використовуйте `take(1)`:

```typeScript
// Було
emitter.subscribeOnce((value) => console.log(value));

// Стало
emitter.asObservable().pipe(take(1)).subscribe((value) => console.log(value));
```

## 📚 API

### EventEmitter

EventEmitter – узагальнений емітер подій, що дозволяє підписуватися на події типу T та надсилати їх. Підтримує кількох підписників і дає контроль над життєвим циклом підписок.

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Підписується на всі майбутні події

subscribeOnce(callback: (value: T) => void): ISubscription
// @deprecated – використовуйте asObservable().pipe(take(1)).subscribe(callback).
// Підписується лише на наступну подію, після чого автоматично відписується

asObservable(): Observable<T>
// Повертає Observable лише для читання (це IObservable<T>) з підтримкою операторів.

hasSubscribers(): boolean
// Повертає true, якщо є активні підписники.

emit(value: T): void
// Надсилає нову подію всім поточним підписникам

unsubscribeAll(): void
// Видаляє всіх активних підписників

```
### BehaviorEventEmitter

BehaviorEventEmitter – розширює EventEmitter, зберігаючи останнє значення. Нові підписники одразу під час підписки отримують останнє надіслане значення.

```typeScript
getValue(): T
// Повертає останнє надіслане значення.

```

### IObservable

IObservable – інтерфейс для підписки на події.

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Підписується на всі майбутні події.

subscribeOnce(callback: (value: T) => void): ISubscription
// @deprecated – використовуйте take(1).
// Підписується лише на наступну подію, після чого автоматично відписується.
```

### Observable

Observable – реалізує `IObservable<T>` і додає `pipe()`. Його повертають `asObservable()` і сам `pipe()`, тому виклики `pipe()` можна об'єднувати в ланцюжки.

```typeScript
pipe(...operators: OperatorFunction[]): Observable<R>
// Застосовує оператори зліва направо й повертає підсумковий потік.
```

### Довідник операторів

```typeScript
filter(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>
// Пропускає лише значення, для яких predicate повернув true.

map(project: (value: T, index: number) => R): OperatorFunction<T, R>
// Для кожного значення віддає project(value).

take(count: number): OperatorFunction<T, T>
// Віддає не більше `count` значень, потім автоматично відписується від джерела.
// take(0) і від'ємні значення нічого не віддають; дробові значення округлюються вниз;
// не число або NaN спричиняє TypeError.
```

- `index` – порядковий номер значення джерела, починаючи з нуля; рахується окремо для кожної підписки.
- Помилки, викинуті в `predicate` / `project`, прокидаються у виклик `emit()` — так само, як помилки звичайного підписника.
- Кожен виклик `subscribe()` у похідного потоку створює рівно одну підписку на вихідному емітері; відписка (або завершення `take`) видаляє її.

### ISubscription

ISubscription – підписка на потік подій. Використовується, щоб відписатися вручну, коли це потрібно.

```typeScript
  unsubscribe(): void;
  // Скасовує підписку.
```
