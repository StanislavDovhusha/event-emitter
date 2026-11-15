/**
 * Backward-compatibility tests: the 1.0.3 public API must keep working
 * exactly as before. `subscribeOnce` is deprecated but must be unchanged.
 */
import { describe, it, expect, vi } from "vitest";
import EonDefault, {
  EventEmitter,
  BehaviorEventEmitter,
  IObservable,
  filter,
  map,
  take,
} from "../index";

describe("backward compatibility (1.0.3 API)", () => {
  describe("subscribeOnce (deprecated) keeps its behavior", () => {
    it("EventEmitter: receives only the next value and unsubscribes", () => {
      const emitter = new EventEmitter<number>();
      const callback = vi.fn();

      emitter.subscribeOnce(callback);
      expect(emitter.hasSubscribers()).toBe(true);
      [1, 2].forEach((v) => emitter.emit(v));

      expect(callback.mock.calls).toEqual([[1]]);
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("EventEmitter: can be cancelled before the first value", () => {
      const emitter = new EventEmitter<number>();
      const callback = vi.fn();

      emitter.subscribeOnce(callback).unsubscribe();
      emitter.emit(1);

      expect(callback).not.toHaveBeenCalled();
    });

    it("EventEmitter: keeps the observer if the callback throws (unchanged semantics)", () => {
      const emitter = new EventEmitter<number>();
      const callback = vi.fn(() => {
        throw new Error("boom");
      });

      emitter.subscribeOnce(callback);
      expect(() => emitter.emit(1)).toThrow("boom");
      expect(emitter.hasSubscribers()).toBe(true);
    });

    it("BehaviorEventEmitter: delivers the current value synchronously and registers nothing", () => {
      const emitter = new BehaviorEventEmitter<number>(7);
      const callback = vi.fn();

      const sub = emitter.subscribeOnce(callback);
      expect(callback.mock.calls).toEqual([[7]]);
      expect(emitter.hasSubscribers()).toBe(false);
      expect(() => sub.unsubscribe()).not.toThrow();
    });

    it("BehaviorEventEmitter: waits for the next value when current value is undefined", () => {
      const emitter = new BehaviorEventEmitter<number | undefined>(undefined);
      const callback = vi.fn();

      emitter.subscribeOnce(callback);
      [1, 2].forEach((v) => emitter.emit(v));

      expect(callback.mock.calls).toEqual([[1]]);
    });

    it("asObservable().subscribeOnce delegates to the emitter's subscribeOnce", () => {
      const emitter = new BehaviorEventEmitter<number>(3);
      const spy = vi.spyOn(emitter, "subscribeOnce");
      const callback = vi.fn();

      emitter.asObservable().subscribeOnce(callback);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls).toEqual([[3]]);
    });
  });

  describe("take(1) is an equivalent replacement for subscribeOnce", () => {
    const scenarios: Array<[string, () => EventEmitter<number> | BehaviorEventEmitter<number>, number[]]> = [
      ["EventEmitter", () => new EventEmitter<number>(), [1, 2, 3]],
      ["BehaviorEventEmitter", () => new BehaviorEventEmitter<number>(0), [1, 2, 3]],
    ];

    it.each(scenarios)("%s", (_, create, values) => {
      const a = create();
      const b = create();
      const once = vi.fn();
      const taken = vi.fn();

      a.subscribeOnce(once);
      b.asObservable().pipe(take(1)).subscribe(taken);
      values.forEach((v) => {
        a.emit(v);
        b.emit(v);
      });

      expect(taken.mock.calls).toEqual(once.mock.calls);
      expect(b.hasSubscribers()).toBe(a.hasSubscribers());
    });
  });

  describe("asObservable()", () => {
    it("exposes subscribe/subscribeOnce as own properties", () => {
      const obs = new EventEmitter<number>().asObservable();
      expect(Object.keys(obs).sort()).toEqual(["subscribe", "subscribeOnce"]);
    });

    it("methods stay bound when destructured", () => {
      const emitter = new EventEmitter<number>();
      const { subscribe, subscribeOnce } = emitter.asObservable();
      const a = vi.fn();
      const b = vi.fn();

      subscribe(a);
      subscribeOnce(b);
      [1, 2].forEach((v) => emitter.emit(v));

      expect(a.mock.calls).toEqual([[1], [2]]);
      expect(b.mock.calls).toEqual([[1]]);
    });

    it("works when spread into a plain object", () => {
      const emitter = new EventEmitter<number>();
      const plain: IObservable<number> = { ...emitter.asObservable() };
      const callback = vi.fn();

      plain.subscribe(callback);
      emitter.emit(1);

      expect(callback).toHaveBeenCalledWith(1);
    });

    it("does not expose emit()", () => {
      const obs = new EventEmitter<number>().asObservable() as any;
      expect(obs.emit).toBeUndefined();
    });
  });

  describe("emitter semantics are unchanged", () => {
    it("subscribers are called in subscription order, mixed with operator subscribers", () => {
      const emitter = new EventEmitter<number>();
      const log: string[] = [];

      emitter.subscribe(() => log.push("a"));
      emitter.asObservable().pipe(map((v) => v)).subscribe(() => log.push("b"));
      emitter.subscribeOnce(() => log.push("c"));
      emitter.asObservable().pipe(take(1)).subscribe(() => log.push("d"));
      emitter.subscribe(() => log.push("e"));
      emitter.emit(1);

      expect(log).toEqual(["a", "b", "c", "d", "e"]);
    });

    it("a throwing subscriber propagates from emit() and stops later subscribers", () => {
      const emitter = new EventEmitter<number>();
      const later = vi.fn();

      emitter.subscribe(() => {
        throw new Error("first");
      });
      emitter.subscribe(later);

      expect(() => emitter.emit(1)).toThrow("first");
      expect(later).not.toHaveBeenCalled();
    });

    it("unsubscribeAll removes plain and operator subscriptions", () => {
      const emitter = new EventEmitter<number>();
      const a = vi.fn();
      const b = vi.fn();

      emitter.subscribe(a);
      emitter.asObservable().pipe(filter(() => true), take(5)).subscribe(b);
      emitter.unsubscribeAll();
      emitter.emit(1);

      expect(a).not.toHaveBeenCalled();
      expect(b).not.toHaveBeenCalled();
      expect(emitter.hasSubscribers()).toBe(false);
    });

    it("BehaviorEventEmitter.getValue/subscribe are unchanged", () => {
      const emitter = new BehaviorEventEmitter<string>("x");
      const callback = vi.fn();

      emitter.subscribe(callback);
      emitter.emit("y");

      expect(emitter.getValue()).toBe("y");
      expect(callback.mock.calls).toEqual([["x"], ["y"]]);
    });

    it("default export still contains EventEmitter and BehaviorEventEmitter", () => {
      expect(EonDefault.EventEmitter).toBe(EventEmitter);
      expect(EonDefault.BehaviorEventEmitter).toBe(BehaviorEventEmitter);
    });
  });
});
