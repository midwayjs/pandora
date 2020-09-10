import {
  ArmsRegisterClient,
  ServiceInstance,
  Response,
  BatchStringMeta,
  Code,
} from '../src/types';
import * as grpc from 'grpc';

export class TestArmsClient implements ArmsRegisterClient {
  registerServiceInstance(
    serviceInstance: ServiceInstance,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ) {
    process.nextTick(() => {
      callback(null, { success: true, code: Code.OK, msg: 'ok' });
    });
  }

  registerBatchStringMeta(
    batchStringMeta: BatchStringMeta,
    metadata: grpc.Metadata | undefined,
    callback: (error: Error, response: Response) => void
  ) {
    process.nextTick(() => {
      callback(null, { success: true, code: Code.OK, msg: 'ok' });
    });
  }
}
