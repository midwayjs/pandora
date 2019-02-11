import * as SqlParser from '../src/patchers/wrappers/mysql/SqlParser';
import { StatementMatcher } from '../src/patchers/wrappers/mysql/StatementMatcher';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { consoleLogger } from 'pandora-dollar';
import { OPERATION_UNKNOWN } from '../src/constants';

describe('SqlParser', () => {

  it('should not support non string sql', () => {
    const spy = sinon.spy(consoleLogger, 'info');

    const res = SqlParser.parseSql({
      method: 'select',
      table: 'user'
    });

    expect(res.query).to.equal('');
    expect(res.collection).to.be.null;
    expect(res.operation).to.equal(OPERATION_UNKNOWN);

    expect(spy.calledWith(sinon.match('got an non-string sql like: ')));

    spy.restore();
  });

  it('should return default when parse statement return null', () => {
    const stub = sinon.stub(StatementMatcher.prototype, 'getParsedStatement').callsFake(() => {
      return null;
    });

    const res = SqlParser.parseSql('select * from user;');

    expect(res.query).to.equal('select * from user;');
    expect(res.collection).to.be.null;
    expect(res.operation).to.equal(OPERATION_UNKNOWN);

    stub.restore();
  });
});