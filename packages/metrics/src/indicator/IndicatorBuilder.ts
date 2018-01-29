import {IBuilder, IndicatorScope, IndicatorBuilderResult} from '../domain';
const util = require('util');

const KEY_SPLIT = '|';

const STR_MAP = {
  system: IndicatorScope.SYSTEM,
  SYSTEM: IndicatorScope.SYSTEM,
  app: IndicatorScope.APP,
  APP: IndicatorScope.APP,
  process: IndicatorScope.PROCESS,
  PROCESS: IndicatorScope.PROCESS,
};

export class PrettyBuilderObject {

  private value;
  private format;

  constructor(format, value) {
    this.format = format;
    this.value = value;
  }

  getOriginValue() {
    return this.value;
  }

  getValue() {
    return util.format(this.format, this.value);
  }

}

export class IndicatorBuilder implements IBuilder {

  protected details: Map<string, IndicatorBuilderResult> = new Map();
  private prettyMode = false;

  withDetail(key: string, data: any, scope: IndicatorScope | 'system' | 'SYSTEM' | 'app' | 'APP' | 'process' | 'PROCESS' = IndicatorScope.APP): IBuilder {

    let scope2 = typeof scope === 'string' ? STR_MAP[scope] : scope;

    this.details.set(IndicatorBuilder.getKey(key, scope2), {
      key: key,
      data: data,
      scope: scope2,
    });
    return this;
  }

  getDetails(): Array<IndicatorBuilderResult> {
    let results = [];
    for (let value of this.details.values()) {
      results.push(value);
    }
    return results;
  }

  static getKey(key, scope) {
    return [key, scope].join(KEY_SPLIT);
  }

  pretty(format, value) {
    let prettyData = new PrettyBuilderObject(format, value);
    if(this.prettyMode) {
      return prettyData.getValue();
    } else {
      return prettyData.getOriginValue();
    }
  }

  setPrettyMode(prettyMode) {
    this.prettyMode = prettyMode;
  }
}
