import { ExceptionRecord, ExceptionExporter } from './types';

export class ExceptionProcessor {
  _exceptionExporter: ExceptionExporter[] = [];

  export(record: ExceptionRecord) {
    for (const item of this._exceptionExporter) {
      item.export([record]);
    }
  }

  addExceptionExporter(exporter: ExceptionExporter) {
    this._exceptionExporter.push(exporter);
  }
}
