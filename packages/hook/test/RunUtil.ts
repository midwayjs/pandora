export class RunUtil {
  static run(call) {
    call(function (err) {
      if (err) {
        console.error(err);
        process.send(err.toString());
      } else {
        process.send('done');
      }
    });
  }
}
