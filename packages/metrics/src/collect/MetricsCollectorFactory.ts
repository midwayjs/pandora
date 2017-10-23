import {CompactMetricsCollector} from './CompactMetricsCollector';
import {NormalMetricsCollector} from './NormalMetricsCollector';
import {MetricFilter} from '../common/MetricFilter';

export enum CollectLevel {
  COMPACT = 'COMPACT',
  NORMAL = 'NORMAL',
  COMPLETE = 'COMPLETE',
  CLASSIFIER = 'CLASSIFIER'
}

export class MetricsCollectorFactory {

  static create(collectLevel, globalTags, rateFactor, durationFactor, filter: MetricFilter = MetricFilter.ALL) {
    switch (collectLevel) {
      case CollectLevel.COMPACT:
        return new CompactMetricsCollector(globalTags, rateFactor, durationFactor, filter);
      case CollectLevel.NORMAL:
        return new NormalMetricsCollector(globalTags, rateFactor, durationFactor, filter);
    //   case CollectLevel.CLASSIFIER:
    //     return new ClassifiedMetricsCollector(globalTags, rateFactor, durationFactor, filter);
    //   case CollectLevel.COMPLETE:
    //     // FIXME: currently not supported
    //     throw new UnsupportedOperationException("Currently not supported!");
    //   default:
    //     throw new Error("Unsupported CollectLevel: " + collectLevel);
    }

    return new CompactMetricsCollector(globalTags, rateFactor, durationFactor, filter);
  }
}
