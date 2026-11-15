import { describe, it, expect, vi, afterEach } from "vitest";
import { EventEmitter, BehaviorEventEmitter, take } from "../index";

describe("take", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("take(1) should deliver only the first value", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(take(1)).subscribe(callback);
    [1, 2, 3].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[1]]);
  });

  it("should deliver the first N values", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(take(3)).subscribe(callback);
    [1, 2, 3, 4, 5].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[1], [2], [3]]);
  });

  it("should deliver all values when fewer than count are emitted and stay subscribed", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(take(5)).subscribe(callback);
    emitter.emit(1);
    emitter.emit(2);

    expect(callback.mock.calls).toEqual([[1], [2]]);
    expect(emitter.hasSubscribers()).toBe(true);
  });

  it("take(0) should never call the subscriber nor subscribe to the source", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    const sub = emitter.asObservable().pipe(take(0)).subscribe(callback);
    expect(emitter.hasSubscribers()).toBe(false);
    emitter.emit(1);

    expect(callback).not.toHaveBeenCalled();
    expect(() => sub.unsubscribe()).not.toThrow();
  });

  it("take(0) should not even receive the current value of a BehaviorEventEmitter", () => {
    const emitter = new BehaviorEventEmitter<number>(1);
    const callback = vi.fn();

    emitter.asObservable().pipe(take(0)).subscribe(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("negative count should behave like take(0)", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(take(-3)).subscribe(callback);
    emitter.emit(1);

    expect(callback).not.toHaveBeenCalled();
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should round non-integer counts down", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(take(2.7)).subscribe(callback);
    [1, 2, 3].forEach((v) => emitter.emit(v));

    expect(callback.mock.calls).toEqual([[1], [2]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("take(Infinity) should never complete", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    emitter.asObservable().pipe(take(Infinity)).subscribe(callback);
    for (let i = 0; i < 100; i++) emitter.emit(i);

    expect(callback).toHaveBeenCalledTimes(100);
    expect(emitter.hasSubscribers()).toBe(true);
  });

  it.each([NaN, "2", undefined, null, {}])(
    "should throw a TypeError for invalid count %s",
    (count) => {
      expect(() => take(count as any)).toThrow(TypeError);
    }
  );

  it("should automatically unsubscribe from the source after the limit", () => {
    const emitter = new EventEmitter<number>();

    emitter.asObservable().pipe(take(2)).subscribe(() => {});
    expect(emitter.hasSubscribers()).toBe(true);
    emitter.emit(1);
    expect(emitter.hasSubscribers()).toBe(true);
    emitter.emit(2);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should only remove its own observer, leaving other subscribers intact", () => {
    const emitter = new EventEmitter<number>();
    const other = vi.fn();
    const limited = vi.fn();

    emitter.subscribe(other);
    emitter.asObservable().pipe(take(1)).subscribe(limited);
    [1, 2].forEach((v) => emitter.emit(v));

    expect(limited.mock.calls).toEqual([[1]]);
    expect(other.mock.calls).toEqual([[1], [2]]);
    expect(emitter.hasSubscribers()).toBe(true);
  });

  it("should not deliver values on re-entrant emits after completion", () => {
    const emitter = new EventEmitter<number>();
    const received: number[] = [];

    emitter
      .asObservable()
      .pipe(take(2))
      .subscribe((v) => {
        received.push(v);
        if (v < 10) emitter.emit(v + 10);
      });
    emitter.emit(1);
    emitter.emit(2);

    expect(received).toEqual([1, 11]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("should release the source even if the subscriber throws on the last value", () => {
    const emitter = new EventEmitter<number>();
    const error = new Error("boom");

    emitter
      .asObservable()
      .pipe(take(1))
      .subscribe(() => {
        throw error;
      });

    expect(() => emitter.emit(1)).toThrow(error);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("manual unsubscribe before the limit should release the source; repeated unsubscribe is safe", () => {
    const emitter = new EventEmitter<number>();
    const callback = vi.fn();

    const sub = emitter.asObservable().pipe(take(3)).subscribe(callback);
    emitter.emit(1);
    sub.unsubscribe();
    sub.unsubscribe();
    emitter.emit(2);

    expect(callback.mock.calls).toEqual([[1]]);
    expect(emitter.hasSubscribers()).toBe(false);
  });

  it("unsubscribe after completion should be a no-op", () => {
    const emitter = new EventEmitter<number>();
    const other = vi.fn();

    const sub = emitter.asObservable().pipe(take(1)).subscribe(() => {});
    emitter.emit(1);
    emitter.subscribe(other);
    sub.unsubscribe();
    emitter.emit(2);

    expect(other).toHaveBeenCalledWith(2);
  });

  it("each subscription to a take() stream should have its own counter", () => {
    const emitter = new EventEmitter<number>();
    const stream = emitter.asObservable().pipe(take(1));
    const first = vi.fn();
    const second = vi.fn();

    stream.subscribe(first);
    emitter.emit(1);
    stream.subscribe(second);
    emitter.emit(2);

    expect(first.mock.calls).toEqual([[1]]);
    expect(second.mock.calls).toEqual([[2]]);
  });

  describe("with a synchronous source (BehaviorEventEmitter)", () => {
    it("take(1) should deliver the current value and release the source immediately", () => {
      const emitter = new BehaviorEventEmitter<number>(1);
      const callback = vi.fn();

      emitter.asObservable().pipe(take(1)).subscribe(callback);
      expect(callback.mock.calls).toEqual([[1]]);
      expect(emitter.hasSubscribers()).toBe(false);

      emitter.emit(2);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("take(2) should count the current value and the next emitted one", () => {
      const emitter = new BehaviorEventEmitter<number>(1);
      const callback = vi.fn();

      emitter.asObservable().pipe(take(2)).subscribe(callback);
      [2, 3].forEach((v) => emitter.emit(v));

      expect(callback.mock.calls).toEqual([[1], [2]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("should wait for the next value when the current value is undefined", () => {
      const emitter = new BehaviorEventEmitter<number | undefined>(undefined);
      const callback = vi.fn();

      emitter.asObservable().pipe(take(1)).subscribe(callback);
      expect(callback).not.toHaveBeenCalled();

      emitter.emit(5);
      expect(callback.mock.calls).toEqual([[5]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });
  });

  describe("with an asynchronous source", () => {
    it("should complete after N asynchronous emits", async () => {
      vi.useFakeTimers();
      const emitter = new EventEmitter<number>();
      const callback = vi.fn();
      let i = 0;
      const timer = setInterval(() => emitter.emit(++i), 10);

      emitter.asObservable().pipe(take(3)).subscribe(callback);
      await vi.advanceTimersByTimeAsync(100);
      clearInterval(timer);

      expect(callback.mock.calls).toEqual([[1], [2], [3]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("should work with promise-driven emits", async () => {
      const emitter = new EventEmitter<string>();
      const callback = vi.fn();

      emitter.asObservable().pipe(take(2)).subscribe(callback);
      for (const v of ["a", "b", "c"]) {
        await Promise.resolve();
        emitter.emit(v);
      }

      expect(callback.mock.calls).toEqual([["a"], ["b"]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });
  });
});
