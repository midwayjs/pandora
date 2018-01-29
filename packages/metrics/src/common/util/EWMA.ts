const INTERVAL = 5;
const SECONDS_PER_MINUTE = 60;
const ONE_MINUTE = 1;
const FIVE_MINUTES = 5;
const FIFTEEN_MINUTES = 15;
const M1_ALPHA = 1 - Math.exp(-INTERVAL / SECONDS_PER_MINUTE / ONE_MINUTE);
const M5_ALPHA = 1 - Math.exp(-INTERVAL / SECONDS_PER_MINUTE / FIVE_MINUTES);
const M15_ALPHA = 1 - Math.exp(-INTERVAL / SECONDS_PER_MINUTE / FIFTEEN_MINUTES);

/**
 * An exponentially-weighted moving average.
 *
 * @see <a href="http://www.teamquest.com/pdfs/whitepaper/ldavg1.pdf">UNIX Load Average Part 1: How
 *      It Works</a>
 * @see <a href="http://www.teamquest.com/pdfs/whitepaper/ldavg2.pdf">UNIX Load Average Part 2: Not
 *      Your Average Average</a>
 * @see <a href="http://en.wikipedia.org/wiki/Moving_average#Exponential_moving_average">EMA</a>
 */
export class EWMA {

  alpha;
  interval;
  initialized = false;
  currentRate = 0.0;
  uncounted = 0;
  tickInterval;

  constructor(alpha, interval) {
    this.alpha = alpha;
    this.interval = (interval || 5) * 1000;
  }

  /**
   * Creates a new EWMA which is equivalent to the UNIX one minute load average and which expects
   * to be ticked every 5 seconds.
   *
   * @return a one-minute EWMA
   */
  static oneMinuteEWMA() {
    return new EWMA(M1_ALPHA, INTERVAL);
  }

  /**
   * Creates a new EWMA which is equivalent to the UNIX five minute load average and which expects
   * to be ticked every 5 seconds.
   *
   * @return a five-minute EWMA
   */
  static fiveMinuteEWMA() {
    return new EWMA(M5_ALPHA, INTERVAL);
  }

  /**
   * Creates a new EWMA which is equivalent to the UNIX fifteen minute load average and which
   * expects to be ticked every 5 seconds.
   *
   * @return a fifteen-minute EWMA
   */
  static fifteenMinuteEWMA() {
    return new EWMA(M15_ALPHA, INTERVAL);
  }

  update(n) {
    this.uncounted += (n || 1);
  }

  /*
 * Update our rate measurements every interval
 */
  tick(count = this.uncounted) {
    let instantRate = count / this.interval;
    this.uncounted = 0;

    if (this.initialized) {
      this.currentRate += this.alpha * (instantRate - this.currentRate);
    } else {
      this.currentRate = instantRate;
      this.initialized = true;
    }
  }

  /*
 * Return the rate per second
 */
  getRate() {
    return this.currentRate * 1000;
  }

}





