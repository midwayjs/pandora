import * as utils from '../src/utils';
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as url from 'url';

describe('utils', () => {

  describe('extractPath', () => {

    it('should use default path / when pathname is null', () => {

      const stub = sinon.stub(url, 'parse').callsFake(() => {
        return {};
      });

      const res = utils.extractPath('http://www.taobao.com');

      expect(res).to.equal('/');

      stub.restore();
    });

    it('should slice last /', () => {
      const res = utils.extractPath('http://www.taobao.com/test/');

      expect(res).to.equal('/test');
    });
  });

  describe('getDatabaseConfigFromQuery', () => {

    it('should get database name', () => {
      const res = utils.getDatabaseConfigFromQuery('use user;');

      expect(res).to.equal('user');
    });
  });

  describe('urlToOptions', () => {

    it('should support hostname like [xxx]', () => {
      const res = utils.urlToOptions(<any>{
        hostname: '[127.0.0.1]'
      });

      expect(res.hostname).to.equal('127.0.0.1');
    });

    it('should convert string port to number', () => {
      const res = utils.urlToOptions(<any>{
        hostname: '',
        port: '80'
      });

      expect(res.port).to.equal(80);
    });

    it('should support url with auth info', () => {
      const res = utils.urlToOptions(<any>{
        hostname: '',
        username: 'test',
        password: 'test'
      });

      expect(res.auth).to.equal('test:test');
    });
  });

  describe('recordError', () => {
    it('should support not record error', () => {
      const log = new Map();
      const span = {
        log(content) {
          Object.keys(content).forEach((key) => {
            log.set(key, content[key]);
          });
        }
      };

      utils.recordError(<any>span, null, false);
      utils.recordError(<any>span, <any>'test', false);

      expect(log.get('error')).to.not.exist;
    });

    it('should support record error detail', () => {
      const log = new Map();
      const span = {
        log(content) {
          Object.keys(content).forEach((key) => {
            log.set(key, content[key]);
          });
        }
      };

      utils.recordError(<any>span, new Error('test'), true);

      expect(log.get('error')).to.equal('[Error] test');
      expect(log.get('errorStack')).to.exist;
    });
  });

  describe('isURL', () => {

    it('should isURL well', () => {
      const stub = sinon.stub(process, 'version').value('6.0.0');

      expect(utils.isURL({})).to.equal(false);

      stub.restore();
    });
  });

  describe('setInternalProperty', () => {

    it('should setInternalProperty well', () => {
      const obj = {
        a: 1
      };

      utils.setInternalProperty(obj, '__readonly__', 2);

      function setValue(obj, target, value) {
        obj[target] = value;
      }

      try {
        expect(setValue(obj, '__readonly__', 3)).to.throws('TypeError');
      } catch(e) {}

      utils.setInternalProperty(obj, '__writable__', 3, true);

      expect(setValue(obj, '__writable__', 4)).not.throws;

      expect(Object.keys(obj).length).to.equal(1);
    });
  });
});