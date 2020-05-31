import { MetricObservable, Meter } from '@opentelemetry/metrics';
import { MetricOptions, Labels } from '@opentelemetry/api';

export abstract class MetricObservableSet<T = void> {
  private timer: ReturnType<typeof setInterval>;
  private onNext: {
    onNext: (T) => number;
    observable: MetricObservable;
  }[] = [];

  constructor(private meter: Meter, protected interval = 5000) {}

  protected createObservable(
    name: string,
    onNext: (T) => number,
    labels: Labels,
    options?: MetricOptions
  ) {
    this.meter.createObserver(name, options).setCallback(observerResult => {
      const observable = new MetricObservable();
      this.onNext.push({ onNext, observable });
      observerResult.observe(observable, labels);
    });
  }

  protected createObservables(
    name: string,
    onNexts: [Labels, (T) => number][],
    options?: MetricOptions
  ) {
    this.meter.createObserver(name, options).setCallback(observerResult => {
      onNexts.forEach(it => {
        const observable = new MetricObservable();
        this.onNext.push({ onNext: it[1], observable });
        observerResult.observe(observable, it[0]);
      });
    });
  }

  private next(value: T) {
    this.onNext.forEach(it => {
      const val = it.onNext(value);
      it.observable.next(val);
    });
  }

  subscribe(callback?: () => void) {
    this.onSubscribe();
    this.timer = setInterval(() => {
      Promise.resolve(this.getValue()).then(val => this.next(val));
      callback?.();
    }, this.interval);
    this.timer.unref();
  }

  abstract onSubscribe(): void;
  abstract getValue(): T | Promise<T>;
}
