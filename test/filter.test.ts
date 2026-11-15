import { describe, it, expect, vi } from "vitest";
import { EventEmitter, BehaviorEventEmitter, filter, map } from "../index";

describe("filter", () => {
  it("should pass values that match the predicate", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(filter((v) => v > 10)).subscribe(callback);
    emitter.emit(11);
    emitter.emit(20);

    expect(callback.mock.calls).toEqual([[11], [20]]);
  });

  it("should drop values that do not match the predicate", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(filter((v) => v > 10)).subscribe(callback);
    [1, 15, 5, 30, 10].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[15], [30]]);
  });

  it("should not call the subscriber when no value matches", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(filter(() => false)).subscribe(callback);
    [1, 2, 3].forEach((v) => emitter.emit(v));

    expect(callback).not.toHaveBeenCalled();
  });

  it("should pass every value when all match", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(filter(() => true)).subscribe(callback);
    [1, 2, 3].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[1], [2], [3]]);
  });

  it("should provide a per-subscription zero-based index", () => {
    const emitter = new EventEmitter<string>();
    const stream = emitter.asObservable().pipe(filter((_, i) => i % 2 === 0));
    const first = vi.fn();
    const second = vi.fn();

    stream.subscribe(first);
    ["a", "b", "c"].forEach((v) => emitter.emit(v));
    stream.subscribe(second);
    ["d", "e"].forEach((v) => emitter.emit(v));

    expect(first.mock.calls).toEqual([["a"], ["c"], ["e"]]);
    expect(second.mock.calls).toEqual([["d"]]);
  });

  it("should narrow types with a type-guard predicate", () => {
    const emitter = new EventEmitter<string | number>();
    const callback = vi.fn<(value: number) => void>();

    emitter
      .asObservable()
      .pipe(filter((v): v is number => typeof v === "number"))
      // `v` is narrowed to `number`: `toFixed` would not type-check otherwise.
      .subscribe((v) => callback(Number(v.toFixed(0))));
    emitter.emit("x");
    emitter.emit(7);

    expect(callback.mock.calls).toEqual([[7]]);
  });

  it("should work in operator chains", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter
      .asObservable()
      .pipe(
        filter((v) => v % 2 === 0),
        map((v) => v * 10),
        filter((v) => v > 20)
      )
      .subscribe(callback);
    [1, 2, 3, 4, 5, 6].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[40], [60]]);
  });

  it("should apply to the initial value of a BehaviorEventEmitter", () => {
    const emitter = new BehaviorEventEmitter<number>(1);
    const callback = vi.fn();

    emitter.asObservable().pipe(filter((v) => v > 0)).subscribe(callback);
    expect(callback).toHaveBeenCalledWith(1);
  });

  it("should propagate predicate errors to emit() like subscriber errors and stay subscribed", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();
    const error = new Error("predicate failed");

    emitter
      .asObservable()
      .pipe(
        filter((v) => {
          if (v === 2) throw error;
          return true;
        })
      )
      .subscribe(callback);

    emitter.emit(1);
    expect(() => emitter.emit(2)).toThrow(error);
    emitter.emit(3);

    expect(callback.mock.calls).toEqual([[1], [3]]);
  });

  it("should stop receiving values after unsubscribe and release the source", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    const sub = emitter.asObservable().pipe(filter(() => true)).subscribe(callback);
    expect(emitter.hasSubscribers()).toBe(true);

    sub.unsubscribe();
    emitter.emit(1);

    expect(callback).not.toHaveBeenCalled();
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("subscribeOnce on a filtered stream should wait for the first matching value", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(filter((v) => v > 5)).subscribeOnce(callback);
    [1, 6, 7].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[6]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should throw a TypeError when predicate is not a function", () => {
    expect(() => filter(undefined as any)).toThrow(TypeError);
  });
});
