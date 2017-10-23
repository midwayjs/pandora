import {
  IIndicator, IndicatorBuilderResult, IndicatorResultStatus, IIndicatorResult,
  IndicatorResultObject
} from '../domain';

export class IndicatorResult implements IIndicatorResult {

  private indicator: IIndicator;

  private indicatorResults: Array<IndicatorResultObject> = [];

  private status: IndicatorResultStatus = IndicatorResultStatus.DEFAULT;

  private message: string;

  constructor(indicator: IIndicator) {
    this.indicator = indicator;
  }

  setErrorMessage(err: Error) {
    this.status = IndicatorResultStatus.FAIL;
    this.message = err.message;
  }

  getErrorMessage() {
    return this.message;
  }

  setResult(results: Array<IndicatorBuilderResult>) {
    try {
      for (let builderResult of results) {
        this.indicatorResults.push(builderResult);
      }
      this.status = IndicatorResultStatus.SUCCESS;
    } catch (err) {
      this.setErrorMessage(new Error('parse results fail'));
    }
  }

  getResults() {
    return this.indicatorResults;
  }

  isSuccess() {
    return this.status === IndicatorResultStatus.SUCCESS;
  }

  getIndicatorGroup() {
    return this.indicator.group;
  }
}
