
const CLEANER = /^\(?(?:([`'"]?)(.*?)\1\.)?([`'"]?)(.*?)\3\)?$/;

export class StatementMatcher {
  operation = null;
  matcher = null;
  operationPattern = null;

  constructor(operation, operationPattern) {
    this.operation = operation;
    this.matcher = new RegExp('^\\s*' + operation, 'ig');
    this.operationPattern = operationPattern;
  }

  getParsedStatement(sql) {
    this.operationPattern.lastIndex = 0;
    this.matcher.lastIndex = 0;
    CLEANER.lastIndex = 0;

    if (this.matcher.test(sql)) {
      let queryMatch = this.operationPattern.exec(sql);
      let collection = queryMatch ? queryMatch[1] : 'unknown';
      let database = null;

      let cleanerMatch = CLEANER.exec(collection);
      if (cleanerMatch && cleanerMatch[4]) {
        collection = cleanerMatch[4];
        if (cleanerMatch[2]) {
          database = cleanerMatch[2];
          collection = database + '.' + collection;
        }
      }

      return {
        operation: this.operation,
        database: database,
        collection: collection,
        query: sql
      };
    }

    return null;
  }
}