import {IndicatorResultObject, IndicatorScope} from './domain';

export class IndicatorUtil {
  static mergeRawIndicatorResultRows(rows: IndicatorResultObject[]): any {

    const hitMap: Map<string, boolean> = new Map;
    const ret = [];

    for(const row of rows) {

      let key: string;

      switch (row.scope) {

        case IndicatorScope.PROCESS:
          ret.push(row);
          break;

        case IndicatorScope.APP:
          key = `${IndicatorScope.APP}##${row.appName}##${row.group}##${row.key}`;
          if(hitMap.has(key)) {
            break;
          }
          hitMap.set(key, true);
          ret.push(row);
          break;

        case IndicatorScope.SYSTEM:
          key = `${IndicatorScope.SYSTEM}##${row.group}##${row.key}`;
          if(hitMap.has(key)) {
            break;
          }
          hitMap.set(key, true);
          ret.push(row);
          break;

        default:
          ret.push(row);
          break;

      }

    }

    return ret;

  }
}