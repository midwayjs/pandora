import { Counter, NoopMeter, Meter, ValueType } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import {
  PandoraAttribute,
  PandoraMetric,
} from '@pandorajs/semantic-conventions';
import { ExceptionExporter, Exception, ExceptionRecord } from './types';

export class ExceptionProcessor {
  private _exceptionExporter: ExceptionExporter[] = [];
  private _counter: Counter;

  constructor(
    private resource: Resource = new Resource({}),
    _meter: Meter = new NoopMeter()
  ) {
    this._counter = _meter.createCounter(PandoraMetric.EXCEPTION_RECORDED, {
      valueType: ValueType.INT,
    });
  }

  export(exception: Exception) {
    this._counter.add(1, { [PandoraAttribute.EXCEPTION_NAME]: exception.name });
    const records: ExceptionRecord[] = [
      { ...exception, resource: this.resource },
    ];
    for (const item of this._exceptionExporter) {
      item.export(records);
    }
  }

  addExceptionExporter(exporter: ExceptionExporter) {
    this._exceptionExporter.push(exporter);
  }
}
