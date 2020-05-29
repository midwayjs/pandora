import { LogRecord, LogExporter } from './types';

export class LogProcessor {
  _logExporter: LogExporter[] = [];

  export(record: LogRecord) {
    for (const item of this._logExporter) {
      item.export([record]);
    }
  }

  addLogExporter(exporter: LogExporter) {
    this._logExporter.push(exporter);
  }
}
