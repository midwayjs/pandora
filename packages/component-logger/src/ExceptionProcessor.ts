import { Counter, NoopMeter, Meter, ValueType } from '@opentelemetry/api';
import {
  PandoraAttribute,
  PandoraMetric,
} from '@pandorajs/semantic-conventions';
import { ExceptionRecord, ExceptionExporter } from './types';

export class ExceptionProcessor {
  private _exceptionExporter: ExceptionExporter[] = [];
  private _counter: Counter;

  constructor(private _meter: Meter = new NoopMeter()) {
    this._counter = _meter.createCounter(PandoraMetric.EXCEPTION_RECORDED, {
      valueType: ValueType.INT,
    });
  }

  export(record: ExceptionRecord) {
    this._counter.add(1, { [PandoraAttribute.EXCEPTION_NAME]: record.name });
    for (const item of this._exceptionExporter) {
      item.export([record]);
    }
  }

  addExceptionExporter(exporter: ExceptionExporter) {
    this._exceptionExporter.push(exporter);
  }
}
