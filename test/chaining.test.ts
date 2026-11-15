import { describe, it, expect, vi } from "vitest";
import {
  EventEmitter,
  BehaviorEventEmitter,
  Observable,
  IObservable,
  OperatorFunction,
  filter,
  map,
  take,
} from "../index";

describe("operator chaining", () => {
  it("pipe: filter -> map -> take", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter
      .asObservable()
      .pipe(
        filter((v) => v > 5),
        map((v) => v * 2),
        take(3)
      )
      .subscribe(callback);
    [1, 6, 2, 7, 8, 9, 10].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[12], [14], [16]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should execute operators in declaration order", () => {
    const emitter = new EventEmitter<number>();
    const log: string[] = [];

    emitter
      .asObservable()
      .pipe(
        map((v) => {
          log.push(`map1(${v})`);
          return v + 1;
        }),
        filter((v) => {
          log.push(`filter(${v})`);
          return true;
        }),
        map((v) => {
          log.push(`map2(${v})`);
          return v * 10;
        })
      )
      .subscribe((v) => log.push(`sub(${v})`));
    emitter.emit(1);

    expect(log).toEqual(["map1(1)", "filter(2)", "map2(2)", "sub(20)"]);
  });

  it("take before filter counts source values, take after filter counts matching values", () => {
    const emitter = new EventEmitter<number>();
    const takeFirst = vi.fn();
    const filterFirst = vi.fn();

    emitter.asObservable().pipe(take(3), filter((v) => v % 2 === 0)).subscribe(takeFirst);
    emitter.asObservable().pipe(filter((v) => v % 2 === 0), take(3)).subscribe(filterFirst);
    [1, 2, 3, 4, 5, 6, 7, 8].forEach((v) => emitter.emit(v));

    expect(takeFirst.mock.calls).toEqual([[2]]);
    expect(filterFirst.mock.calls).toEqual([[2], [4], [6]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("completion of take releases the whole chain (single upstream observer)", () => {
    const emitter = new EventEmitter<number>();
    emitter.asObservable().pipe(map((v) => v), filter(() => true), map(String), take(1)).subscribe(() => {});

    expect(emitter.hasSubscribers()).toBe(true);
    emitter.emit(1);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("does not leak observers across many short-lived subscriptions", () => {
    const emitter = new EventEmitter<number>();
    const stream = emitter.asObservable().pipe(filter(() => true), map((v) => v), take(1));

    for (let i = 0; i < 1000; i++) stream.subscribe(() => {});
    emitter.emit(1);
    expect(emitter.hasSubscribers()).toBe(false);

    for (let i = 0; i < 1000; i++) stream.subscribe(() => {}).unsubscribe();
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("derived streams are reusable and independent", () => {
    const emitter = new EventEmitter<number>();
    const base = emitter.asObservable().pipe(filter((v) => v > 0));
    const doubled = vi.fn();
    const negated = vi.fn();

    base.pipe(map((v) => v * 2)).subscribe(doubled);
    base.pipe(map((v) => -v)).subscribe(negated);
    [0, 1, 2].forEach((v) => emitter.emit(v));

    expect(doubled.mock.calls).toEqual([[2], [4]]);
    expect(negated.mock.calls).toEqual([[-1], [-2]]);
  });

  it("works with BehaviorEventEmitter as a synchronous source", () => {
    const emitter = new BehaviorEventEmitter<number>(10);
    const callback = vi.fn();

    emitter.asObservable().pipe(filter((v) => v > 5), map((v) => v * 2), take(2)).subscribe(callback);
    [1, 20, 30].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[20], [40]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("accepts custom operators returning a plain IObservable", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    const double: OperatorFunction<number, number> = (source): IObservable<number> => ({
      subscribe: (cb) => source.subscribe((v) => cb(v * 2)),
      subscribeOnce: (cb) => source.subscribeOnce((v) => cb(v * 2)),
    });

    const result = emitter.asObservable().pipe(double, take(1));
    expect(result).toBeInstanceOf(Observable);
    result.subscribe(callback);
    [1, 2].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[2]]);
  });

  it("operator chains return Observable instances", () => {
    const emitter = new EventEmitter<number>();
    const stream = emitter.asObservable();

    expect(stream.pipe(filter(() => true))).toBeInstanceOf(Observable);
    expect(stream.pipe(map((v) => v))).toBeInstanceOf(Observable);
    expect(stream.pipe(take(1))).toBeInstanceOf(Observable);
  });

  it("operators are available only via pipe(), not as Observable methods", () => {
    const stream = new EventEmitter<number>().asObservable() as any;

    expect(stream.filter).toBeUndefined();
    expect(stream.map).toBeUndefined();
    expect(stream.take).toBeUndefined();
  });
});
