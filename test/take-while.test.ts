import { describe, it, expect, vi, afterEach } from "vitest";
import {
  EventEmitter,
  BehaviorEventEmitter,
  takeWhile,
  filter,
  map,
  take,
} from "../index";

describe("takeWhile", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should deliver values while the predicate holds", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(takeWhile((v) => v < 3)).subscribe(callback);
    [1, 2, 3, 1, 2].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[1], [2]]);
  });

  it("should not deliver the value that failed the predicate", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(takeWhile((v) => v > 0)).subscribe(callback);
    emitter.emit(5);
    emitter.emit(-1);

    expect(callback.mock.calls).toEqual([[5]]);
  });

  it("should deliver the failing value when inclusive is true", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(takeWhile((v) => v < 3, true)).subscribe(callback);
    [1, 2, 3, 4].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[1], [2], [3]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should complete on the first value when the predicate fails immediately", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(takeWhile(() => false)).subscribe(callback);
    expect(emitter.hasSubscribers()).toBe(true);
    emitter.emit(1);

    expect(callback).not.toHaveBeenCalled();
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should keep delivering while the predicate always holds", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(takeWhile(() => true)).subscribe(callback);
    for (let i = 0; i < 50; i++) emitter.emit(i);

    expect(callback).toHaveBeenCalledTimes(50);
    expect(emitter.hasSubscribers()).toBe(true);
  });

  it("should pass a per-subscription zero-based index", () => {
    const emitter = new EventEmitter<string>();
    const stream = emitter.asObservable().pipe(takeWhile((_, i) => i < 2));
    const first = vi.fn();
    const second = vi.fn();

    stream.subscribe(first);
    ["a", "b"].forEach((v) => emitter.emit(v));
    stream.subscribe(second);
    ["c", "d", "e"].forEach((v) => emitter.emit(v));

    expect(first.mock.calls).toEqual([["a"], ["b"]]);
    expect(second.mock.calls).toEqual([["c"], ["d"]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should narrow types with a type-guard predicate", () => {
    const emitter = new EventEmitter<string | number>();
    const callback = vi.fn<(value: number) => void>();

    emitter
      .asObservable()
      .pipe(takeWhile((v): v is number => typeof v === "number"))
      // `v` is narrowed to `number`: `toFixed` would not type-check otherwise.
      .subscribe((v) => callback(Number(v.toFixed(0))));
    [1, 2, "stop", 3].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[1], [2]]);
  });

  describe("unsubscription and resource release", () => {
    it("should automatically unsubscribe from the source when the predicate fails", () => {
      const emitter = new EventEmitter<number>();

      emitter.asObservable().pipe(takeWhile((v) => v < 2)).subscribe(() => {});
      emitter.emit(1);
      expect(emitter.hasSubscribers()).toBe(true);
      emitter.emit(2);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("should not call the predicate or subscriber after completion", () => {
      const emitter = new EventEmitter<number>();
      const predicate = vi.fn((v: number) => v < 2);
      const callback = vi.fn();

      emitter.asObservable().pipe(takeWhile(predicate)).subscribe(callback);
      [1, 2, 0, 1].forEach((v) => emitter.emit(v));

      expect(predicate).toHaveBeenCalledTimes(2);
      expect(callback.mock.calls).toEqual([[1]]);
    });

    it("should only remove its own observer", () => {
      const emitter = new EventEmitter<number>();
      const other = vi.fn();

      emitter.subscribe(other);
      emitter.asObservable().pipe(takeWhile(() => false)).subscribe(() => {});
      [1, 2].forEach((v) => emitter.emit(v));

      expect(other.mock.calls).toEqual([[1], [2]]);
      expect(emitter.hasSubscribers()).toBe(true);
    });

    it("should ignore re-entrant emits after completion", () => {
      const emitter = new EventEmitter<number>();
      const received: number[] = [];

      emitter
        .asObservable()
        .pipe(takeWhile((v) => v !== 0, true))
        .subscribe((v) => {
          received.push(v);
          if (v === 0) emitter.emit(1);
        });
      [5, 0, 7].forEach((v) => emitter.emit(v));

      expect(received).toEqual([5, 0]);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("should release the source even if the subscriber throws on the inclusive value", () => {
      const emitter = new EventEmitter<number>();

      emitter
        .asObservable()
        .pipe(takeWhile(() => false, true))
        .subscribe(() => {
          throw new Error("boom");
        });

      expect(() => emitter.emit(1)).toThrow("boom");
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("manual unsubscribe should release the source; repeated unsubscribe is safe", () => {
      const emitter = new EventEmitter<number>();
      const callback = vi.fn();

      const sub = emitter.asObservable().pipe(takeWhile(() => true)).subscribe(callback);
      emitter.emit(1);
      sub.unsubscribe();
      sub.unsubscribe();
      emitter.emit(2);

      expect(callback.mock.calls).toEqual([[1]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });
  });

  describe("errors", () => {
    it("should propagate predicate errors to emit() and stay subscribed", () => {
      const emitter = new EventEmitter<number>();
      const callback = vi.fn();
      const error = new Error("predicate failed");

      emitter
        .asObservable()
        .pipe(
          takeWhile((v) => {
            if (v === 2) throw error;
            return v < 10;
          })
        )
        .subscribe(callback);

      emitter.emit(1);
      expect(() => emitter.emit(2)).toThrow(error);
      emitter.emit(3);
      emitter.emit(10);
      emitter.emit(4);

      expect(callback.mock.calls).toEqual([[1], [3]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("should throw a TypeError when predicate is not a function", () => {
      expect(() => takeWhile(undefined as any)).toThrow(TypeError);
    });
  });

  describe("with a synchronous source (BehaviorEventEmitter)", () => {
    it("should release the source immediately when the current value fails", () => {
      const emitter = new BehaviorEventEmitter<number>(10);
      const callback = vi.fn();

      emitter.asObservable().pipe(takeWhile((v) => v < 5)).subscribe(callback);

      expect(callback).not.toHaveBeenCalled();
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("inclusive: should deliver the failing current value and release the source", () => {
      const emitter = new BehaviorEventEmitter<number>(10);
      const callback = vi.fn();

      emitter.asObservable().pipe(takeWhile((v) => v < 5, true)).subscribe(callback);
      emitter.emit(1);

      expect(callback.mock.calls).toEqual([[10]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("should continue with later values when the current value passes", () => {
      const emitter = new BehaviorEventEmitter<number>(1);
      const callback = vi.fn();

      emitter.asObservable().pipe(takeWhile((v) => v < 5)).subscribe(callback);
      [2, 5, 3].forEach((v) => emitter.emit(v));

      expect(callback.mock.calls).toEqual([[1], [2]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });
  });

  describe("with an asynchronous source", () => {
    it("should complete when the predicate fails on a timer-driven emit", async () => {
      vi.useFakeTimers();
      const emitter = new EventEmitter<number>();
      const callback = vi.fn();
      let i = 0;
      const timer = setInterval(() => emitter.emit(++i), 10);

      emitter.asObservable().pipe(takeWhile((v) => v <= 3)).subscribe(callback);
      await vi.advanceTimersByTimeAsync(100);
      clearInterval(timer);

      expect(callback.mock.calls).toEqual([[1], [2], [3]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });
  });

  describe("in operator chains", () => {
    it("should evaluate the predicate on values coming from previous operators", () => {
      const emitter = new EventEmitter<number>();
      const callback = vi.fn();

      emitter
        .asObservable()
        .pipe(
          filter((v) => v % 2 === 0),
          map((v) => v * 10),
          takeWhile((v) => v < 60)
        )
        .subscribe(callback);
      [1, 2, 3, 4, 5, 6, 7, 8].forEach((v) => emitter.emit(v));

      expect(callback.mock.calls).toEqual([[20], [40]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("whichever of take / takeWhile completes first ends the chain", () => {
      const emitter = new EventEmitter<number>();
      const byTake = vi.fn();
      const byWhile = vi.fn();

      emitter.asObservable().pipe(takeWhile((v) => v < 100), take(2)).subscribe(byTake);
      emitter.asObservable().pipe(take(10), takeWhile((v) => v < 2)).subscribe(byWhile);
      [1, 2, 3].forEach((v) => emitter.emit(v));

      expect(byTake.mock.calls).toEqual([[1], [2]]);
      expect(byWhile.mock.calls).toEqual([[1]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });
  });
});
