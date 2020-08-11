import { Meter } from '@opentelemetry/metrics';
import { MetricOptions, Labels } from '@opentelemetry/api';

export abstract class MetricObservableSet<T = void> {
  constructor(private meter: Meter, protected interval = 5000) {}

  protected createValueObserver(
    name: string,
    next: (value: T) => [number, Labels][],
    options?: MetricOptions
  ) {
    this.meter.createValueObserver(name, options, async observerResult => {
      const intermediate = await this.getValue();
      const values = next(intermediate);
      for (const [value, labels] of values) {
        observerResult.observe(value, labels);
      }
    });
  }

  subscribe() {
    this.onSubscribe();
  }

  abstract onSubscribe(): void;
  abstract getValue(): T | Promise<T>;
}
