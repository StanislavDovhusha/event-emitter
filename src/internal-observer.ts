import { ISubscription } from "./common";

export class InternalObserver<T> {
  private readonly id: number;
  private readonly callback: (value: T) => void;
  private readonly onUnsubscribe: (id: number) => void;

  constructor(
    id: number,
    callback: (value: T) => void,
    onUnsubscribe: (id: number) => void
  ) {
    this.id = id;
    this.callback = callback;
    this.onUnsubscribe = onUnsubscribe;
  }

  public getId(): number {
    return this.id;
  }

  public execute(value: T) {
    this.callback(value);
  }

  public unsubscribe() {
    this.onUnsubscribe(this.id);
  }

  public toSubscription(): ISubscription {
    return {
      unsubscribe: () => this.unsubscribe(),
    };
  }
}
