import { describe, it, expect, vi } from "vitest";
import { BehaviorEventEmitter } from "../index";

describe("BehaviorEventEmitter", () => {
  it("should immediately emit last value on subscribe", () => {
    const emitter = new BehaviorEventEmitter<number>(42);
    const callback = vi.fn();

    emitter.subscribe(callback);

    expect(callback).toHaveBeenCalledWith(42);
  });

  it("should emit new values to subscribers", () => {
    const emitter = new BehaviorEventEmitter<string>("init");
    const callback = vi.fn();

    emitter.subscribe(callback);
    emitter.emit("new");

    expect(callback).toHaveBeenCalledWith("new");
  });

  it("should call subscribeOnce immediately if value is present", () => {
    const emitter = new BehaviorEventEmitter<boolean>(true);
    const callback = vi.fn();

    emitter.subscribeOnce(callback);

    expect(callback).toHaveBeenCalledWith(true);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
