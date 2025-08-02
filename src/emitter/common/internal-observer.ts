import { ISubscription } from "../../common";

export class InternalObserver {
  private readonly id: number;
  private readonly callback: (value: any) => void;
  private readonly onUnsubscribe: (id: number) => void;

  constructor(
    id: number,
    callback: (value: any) => void,
    onUnsubscribe: (id: number) => void
  ) {
    this.id = id;
    this.callback = callback;
    this.onUnsubscribe = onUnsubscribe;
  }

  public getId(): number {
    return this.id;
  }

  public execute(value: any) {
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
