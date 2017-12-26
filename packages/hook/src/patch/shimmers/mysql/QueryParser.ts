/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 * Inspired by node-newrelic
 */
import * as is from 'is-type-of';
import { StatementMatcher } from './StatementMatcher';
const debug = require('debug')('PandoraHook:MySQL:QueryParser');

const OPERATIONS = [
  new StatementMatcher(
    'select',
    /^[^\S]*?select\b[\s\S]+?\bfrom[\s\n\r\[\(]+([^\]\s\n\r,)(;]*)/gim
  ),
  new StatementMatcher('update', /^[^\S]*?update[^\S]+?([^\s\n\r,;]+)/gim),
  new StatementMatcher(
    'insert',
    /^[^\S]*?insert(?:[^\S]+ignore)?[^\S]+into[^\S]+([^\s\n\r(,;]+)/gim
  ),
  new StatementMatcher('delete', /^[^\S]*?delete[^\S]+?from[^\S]+([^\s\n\r,(;]+)/gim)
];

const COMMENT_PATTERN = /\/\\*.*?\\*\//g;

export function parseSql(sql) {
  if (is.object(sql) && sql.sql !== undefined) sql = sql.sql;
  if (!is.string(sql)) {
    debug('got an non-string sql like: ', JSON.stringify(sql));

    return {
      operation: 'other',
      collection: null,
      query: ''
    };
  }

  sql = sql.replace(COMMENT_PATTERN, '').trim();

  let parsedStatement;

  for (let i = 0, l = OPERATIONS.length; i < l; i++) {
    parsedStatement = OPERATIONS[i].getParsedStatement(sql);
    if (parsedStatement) {
      break;
    }
  }

  if (parsedStatement) {
    return parsedStatement;
  }

  return {
    operation: 'other',
    collection: null,
    query: sql
  };
}