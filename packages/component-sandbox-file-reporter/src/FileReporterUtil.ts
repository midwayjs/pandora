export class FileReporterUtil {
  static unix(timestamp) {
    timestamp = timestamp || Date.now();
    return Math.floor(timestamp / 1000);
  }
}