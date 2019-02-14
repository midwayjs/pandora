import { StatementMatcher } from '../src/patchers/StatementMatcher';
import { expect } from 'chai';

describe('StatementMatcher', () => {
  it ('getParsedStatement should return null when no operation match', () => {
    const matcher = new StatementMatcher(
      'select',
      /^[^\S]*?select\b[\s\S]+?\bfrom[\s\n\r\[\(]+([^\]\s\n\r,)(;]*)/gim
    );

    const res = matcher.getParsedStatement('update user set age=1;');

    expect(res).to.be.null;
  });
});