import { expect } from 'chai';
import { EndPointManager } from '../src/EndPointManager';
import { ActuatorRestServer } from '../src/ActuatorRestServer';
import Router = require('koa-router');
import { IEndPoint } from '../src/types';

describe('EndPointManager', () => {
  it('should register() be ok', () => {
    const used = [];
    let calledRouteTime = 0;
    const server: ActuatorRestServer = {
      use(mid) {
        used.push(mid);
      },
    } as any;
    const testEndPoint: IEndPoint = {
      prefix: 'test',
      route(router) {
        expect(router).an.instanceof(Router);
        calledRouteTime++;
      },
    };
    const endPointManager = new EndPointManager(server);
    endPointManager.register(testEndPoint);
    expect(calledRouteTime).to.be.equal(1);
    expect(used.length).to.be.equal(2);
  });

  it('should register() with allPrefixes be ok', () => {
    const used = [];
    let calledRouteTime = 0;
    const server: ActuatorRestServer = {
      use(mid) {
        used.push(mid);
      },
    } as any;
    const testEndPoint: IEndPoint = {
      prefix: 'test',
      aliasPrefix: ['test1', 'test2'],
      route(router) {
        expect(router).an.instanceof(Router);
        calledRouteTime++;
      },
    };
    const endPointManager = new EndPointManager(server);
    endPointManager.register(testEndPoint);
    expect(calledRouteTime).to.be.equal(3);
    expect(used.length).to.be.equal(2 * 3);
  });
});
