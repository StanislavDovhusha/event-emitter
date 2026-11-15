import { describe, it, expect, vi } from "vitest";
import { EventEmitter, BehaviorEventEmitter, map, filter, take } from "../index";

describe("map", () => {
  it("should transform each value", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(map((v) => v * 2)).subscribe(callback);
    [1, 2, 3].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[2], [4], [6]]);
  });

  it("should transform between different types", () => {
    const emitter = new EventEmitter<{ id: number; name: string }>();
    const names = vi.fn<(value: string) => void>();
    const lengths = vi.fn<(value: number) => void>();

    const stream = emitter.asObservable().pipe(map((user) => user.name));
    stream.subscribe(names);
    stream.pipe(map((name) => name.length)).subscribe(lengths);

    emitter.emit({ id: 1, name: "Ann" });
    emitter.emit({ id: 2, name: "Bob Marley" });

    expect(names.mock.calls).toEqual([["Ann"], ["Bob Marley"]]);
    expect(lengths.mock.calls).toEqual([[3], [10]]);
  });

  it("should provide a per-subscription zero-based index", () => {
    const emitter = new EventEmitter<string>();
    const stream = emitter.asObservable().pipe(map((v, i) => v + i));
    const first = vi.fn();
    const second = vi.fn();

    stream.subscribe(first);
    emitter.emit("a");
    stream.subscribe(second);
    emitter.emit("b");

    expect(first.mock.calls).toEqual([["a0"], ["b1"]]);
    expect(second.mock.calls).toEqual([["b0"]]);
  });

  it("should work in operator chains", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter
      .asObservable()
      .pipe(
        map((v) => v + 1),
        map((v) => String(v)),
        filter((v) => v !== "3"),
        take(2)
      )
      .subscribe(callback);
    [1, 2, 3, 4].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([["2"], ["4"]]);
  });

  it("should transform the initial value of a BehaviorEventEmitter", () => {
    const emitter = new BehaviorEventEmitter<number>(21);
    const callback = vi.fn();

    emitter.asObservable().pipe(map((v) => v * 2)).subscribe(callback);
    expect(callback).toHaveBeenCalledWith(42);
  });

  it("should propagate projection errors to emit() and not call the subscriber for that value", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();
    const error = new Error("project failed");

    emitter
      .asObservable()
      .pipe(
        map((v) => {
          if (v === 2) throw error;
          return v * 10;
        })
      )
      .subscribe(callback);

    emitter.emit(1);
    expect(() => emitter.emit(2)).toThrow(error);
    emitter.emit(3);

    expect(callback.mock.calls).toEqual([[10], [30]]);
  });

  it("should release the source on unsubscribe", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    const sub = emitter.asObservable().pipe(map((v) => v)).subscribe(callback);
    sub.unsubscribe();
    emitter.emit(1);

    expect(callback).not.toHaveBeenCalled();
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should throw a TypeError when project is not a function", () => {
    expect(() => map(null as any)).toThrow(TypeError);
  });
});
