[English](README.md) | **Русский** | [Українська](README.uk.md)

# Eonemitter

Минималистичный, полностью типизированный реактивный эмиттер событий для TypeScript и JavaScript.

Эта лёгкая утилита предоставляет простой, но мощный механизм обработки событий в реактивном стиле. Она предлагает полностью типобезопасный API, поддерживает несколько подписчиков и хорошо сочетается с паттерном Observable, не требуя внешних зависимостей.

## ✅ Возможности

- ✅ `EventEmitter` – базовая система для отправки и прослушивания событий
- ✅ `BehaviorEventEmitter` – аналог `BehaviorSubject`, отдаёт последнее значение новым подписчикам
- ✅ Операторы в стиле RxJS – `filter`, `map`, `take`, `takeWhile` через `pipe()`
- ✅ Полная типизация и малый размер

## 📦 Установка

```bash
npm install eonemitter
```

## 🚀 Быстрый старт

### ES-модули

```typeScript
import { EventEmitter, BehaviorEventEmitter } from 'eonemitter';

// Базовый EventEmitter
const emitter = new EventEmitter<string>();

const subscription = emitter.subscribe((value) => {
  console.log(value); // Выведет: 'Hello!'
});

emitter.emit('Hello!');
subscription.unsubscribe();

// BehaviorEventEmitter отдаёт последнее значение новым подписчикам
const behaviorEmitter = new BehaviorEventEmitter<number>(0);

const subscription2 = behaviorEmitter.subscribe((value) => {
  console.log(value); // Сразу выведет 0, затем 777 многократно
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

### Операторы

`asObservable()` возвращает `Observable`. Операторы применяются через `pipe()`:

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

[1, 6, 2, 7, 8, 9].forEach((v) => emitter.emit(v)); // Выведет: 12, 14, 16
```

### Переход с `subscribeOnce`

`subscribeOnce` **устарел** (deprecated), но продолжает работать точно так же, как раньше. Вместо него используйте `take(1)`:

```typeScript
// Было
emitter.subscribeOnce((value) => console.log(value));

// Стало
emitter.asObservable().pipe(take(1)).subscribe((value) => console.log(value));
```

## 📚 API

### EventEmitter

EventEmitter – обобщённый эмиттер событий, позволяющий подписываться на события типа T и отправлять их. Поддерживает несколько подписчиков и даёт контроль над жизненным циклом подписок.

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Подписывается на все будущие события

subscribeOnce(callback: (value: T) => void): ISubscription
// @deprecated – используйте asObservable().pipe(take(1)).subscribe(callback).
// Подписывается только на следующее событие, после чего автоматически отписывается

asObservable(): Observable<T>
// Возвращает Observable только для чтения (это IObservable<T>) с поддержкой операторов.

hasSubscribers(): boolean
// Возвращает true, если есть активные подписчики.

emit(value: T): void
// Отправляет новое событие всем текущим подписчикам

unsubscribeAll(): void
// Удаляет всех активных подписчиков

```
### BehaviorEventEmitter

BehaviorEventEmitter – расширяет EventEmitter, сохраняя последнее значение. Новые подписчики сразу при подписке получают последнее отправленное значение.

```typeScript
getValue(): T
// Возвращает последнее отправленное значение.

```

### IObservable

IObservable – интерфейс для подписки на события.

```typeScript
subscribe(callback: (value: T) => void): ISubscription
// Подписывается на все будущие события.

subscribeOnce(callback: (value: T) => void): ISubscription
// @deprecated – используйте take(1).
// Подписывается только на следующее событие, после чего автоматически отписывается.
```

### Observable

Observable – реализует `IObservable<T>` и добавляет `pipe()`. Его возвращают `asObservable()` и сам `pipe()`, поэтому вызовы `pipe()` можно объединять в цепочки.

```typeScript
pipe(...operators: OperatorFunction[]): Observable<R>
// Применяет операторы слева направо и возвращает итоговый поток.
```

### Справочник операторов

```typeScript
filter(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>
// Пропускает только значения, для которых predicate вернул true.

map(project: (value: T, index: number) => R): OperatorFunction<T, R>
// Для каждого значения отдаёт project(value).

take(count: number): OperatorFunction<T, T>
// Отдаёт не более `count` значений, затем автоматически отписывается от источника.
// take(0) и отрицательные значения ничего не отдают; дробные значения округляются вниз;
// не число или NaN вызывает TypeError.

takeWhile(predicate: (value: T, index: number) => boolean, inclusive?: boolean): OperatorFunction<T, T>
// Отдаёт значения, пока predicate возвращает true. На первом значении, для которого он вернул false,
// автоматически отписывается от источника. Это значение отдаётся, только если inclusive равен true.
```

```typeScript
emitter
  .asObservable()
  .pipe(takeWhile((value) => value < 3))
  .subscribe((value) => console.log(value));

[1, 2, 3, 1].forEach((v) => emitter.emit(v)); // Выведет: 1, 2
```

- `index` – порядковый номер значения источника, начиная с нуля; считается отдельно для каждой подписки.
- Ошибки, выброшенные в `predicate` / `project`, пробрасываются в вызов `emit()` — так же, как ошибки обычного подписчика.
- Каждый вызов `subscribe()` у производного потока создаёт ровно одну подписку на исходном эмиттере; отписка (или завершение `take` / `takeWhile`) удаляет её.

### ISubscription

ISubscription – подписка на поток событий. Используется, чтобы отписаться вручную, когда это нужно.

```typeScript
  unsubscribe(): void;
  // Отменяет подписку.
```
