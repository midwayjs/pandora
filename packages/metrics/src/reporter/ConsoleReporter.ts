import {ScheduledMetricsReporter} from './ScheduledMetricsReporter';
import {MetricName} from '../common/MetricName';

export class ConsoleReporter extends ScheduledMetricsReporter {

  async report(metricsData) {
    let {gauges, counters, histograms, meters, timers} = metricsData;

    if (gauges.size) {
      printWithBanner('-- Gauges');
      for (let [key, gauge] of gauges.entries()) {
        await printGauge(key, gauge);
      }
      console.log();
    }

    if(counters.size) {
      printWithBanner('-- Counters');
      for (let [key, counter] of counters.entries()) {
        printCounter(key, counter);
      }
      console.log();
    }

    if(meters.size) {
      printWithBanner('-- Meters');
      for (let [key, meter] of meters.entries()) {
        printMeter(key, meter);
      }
      console.log();
    }

    if(timers.size) {
      printWithBanner('-- Timers');
      for (let [key, timer] of timers.entries()) {
        // Don't log timer if its recorded no metrics.
        // if(timer.min() != null) {
          printTimer(key, timer);
        // }
      }
      console.log();
    }

    if(histograms.size) {
      printWithBanner('-- Histograms');
      for (let [key, histogram] of histograms.entries()) {
        // Don't log timer if its recorded no metrics.
        // if(histogram.min() != null) {
          printHistogram(key, histogram);
        // }
      }
      console.log();
    }
  }
}

function printWithBanner(name) {
  let dashLength = 80 - name.length - 1;
  let dashes = '';
  for (let i = 0; i < dashLength; i++) {
    dashes += '-';
  }
  console.log('%s %s', name, dashes);
}

function printMetricName(name) {
  let metricName = MetricName.parseKey(name);
  console.log(`${metricName.getKey()} - ${JSON.stringify(metricName.getTags())}`);
}


function ff(value) {
  value = value || 0;
  let fixed = value.toFixed(2);
  return fixed >= 10 || fixed < 0 ? fixed : ' ' + fixed;
}

async function printGauge(name, gague) {
  printMetricName(name);
  console.log('             gauge = %s', await gague.getValue());
}

function printCounter(name, counter) {
  printMetricName(name);
  console.log('             count = %d', counter.count);
}

function printMeter(name, meter) {
  printMetricName(name);
  console.log('             count = %d', meter.count);
  console.log('         mean rate = %s events/%s', ff(meter.getMeanRate()), 'second');
  console.log('     1-minute rate = %s events/%s', ff(meter.getOneMinuteRate()), 'second');
  console.log('     5-minute rate = %s events/%s', ff(meter.getFiveMinuteRate()), 'second');
  console.log('    15-minute rate = %s events/%s', ff(meter.getFifteenMinuteRate()), 'second');
}

function printTimer(name, timer) {
  printMetricName(name);
  // console.log('             count = %d', timer.count());
  // console.log('         mean rate = %s events/%s', ff(timer.getMeanRate()), 'second');
  // console.log('     1-minute rate = %s events/%s', ff(timer.getOneMinuteRate()), 'second');
  // console.log('     5-minute rate = %s events/%s', ff(timer.getFiveMinuteRate()), 'second');
  // console.log('    15-minute rate = %s events/%s', ff(timer.getFifteenMinuteRate()), 'second');

  printHistogram(name, timer);
}

function printHistogram(name, histogram) {
  // let isHisto = Object.getPrototypeOf(histogram) === BaseHistogram.prototype;
  // if (isHisto) {
  //   // log name and count if a histogram, otherwise assume this metric is being
  //   // printed as part of another (like a timer).
  //   console.log(histogram.name);
  //   console.log('             count = %d', histogram.count);
  // }
  //
  // let percentiles = histogram.percentiles([.50, .75, .95, .98, .99, .999]);
  // // assume timer if not a histogram, in which case we include durations.
  // let durationUnit = isHisto ? '' : ' milliseconds';
  //
  // console.log('               min = %s%s', ff(isHisto ? histogram.min : histogram.min()), durationUnit);
  // console.log('               max = %s%s', ff(isHisto ? histogram.max : histogram.max()), durationUnit);
  // console.log('              mean = %s%s', ff(histogram.mean()), durationUnit);
  // console.log('            stddev = %s%s', ff(histogram.stdDev()), durationUnit);
  // console.log('              50%% <= %s%s', ff(percentiles[.50]), durationUnit);
  // console.log('              75%% <= %s%s', ff(percentiles[.75]), durationUnit);
  // console.log('              95%% <= %s%s', ff(percentiles[.95]), durationUnit);
  // console.log('              98%% <= %s%s', ff(percentiles[.98]), durationUnit);
  // console.log('              99%% <= %s%s', ff(percentiles[.99]), durationUnit);
  // console.log('            99.9%% <= %s%s', ff(percentiles[.999]), durationUnit);
}
