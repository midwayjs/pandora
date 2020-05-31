import * as Debug from 'debug';
import fs = require('fs');
import { MetricObservableSet } from '../MetricObservableSet';
const debug = Debug('metrics:tcp');

const NetworkTraffic = [
  'TCP_ACTIVE_OPENS', // active opening connections
  'TCP_PASSIVE_OPENS', // passive opening connections
  'TCP_ATTEMPT_FAILS', // number of failed connection attempts
  'TCP_ESTAB_RESETS', // number of resets that have occurred at established
  'TCP_CURR_RESETS', //  TCP_CURR_RESETS
  'TCP_IN_SEGS', // incoming segments
  'TCP_OUT_SEGS', // outgoing segments
  'TCP_RETRAN_SEGS', // number of retran segements
  'TCP_IN_ERRS', // incoming segments with errs, e_g_ checksum error
  'TCP_OUT_RSTS', // outgoing segments with resets
];

const NetworkTrafficText = {
  TCP_ACTIVE_OPENS: 'tcp_active_opens',
  TCP_PASSIVE_OPENS: 'tcp_passive_opens',
  TCP_ATTEMPT_FAILS: 'tcp_attempt_fails',
  TCP_ESTAB_RESETS: 'tcp_estab_resets',
  TCP_CURR_RESETS: 'tcp_curr_resets',
  TCP_IN_SEGS: 'tcp_in_segs',
  TCP_OUT_SEGS: 'tcp_out_segs',
  TCP_RETRAN_SEGS: 'tcp_retran_segs',
  TCP_IN_ERRS: 'tcp_in_errs',
  TCP_OUT_RSTS: 'tcp_out_rsts',
};

export class TcpGaugeSet extends MetricObservableSet {
  static DEFAULT_FILE_PATH = '/proc/net/snmp';

  filePath: string = TcpGaugeSet.DEFAULT_FILE_PATH;

  networkTraffic = {};
  lastNetworkTraffic;
  lastRetranSegs = 0;
  retryRate = 0;

  onSubscribe() {
    for (const key of NetworkTraffic) {
      this.createObservable(
        NetworkTrafficText[key],
        () => this.networkTraffic[key],
        {}
      );
    }
    this.createObservable('tcp_retry_rate', () => this.retryRate, {});
  }

  async getValue() {
    let snmp;

    try {
      snmp = fs.readFileSync(this.filePath).toString().split('\n');
    } catch (e) {
      debug(e);
      return;
    }

    let columns;
    let index = 5;

    for (const line of snmp) {
      if (!~line.indexOf('Tcp:')) {
        continue;
      }
      columns = line.split(/\s/g);

      if (isNaN(parseInt(columns[1]))) {
        continue;
      }
      break;
    }

    for (const key of NetworkTraffic) {
      const value = columns[index++];
      this.networkTraffic[key] = parseInt(value);
    }

    if (!this.lastNetworkTraffic) {
      this.lastNetworkTraffic = Object.assign({}, this.networkTraffic);
    }

    this.retryRate =
      (this.networkTraffic['TCP_RETRAN_SEGS'] -
        this.lastNetworkTraffic['TCP_RETRAN_SEGS']) /
      (this.networkTraffic['TCP_OUT_SEGS'] -
        this.lastNetworkTraffic['TCP_OUT_SEGS']);
    this.lastRetranSegs = this.networkTraffic['TCP_RETRAN_SEGS'];

    this.lastNetworkTraffic = Object.assign({}, this.networkTraffic);
  }
}
