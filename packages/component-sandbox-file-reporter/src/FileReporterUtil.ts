import * as os from 'os';
import * as md5 from 'md5';
const hostname = os.hostname();
const pid = process.pid;
let seedIndex = 1;

export class FileReporterUtil {
  static unix(timestamp) {
    timestamp = timestamp || Date.now();
    return Math.floor(timestamp / 1000);
  }
  static getSeed() {
    return md5(hostname + pid + Date.now() + seedIndex ++);
  }
}

